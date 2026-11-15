import { describe, expect, it } from 'vitest';
import { cameraTransform, coverRect, cropPosition, maskRect, sourceToStage, STAGE } from './stage';

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

  it('reads each track its own crop position', () => {
    expect(cropPosition('screen', layout)).toEqual({ x: 20, y: 70 });
    expect(cropPosition('camera', layout)).toEqual({ x: 80, y: 25 });
  });

  it('cover-fits a wide source by cropping its sides at the crop position', () => {
    // 1920x1080 into 362x700: height limits, scale 700/1080, width 1244.44, overflow 882.44
    const cover = coverRect(
      { width: 362, height: 700 },
      { width: 1920, height: 1080 },
      { x: 80, y: 25 },
    );
    expect(cover.scale).toBeCloseTo(700 / 1080, 10);
    expect(cover.width).toBeCloseTo(1244.444, 3);
    expect(cover.height).toBeCloseTo(700, 10);
    expect(cover.x).toBeCloseTo(-705.956, 3);
    expect(cover.y).toBeCloseTo(0, 10);
  });

  it('cover-fits a tall source by cropping top and bottom', () => {
    // 720x1280 into 880x700: width limits, scale 880/720, height 1564.44, overflow 864.44
    const cover = coverRect(
      { width: 880, height: 700 },
      { width: 720, height: 1280 },
      { x: 20, y: 70 },
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
    const cover = coverRect(mask, { width: 1760, height: 700 }, { x: 25, y: 50 });
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
