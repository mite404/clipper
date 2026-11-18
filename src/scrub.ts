import { clamp, scrubTo, type StepRange } from '@ui-sdk/core/number';

// Pixels of horizontal drag per field step, as the UI SDK's number input scrubs.
const PIXELS_PER_STEP = 2;
type Speed = { shiftKey: boolean; altKey: boolean };

/**
 * The unsnapped value after `pixels` more of drag, from the one before. Shift moves ten times as
 * far and Alt a tenth, Shift winning. The movement is added to the value, not measured from the
 * start of the drag, so a modifier changes only what follows it, and the value clamps to the
 * bounds at once so a reversal answers immediately.
 */
export function scrubBy(raw: number, pixels: number, speed: Speed, range: StepRange): number {
  const gain = speed.shiftKey ? 10 : speed.altKey ? 0.1 : 1;
  return clamp(raw + (pixels / PIXELS_PER_STEP) * range.step * gain, range.min, range.max);
}

/** The step-grid value nearest `raw`; the grid starts at `min`. */
export const scrubSnap = (raw: number, range: StepRange): number =>
  scrubTo(raw, range, { snap: false }).value;

/**
 * Where Shift with ArrowUp or ArrowDown takes `value`: ten steps, within the bounds. Plain arrows
 * are the native input's own, and Alt has nothing finer to add to them. Undefined for any other key.
 */
export function scrubKey(
  key: string,
  shift: boolean,
  value: number,
  range: StepRange,
): number | undefined {
  if (!shift || (key !== 'ArrowUp' && key !== 'ArrowDown')) return undefined;
  return scrubSnap(value + (key === 'ArrowUp' ? 10 : -10) * range.step, range);
}
