import { describe, expect, it } from 'vitest';
import { cameraTransform, clipRect, cropPosition, maskRect, sourceToStage, STAGE } from './stage';

const layout = { radius: 22, screenX: 20, screenY: 70, cameraX: 80, cameraY: 25 };

describe('laying out the stage', () => {
  it('places the screen and camera masks, and swaps their sides', () => {
    expect(STAGE).toEqual({ width: 1280, height: 720 });
    expect(maskRect('screen', layout)).toEqual({ x: 10, y: 10, width: 880, height: 700 });
    expect(maskRect('camera', layout)).toEqual({ x: 908, y: 10, width: 362, height: 700 });
    const swapped = { ...layout, swapped: true };
    expect(maskRect('screen', swapped)).toEqual({ x: 390, y: 10, width: 880, height: 700 });
    expect(maskRect('camera', swapped)).toEqual({ x: 10, y: 10, width: 362, height: 700 });
  });

  it('in PiP, fills the stage with the screen and insets a 16:9 third-width camera in a corner', () => {
    // Usable width 1260, so the inset is 420 × 236.25, 10 px inside the screen's corner.
    const pip = { ...layout, mode: 'pip' as const };
    const inset = { width: 420, height: 236.25 };
    for (const swapped of [false, true])
      expect(maskRect('screen', { ...pip, swapped })).toEqual({
        x: 10,
        y: 10,
        width: 1260,
        height: 700,
      });
    expect(maskRect('camera', pip)).toEqual({ x: 840, y: 463.75, ...inset });
    expect(maskRect('camera', { ...pip, corner: 'top-left' })).toEqual({ x: 20, y: 20, ...inset });
    expect(maskRect('camera', { ...pip, corner: 'top-right' })).toEqual({
      x: 840,
      y: 20,
      ...inset,
    });
    expect(maskRect('camera', { ...pip, corner: 'bottom-left' })).toEqual({
      x: 20,
      y: 463.75,
      ...inset,
    });
    // Actual pixels scale the same geometry.
    expect(maskRect('camera', pip, { width: 1920, height: 1080 })).toEqual({
      x: 1260,
      y: 695.625,
      width: 630,
      height: 354.375,
    });
  });

  it('gives a background the whole actual stage and a centered crop, whatever the layout', () => {
    for (const size of [STAGE, { width: 1920, height: 1080 }, { width: 3840, height: 2160 }])
      for (const swapped of [false, true])
        expect(maskRect('background', { ...layout, swapped }, size)).toEqual({
          x: 0,
          y: 0,
          ...size,
        });
    expect(cropPosition('background', layout)).toEqual({ x: 50, y: 50 });
  });

  it('uses actual HD and 4K pixels without changing normalized crop or zoom geometry', () => {
    const cases = [
      [
        1920,
        1080,
        { x: 585, y: 15, width: 1320, height: 1050 },
        { x: 15, y: 15, width: 543, height: 1050 },
      ],
      [
        3840,
        2160,
        { x: 1170, y: 30, width: 2640, height: 2100 },
        { x: 30, y: 30, width: 1086, height: 2100 },
      ],
    ] as const;
    for (const [width, height, screen, camera] of cases) {
      const swapped = { ...layout, swapped: true };
      expect(maskRect('screen', swapped, { width, height })).toEqual(screen);
      expect(maskRect('camera', swapped, { width, height })).toEqual(camera);
      const cover = clipRect(screen, { width: 1760, height: 700 }, { x: 25, y: 50 }, {});
      const point = sourceToStage({ x: 0.5, y: 0.5 }, screen, cover, { scale: 2, x: 10, y: 0 });
      expect(point.x / width).toBeCloseTo(1358 / 1280);
      expect(point.y / height).toBeCloseTo(0.5);
      expect(cropPosition('screen', swapped)).toEqual({ x: 20, y: 70 });
    }
  });

  it('reads each track its own crop position', () => {
    expect(cropPosition('screen', layout)).toEqual({ x: 20, y: 70 });
    expect(cropPosition('camera', layout)).toEqual({ x: 80, y: 25 });
  });

  it('cover-fits a wide source by cropping its sides at the crop position', () => {
    // 1920x1080 into 362x700: height limits, scale 700/1080, width 1244.44, overflow 882.44
    const cover = clipRect(
      { width: 362, height: 700 },
      { width: 1920, height: 1080 },
      { x: 80, y: 25 },
      {},
    );
    expect(cover.scale).toBeCloseTo(700 / 1080, 10);
    expect(cover.width).toBeCloseTo(1244.444, 3);
    expect(cover.height).toBeCloseTo(700, 10);
    expect(cover.x).toBeCloseTo(-705.956, 3);
    expect(cover.y).toBeCloseTo(0, 10);
  });

  it('cover-fits a tall source by cropping top and bottom', () => {
    // 720x1280 into 880x700: width limits, scale 880/720, height 1564.44, overflow 864.44
    const cover = clipRect(
      { width: 880, height: 700 },
      { width: 720, height: 1280 },
      { x: 20, y: 70 },
      {},
    );
    expect(cover.x).toBeCloseTo(0, 10);
    expect(cover.y).toBeCloseTo(-605.111, 3);
  });
});

