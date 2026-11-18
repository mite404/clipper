import type { KeyboardEvent, PointerEvent } from 'react';
import { bindDrag } from '@ui-sdk/core';
import { clamp, scrubTo, type StepRange } from '@ui-sdk/core/number';

// Pixels of horizontal drag per field step, as the UI SDK's number input scrubs.
const PIXELS_PER_STEP = 2;
// Same dead zone as a timeline clip drag, so a press that barely moves stays a click.
const DRAG_THRESHOLD = 4;

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

type ScrubField = StepRange & {
  /** The value when the press lands, from which the drag is measured. */
  value: number;
  /** Takes each new value; it is always the press value plus the drag so far, never an earlier move's. */
  onScrub: (value: number) => void;
  /** The drag has moved past the threshold. */
  onStart?: () => void;
  /** The drag ended; when `canceled`, the caller puts the start value back. */
  onEnd?: (canceled: boolean) => void;
};

/**
 * Props for a field's `<label>`: drag it sideways to change the value. The input inside keeps its
 * own role, name and arrow keys, a click on the label still focuses it, and Shift with ArrowUp or
 * ArrowDown, which bubble up from the input, steps it ten times as far. Mouse and pen only: a
 * touch drag would trap the Inspector's own scrolling.
 * ponytail: no pointer lock, so a drag stops at the window edge. Pass `lock: true` to bindDrag
 * once Escape delivery under lock is verified in Chromium.
 */
export function scrub(field: ScrubField) {
  return {
    'data-scrub': '',
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (event.button !== 0 || event.pointerType === 'touch') return;
      if ((event.target as Element).closest('input, select')) return;
      let raw = field.value;
      let value = field.value;
      let started = false;
      bindDrag(event.currentTarget, event.nativeEvent, {
        threshold: DRAG_THRESHOLD,
        cancelOnEscape: true,
        onStart: () => {
          started = true;
          field.onStart?.();
        },
        onMove: ({ movementX, event: move }) => {
          raw = scrubBy(raw, movementX, move, field);
          const next = scrubSnap(raw, field);
          if (next === value) return;
          value = next;
          field.onScrub(next);
        },
        // bindDrag also ends a plain click, which only the native label should answer.
        onEnd: (_event, canceled) => started && field.onEnd?.(canceled),
      });
    },
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      const next = scrubKey(event.key, event.shiftKey, field.value, field);
      if (next === undefined) return;
      event.preventDefault();
      field.onScrub(next);
    },
  };
}
