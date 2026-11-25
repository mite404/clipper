import { describe, expect, it } from 'vitest';
import {
  MASK_LIMITS,
  activeMasks,
  clampMaskRect,
  maskOnStage,
  maskStrengthPx,
  validateMask,
  type Mask,
} from './masks';
import { MAX_FRAMES } from './timeline-model';

// Loosely typed on purpose: the tests build the invalid masks the validator must refuse.
const mask = (over: Record<string, unknown> = {}): Mask =>
  ({
    id: 'm1',
    start: 30,
    duration: 60,
    kind: 'solid',
    x: 0.25,
    y: 0.5,
    width: 0.5,
    height: 0.25,
    opacity: 1,
    ...over,
  }) as Mask;

// Blur and pixelate are always fully applied, so they carry a strength and no opacity.
const strong = (kind: 'blur' | 'pixelate', strength: number, over: Record<string, unknown> = {}) =>
  mask({ kind, strength, opacity: undefined, ...over });

describe('activeMasks', () => {
  it('holds a mask from its first frame up to, not including, start + duration', () => {
    const list = [mask()];
    const ids = (frame: number) => activeMasks(list, frame).map((m) => m.id);
    expect([29, 30, 31, 89, 90, 91].map(ids)).toEqual([[], ['m1'], ['m1'], ['m1'], [], []]);
  });

  it('keeps overlapping masks, in list order, and none when nothing is live', () => {
    const list = [mask({ id: 'a' }), mask({ id: 'b', start: 60 }), mask({ id: 'c', start: 200 })];
    expect(activeMasks(list, 70).map((m) => m.id)).toEqual(['a', 'b']);
    expect(activeMasks(list, 150)).toEqual([]);
    expect(activeMasks([], 0)).toEqual([]);
  });
});

describe('maskOnStage', () => {
  const panel = { x: 100, y: 50, width: 800, height: 400 };

  it('maps panel fractions to the stage rect at camera scale 1, and with no camera', () => {
    const want = { x: 300, y: 250, width: 400, height: 100 };
    expect(maskOnStage(mask(), panel, { scale: 1, x: 0, y: 0 })).toEqual(want);
    expect(maskOnStage(mask(), panel)).toEqual(want);
  });

  it('grows about the panel centre at camera scale 2, so the mask follows the content', () => {
    // The panel centre is (500, 250). The mask's local corner (200, 200) lands at
    // 500 + (200 - 400) * 2 = 100 on x, and 250 + (200 - 200) * 2 = 250 on y.
    expect(maskOnStage(mask(), panel, { scale: 2, x: 0, y: 0 })).toEqual({
      x: 100,
      y: 250,
      width: 800,
      height: 200,
    });
  });

  it('pans with the camera, in percent of the panel size', () => {
    const still = maskOnStage(mask(), panel, { scale: 2, x: 0, y: 0 });
    const panned = maskOnStage(mask(), panel, { scale: 2, x: -10, y: 5 });
    expect([panned.x - still.x, panned.y - still.y]).toEqual([-80, 20]);
    expect([panned.width, panned.height]).toEqual([still.width, still.height]);
  });
});

describe('maskStrengthPx', () => {
  const panel = { x: 100, y: 50, width: 800, height: 400 };

  it('is the strength as a fraction of the panel width, so every output size gets the same look', () => {
    expect(maskStrengthPx(strong('blur', 0.02), panel)).toBe(16);
    expect(maskStrengthPx(strong('pixelate', 0.05), panel)).toBe(40);
    // The same panel at twice the render size doubles the pixels, not the look.
    const big = { ...panel, width: 1600, height: 800 };
    expect(maskStrengthPx(strong('blur', 0.02), big)).toBe(32);
  });

  it('grows with the zoom camera, since the content it hides grows too', () => {
    expect(maskStrengthPx(strong('blur', 0.02), panel, { scale: 2, x: 5, y: -5 })).toBe(32);
    expect(maskStrengthPx(strong('blur', 0.02), panel, { scale: 1, x: 0, y: 0 })).toBe(16);
  });

  it('has none for solid and spotlight', () => {
    expect(maskStrengthPx(mask(), panel)).toBeUndefined();
    expect(maskStrengthPx(mask({ kind: 'spotlight' }), panel)).toBeUndefined();
  });
});

