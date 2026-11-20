import { describe, expect, it } from 'vitest';
import {
  cameraTransform,
  clampMask,
  clipRect,
  cropPosition,
  defaultMaskRect,
  fillCss,
  gradientLine,
  MASK_MIN,
  maskRect,
  maskShadowCss,
  panelShadow,
  sourceToStage,
  STAGE,
  stageValueFromText,
  withBackdropStyle,
  withMaskBounds,
  withShadow,
} from './stage';

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

  it('pads the stage and re-splits the side-by-side masks by the layout geometry', () => {
    // Padding 40: usable 1280-80-18 = 1182; share 1/2 splits it 591/591.
    const padded = { ...layout, padding: 40, screenShare: 0.5 };
    expect(maskRect('screen', padded)).toEqual({ x: 40, y: 40, width: 591, height: 640 });
    expect(maskRect('camera', padded)).toEqual({ x: 649, y: 40, width: 591, height: 640 });
    const swapped = { ...padded, swapped: true };
    expect(maskRect('screen', swapped)).toEqual({ x: 649, y: 40, width: 591, height: 640 });
    expect(maskRect('camera', swapped)).toEqual({ x: 40, y: 40, width: 591, height: 640 });
    // Share 3/4 at today's padding: usable 1242, so 931.5/310.5.
    const wide = { ...layout, screenShare: 0.75 };
    expect(maskRect('screen', wide)).toEqual({ x: 10, y: 10, width: 931.5, height: 700 });
    expect(maskRect('camera', wide)).toEqual({ x: 959.5, y: 10, width: 310.5, height: 700 });
  });

  it('sizes the PiP inset from the stage share, padding inside the fuller stage', () => {
    // Padding 20: usable 1240x680; a 1/2 inset is 620 x 348.75, 20 inside the screen's corner.
    const pip = { ...layout, mode: 'pip' as const, padding: 20, pipSize: 0.5 };
    const inset = { width: 620, height: 348.75 };
    expect(maskRect('screen', pip)).toEqual({ x: 20, y: 20, width: 1240, height: 680 });
    expect(maskRect('camera', pip)).toEqual({ x: 620, y: 331.25, ...inset });
    expect(maskRect('camera', { ...pip, corner: 'top-left' })).toEqual({ x: 40, y: 40, ...inset });
    // Actual pixels scale the same geometry.
    expect(maskRect('camera', pip, { width: 1920, height: 1080 })).toEqual({
      x: 930,
      y: 496.875,
      width: 930,
      height: 523.125,
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

  it('places custom mask bounds over the proportional geometry, clamped on stage', () => {
    const custom = {
      ...layout,
      screenMask: { x: 100, y: 60, width: 500, height: 400 },
      cameraMask: { x: 900, y: 300, width: 300, height: 300 },
    };
    expect(maskRect('screen', custom)).toEqual({ x: 100, y: 60, width: 500, height: 400 });
    expect(maskRect('camera', custom)).toEqual({ x: 900, y: 300, width: 300, height: 300 });
    // The other role keeps the proportional geometry, and bounds hold in PiP too.
    expect(maskRect('camera', { ...custom, cameraMask: undefined })).toEqual({
      x: 908,
      y: 10,
      width: 362,
      height: 700,
    });
    expect(maskRect('screen', { ...custom, mode: 'pip' as const })).toEqual(custom.screenMask);
    // Actual pixels scale the same bounds.
    expect(maskRect('screen', custom, { width: 1920, height: 1080 })).toEqual({
      x: 150,
      y: 90,
      width: 750,
      height: 600,
    });
  });

  it('clamps custom bounds so a mask can never invert or leave the stage', () => {
    expect(clampMask({ x: -50, y: -20, width: 500, height: 400 })).toEqual({
      x: 0,
      y: 0,
      width: 500,
      height: 400,
    });
    // A right/bottom overflow pulls the origin back, keeping the size.
    expect(clampMask({ x: 1200, y: 700, width: 500, height: 400 })).toEqual({
      x: 780,
      y: 320,
      width: 500,
      height: 400,
    });
    // Sides below MASK_MIN grow to it; sides past the stage shrink to it.
    expect(clampMask({ x: 10, y: 10, width: 3, height: 0 })).toEqual({
      x: 10,
      y: 10,
      width: MASK_MIN,
      height: MASK_MIN,
    });
    expect(clampMask({ x: 0, y: 0, width: 9999, height: 9999 })).toEqual({ x: 0, y: 0, ...STAGE });
    // maskRect clamps too, so a hand-edited file cannot draw off stage.
    expect(
      maskRect('screen', { ...layout, screenMask: { x: 1200, y: 0, width: 500, height: 100 } }),
    ).toEqual({ x: 780, y: 0, width: 500, height: 100 });
  });

  it('writes custom bounds with withMaskBounds and removes them back at the default', () => {
    const bounds = { x: 100, y: 60, width: 500, height: 400 };
    const moved = withMaskBounds(layout, 'screen', bounds);
    expect(moved.screenMask).toEqual(bounds);
    expect(moved.cameraMask).toBeUndefined();
    // Bounds equal to the proportional geometry remove the field again.
    expect(
      withMaskBounds(moved, 'screen', defaultMaskRect('screen', layout)).screenMask,
    ).toBeUndefined();
    // Clamped input still compares against the default after clamping.
    expect(
      withMaskBounds(layout, 'screen', { x: 10.2, y: 10.1, width: 880.2, height: 700.1 })
        .screenMask,
    ).toBeUndefined();
    // The camera's own default, in PiP its corner inset.
    const pip = { ...layout, mode: 'pip' as const };
    expect(defaultMaskRect('camera', pip)).toEqual({
      x: 840,
      y: 463.75,
      width: 420,
      height: 236.25,
    });
    const pinned = withMaskBounds(pip, 'camera', { x: 40, y: 40, width: 420, height: 236.25 });
    expect(pinned.cameraMask).toEqual({ x: 40, y: 40, width: 420, height: 236.25 });
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

describe('the stage backdrop', () => {
  it("draws today's colour without a fill, a solid colour, or a gradient by its CSS angle", () => {
    expect(fillCss(layout)).toBe('#172324');
    expect(fillCss({ ...layout, fill: '#336699' })).toBe('#336699');
    expect(fillCss({ ...layout, fill: '#3b2a6b', fillTo: '#172324' })).toBe(
      'linear-gradient(135deg, #3b2a6b, #172324)',
    );
    expect(fillCss({ ...layout, fill: '#000000', fillTo: '#ffffff', fillAngle: 30 })).toBe(
      'linear-gradient(30deg, #000000, #ffffff)',
    );
  });

  it('runs the gradient line corner to corner like CSS, on a stage that is not square', () => {
    const round = (line: ReturnType<typeof gradientLine>) =>
      Object.fromEntries(Object.entries(line).map(([k, v]) => [k, Math.round(v * 10) / 10]));
    // 0 points up and 90 right: the line is as long as the side it runs along.
    expect(round(gradientLine(0, STAGE))).toEqual({ x0: 640, y0: 720, x1: 640, y1: 0 });
    expect(round(gradientLine(90, STAGE))).toEqual({ x0: 0, y0: 360, x1: 1280, y1: 360 });
    // 135 starts at the top-left corner's perpendicular and ends past the bottom-right one.
    expect(round(gradientLine(135, STAGE))).toEqual({ x0: 140, y0: -140, x1: 1140, y1: 860 });
    // 30: length 1280 sin 30 + 720 cos 30 = 1263.5, from lower left of centre to upper right.
    expect(round(gradientLine(30, STAGE))).toEqual({ x0: 324.1, y0: 907.1, x1: 955.9, y1: -187.1 });
  });

  it('sizes the panel shadow from one strength, scaled to the render size, and has none at 0', () => {
    expect(panelShadow(undefined, 1)).toBeUndefined();
    expect(panelShadow(0, 2)).toBeUndefined();
    expect(panelShadow(50, 1)).toEqual({ blur: 30, offsetY: 10, color: 'rgba(0, 0, 0, 0.5)' });
    expect(panelShadow(50, 3)).toEqual({ blur: 90, offsetY: 30, color: 'rgba(0, 0, 0, 0.5)' });
  });

  it('shadows a masked panel but never the Background, and only when the layout has one', () => {
    const shaded = { ...layout, shadow: 50 };
    expect(maskShadowCss('screen', shaded, 1.5)).toBe('0 15px 45px rgba(0, 0, 0, 0.5)');
    expect(maskShadowCss('camera', shaded, 1)).toBe('0 10px 30px rgba(0, 0, 0, 0.5)');
    expect(maskShadowCss('background', shaded, 1)).toBeUndefined();
    expect(maskShadowCss('screen', layout, 1)).toBeUndefined();
  });

  it('switches the backdrop style and the shadow without leaving stale fields', () => {
    const gradient = withBackdropStyle(layout, 'gradient');
    expect(gradient).toMatchObject({ fill: '#3b2a6b', fillTo: '#172324' });
    // An existing start colour stays; going back to solid keeps it and drops the end and angle.
    const edited = { ...gradient, fill: '#112233', fillAngle: 200 };
    expect(withBackdropStyle(edited, 'solid')).toEqual({ ...layout, fill: '#112233' });
    expect(withBackdropStyle({ ...layout, fill: '#445566' }, 'gradient').fill).toBe('#445566');
    expect(withShadow(layout, 30)).toEqual({ ...layout, shadow: 30 });
    expect(withShadow({ ...layout, shadow: 30 }, 0)).toEqual(layout);
    expect('shadow' in withShadow({ ...layout, shadow: 30 }, 0)).toBe(false);
  });

  it('parses a stage field as a rounded number clamped at commit, undefined when no number', () => {
    expect(stageValueFromText('60', 50, 80)).toBe(60);
    expect(stageValueFromText('500', 50, 80)).toBe(80);
    expect(stageValueFromText('3', 50, 80)).toBe(50);
    expect(stageValueFromText(' 71 ', 50, 80)).toBe(71);
    expect(stageValueFromText('60.6', 0, 120)).toBe(61);
    expect(stageValueFromText('', 50, 80)).toBeUndefined();
    expect(stageValueFromText('abc', 50, 80)).toBeUndefined();
  });
});