describe('projecting through the zoom camera', () => {
  const mask = { x: 390, y: 10, width: 880, height: 700 };

  it('leaves mask pixels where they are without a zoom', () => {
    expect(cameraTransform(mask, { scale: 1, x: 0, y: 0 })).toEqual({ scale: 1, x: 390, y: 10 });
  });

  it('holds a marked focus at the mask centre while zoomed', () => {
    // zoomCamera at the hold of a 2x zoom focused on 25%, 65% yields x 50, y -30 (percent of mask)
    const camera = { scale: 2, x: 50, y: -30 };
    const transform = cameraTransform(mask, camera);
    expect(transform).toEqual({ scale: 2, x: 390, y: -550 });
    const focus = { x: 0.25 * 880, y: 0.65 * 700 };
    expect(focus.x * transform.scale + transform.x).toBeCloseTo(390 + 440, 10);
    expect(focus.y * transform.scale + transform.y).toBeCloseTo(10 + 350, 10);
  });

  it('maps a normalized source point through crop and zoom to stage pixels', () => {
    // 1760x700 source in the 880x700 mask: scale 1, 880px overflow, crop position 25% shifts -220
    const cover = clipRect(mask, { width: 1760, height: 700 }, { x: 25, y: 50 }, {});
    const still = { scale: 1, x: 0, y: 0 };
    expect(sourceToStage({ x: 0.5, y: 0.5 }, mask, cover, still)).toEqual({ x: 1050, y: 360 });
    expect(sourceToStage({ x: 0.125, y: 0 }, mask, cover, still)).toEqual({ x: 390, y: 10 });
    // 2x about the mask centre (830, 360), then panned 10% of the mask width to the right
    expect(sourceToStage({ x: 0.5, y: 0.5 }, mask, cover, { scale: 2, x: 10, y: 0 })).toEqual({
      x: 830 + (1050 - 830) * 2 + 88,
      y: 360,
    });
  });
});

describe('sizing a clip in its mask', () => {
  const mask = { width: 880, height: 700 };
  const wide = { width: 1080, height: 720 }; // 3:2, wider than the mask
  const crop = { x: 20, y: 70 };

  it('fits the whole source, centred, whatever the crop position', () => {
    // 880/1080 limits: 880 x 586.67, letterboxed 56.67 above and below.
    const fit = clipRect(mask, wide, crop, { fit: 'contain' });
    expect(fit.x).toBeCloseTo(0, 6);
    expect(fit.y).toBeCloseTo(56.667, 3);
    expect(fit.width).toBeCloseTo(880, 6);
    expect(fit.height).toBeCloseTo(586.667, 3);
    expect(fit.width / fit.height).toBeCloseTo(1.5, 9);
    // Half size stays centred: 440 x 293.33 at (220, 203.33).
    const half = clipRect(mask, wide, crop, { fit: 'contain', scale: 0.5 });
    expect([half.x, half.y, half.width, half.height].map((v) => +v.toFixed(3))).toEqual([
      220, 203.333, 440, 293.333,
    ]);
  });

  it('scales Fill about the mask centre', () => {
    // 1920x1080 into 362x700 at crop (80, 25): cover is 1244.44 x 700 at x -705.96. At 150% it
    // grows about the mask centre (181, 350): x 181 + (-705.96 - 181) * 1.5, y 350 - 350 * 1.5.
    const fill = clipRect(
      { width: 362, height: 700 },
      { width: 1920, height: 1080 },
      { x: 80, y: 25 },
      { fit: 'cover', scale: 1.5 },
    );
    expect(fill.x).toBeCloseTo(-1149.433, 3);
    expect(fill.y).toBeCloseTo(-175, 6);
    expect(fill.width).toBeCloseTo(1866.667, 3);
    expect(fill.height).toBeCloseTo(1050, 6);
  });

  it('scales with the render size and never by its own scale twice', () => {
    // The same fit at 1.5x (HD) is the normalized rect times 1.5.
    const hd = clipRect({ width: 1320, height: 1050 }, wide, crop, { fit: 'contain', scale: 0.5 });
    expect([hd.x, hd.y, hd.width, hd.height].map((v) => +v.toFixed(3))).toEqual([
      330, 305, 660, 440,
    ]);
  });
});