describe('clampMaskRect', () => {
  it('pulls a rect back inside the panel without changing a rect already inside', () => {
    expect(clampMaskRect(mask())).toEqual(mask());
    const spill = clampMaskRect(mask({ x: 0.8, y: -0.2, width: 0.5, height: 0.4 }));
    expect([spill.x, spill.y, spill.width, spill.height]).toEqual([0.5, 0, 0.5, 0.4]);
  });

  it('keeps at least the minimum size, and never more than the panel', () => {
    const tiny = clampMaskRect(mask({ x: 0.999, y: 0.5, width: 0, height: -1 }));
    expect(tiny.width).toBe(MASK_LIMITS.minSize);
    expect(tiny.height).toBe(MASK_LIMITS.minSize);
    expect(tiny.x + tiny.width).toBeLessThanOrEqual(1);
    const huge = clampMaskRect(mask({ x: 0.3, y: 0.3, width: 9, height: 9 }));
    expect([huge.x, huge.y, huge.width, huge.height]).toEqual([0, 0, 1, 1]);
  });
});

describe('validateMask', () => {
  it('returns a good mask unchanged, for both kinds and at the limits', () => {
    for (const ok of [
      mask(),
      mask({ kind: 'spotlight', opacity: 0.4 }),
      mask({ start: 0, duration: MASK_LIMITS.minFrames, opacity: 1 }),
      mask({ x: 0, y: 0, width: 1, height: 1 }),
      mask({ start: MAX_FRAMES - 10, duration: 10 }),
      strong('blur', 0.03),
      strong('pixelate', 0.03),
      strong('blur', MASK_LIMITS.minStrength),
      strong('pixelate', MASK_LIMITS.maxStrength),
    ])
      expect(validateMask(ok)).toBe(ok);
  });

  it('takes blur and pixelate with a strength and no opacity, and refuses the other combinations', () => {
    const bad: [Record<string, unknown>, RegExp][] = [
      [strong('blur', 0.03, { strength: undefined }), /mask\.strength/],
      [strong('pixelate', 0.03, { strength: undefined }), /mask\.strength/],
      [strong('blur', MASK_LIMITS.minStrength / 2), /mask\.strength/],
      [strong('pixelate', 0), /mask\.strength/],
      [strong('blur', MASK_LIMITS.maxStrength * 1.01), /mask\.strength/],
      [strong('pixelate', Number.NaN), /mask\.strength/],
      [strong('blur', Number.POSITIVE_INFINITY), /mask\.strength/],
      [strong('blur', 0.03, { opacity: 0.5 }), /mask\.opacity/],
      [strong('pixelate', 0.03, { opacity: 1 }), /mask\.opacity/],
      [mask({ strength: 0.03 }), /mask\.strength/],
      [mask({ kind: 'spotlight', strength: 0.03 }), /mask\.strength/],
      [strong('blur', 0.03, { x: 0.6, width: 0.5 }), /inside the panel/],
    ];
    for (const [over, message] of bad) expect(() => validateMask(mask(over))).toThrow(message);
    // Solid and spotlight still need their opacity.
    expect(() => validateMask(mask({ opacity: undefined }))).toThrow(/mask\.opacity/);
  });

  it('rejects what it cannot draw faithfully, naming the field', () => {
    const bad: [Record<string, unknown>, RegExp][] = [
      [{ id: '' }, /mask\.id/],
      [{ kind: 'mosaic' }, /mask\.kind/],
      [{ start: -1 }, /mask\.start/],
      [{ start: 1.5 }, /mask\.start/],
      [{ duration: 0 }, /mask\.duration/],
      [{ duration: MASK_LIMITS.minFrames - 1 }, /mask\.duration/],
      [{ duration: 7.5 }, /mask\.duration/],
      [{ start: MAX_FRAMES - 5, duration: 10 }, /24 hours/],
      [{ x: -0.01 }, /mask\.x/],
      [{ y: 1.01 }, /mask\.y/],
      [{ width: 0 }, /mask\.width/],
      [{ height: MASK_LIMITS.minSize / 2 }, /mask\.height/],
      [{ x: 0.6, width: 0.5 }, /inside the panel/],
      [{ y: 0.8, height: 0.3 }, /inside the panel/],
      [{ opacity: 0 }, /mask\.opacity/],
      [{ opacity: 1.1 }, /mask\.opacity/],
      [{ opacity: Number.NaN }, /mask\.opacity/],
      [{ x: Number.NaN }, /mask\.x/],
    ];
    for (const [over, message] of bad) expect(() => validateMask(mask(over))).toThrow(message);
  });
});
