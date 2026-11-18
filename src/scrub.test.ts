import { describe, expect, it } from 'vitest';
import { scrubBy, scrubKey, scrubSnap } from './scrub';

const percent = { min: 0, max: 100, step: 1 };
const none = { shiftKey: false, altKey: false };
const shift = { shiftKey: true, altKey: false };
const alt = { shiftKey: false, altKey: true };

describe('scrubBy', () => {
  it('moves one step per two pixels, right increasing and left decreasing', () => {
    expect(scrubBy(10, 4, none, percent)).toBe(12);
    expect(scrubBy(10, -6, none, percent)).toBe(7);
    expect(scrubBy(10, 3, none, percent)).toBe(11.5);
  });

  it('moves ten times as far with Shift and a tenth as far with Alt, Shift winning together', () => {
    expect(scrubBy(0, 4, shift, percent)).toBe(20);
    expect(scrubBy(0, 20, alt, percent)).toBe(1);
    expect(scrubBy(0, 4, { shiftKey: true, altKey: true }, percent)).toBe(20);
  });

  it('applies a modifier to the movement made while it is held, not to the whole drag', () => {
    // 10 px plain is 5 steps; 10 more px with Shift is 50 more, not 10 px of the first at 10x.
    const plain = scrubBy(0, 10, none, percent);
    expect(scrubBy(plain, 10, shift, percent)).toBe(55);
  });

  it('stops at both bounds and answers a reversal at once', () => {
    expect(scrubBy(98, 20, none, percent)).toBe(100);
    expect(scrubBy(2, -20, none, percent)).toBe(0);
    // Dragged 100 px past the end, then back 2 px: one step off the bound, not 50 steps to retrace.
    expect(scrubBy(scrubBy(99, 100, none, percent), -2, none, percent)).toBe(99);
  });

  it('scales the pixel step by the field step', () => {
    expect(scrubBy(1, 4, none, { min: 1, max: 3, step: 0.1 })).toBeCloseTo(1.2, 10);
  });
});

describe('scrubSnap', () => {
  it('lands on the step grid, rounding to the nearest step', () => {
    expect(scrubSnap(12.4, percent)).toBe(12);
    expect(scrubSnap(12.6, percent)).toBe(13);
    expect(scrubSnap(-3, percent)).toBe(0);
    expect(scrubSnap(120, percent)).toBe(100);
  });

  it('starts the grid at min and leaves no floating point noise', () => {
    const level = { min: 1, max: 3, step: 0.1 };
    expect(scrubSnap(1.2000000000000002, level)).toBe(1.2);
    expect(scrubSnap(2.04, level)).toBe(2);
    // A frame grid from a six-frame minimum: 0.2 s, then 7/30 s.
    const frames = { min: 6 / 30, max: 5, step: 1 / 30 };
    expect(scrubSnap(6 / 30 + 0.01, frames) * 30).toBeCloseTo(6, 10);
    expect(scrubSnap(6 / 30 + 0.02, frames) * 30).toBeCloseTo(7, 10);
  });
});

describe('scrubKey', () => {
  it('steps ten grid steps with Shift and ArrowUp or ArrowDown, within the bounds', () => {
    expect(scrubKey('ArrowUp', true, 50, percent)).toBe(60);
    expect(scrubKey('ArrowDown', true, 50, percent)).toBe(40);
    expect(scrubKey('ArrowUp', true, 95, percent)).toBe(100);
    expect(scrubKey('ArrowDown', true, 3, percent)).toBe(0);
  });

  it('leaves plain arrows and other keys to the native input', () => {
    expect(scrubKey('ArrowUp', false, 50, percent)).toBeUndefined();
    expect(scrubKey('ArrowLeft', true, 50, percent)).toBeUndefined();
    expect(scrubKey('Enter', true, 50, percent)).toBeUndefined();
  });
});
