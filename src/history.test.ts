import { expect, it } from 'vitest';
import { classifyChange, type Gesture } from './history';
import type { Edit } from './project';
import { DEFAULT_TRACKS, createTrack, moveTrack } from './timeline-model';

const base: Edit = {
  clips: [
    { id: 'a', assetId: 'x', track: 'screen', start: 0, duration: 90, offset: 0 },
    { id: 'b', assetId: 'x', track: 'screen', start: 90, duration: 90, offset: 200 },
  ],
  zooms: [{ id: 'z', start: 10, duration: 60, scale: 1.8, x: 50, y: 50 }],
  layout: { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
  tracks: DEFAULT_TRACKS,
};
const radius = (edit: Edit, value: number): Edit => ({
  ...edit,
  layout: { ...edit.layout, radius: value },
});

// Applies edits in order at the given times and reports how each entered history.
function run(
  start: Edit,
  steps: [atMs: number, next: (edit: Edit) => Edit, discrete?: true][],
): string[] {
  let edit = start;
  let gesture: Gesture | null = null;
  return steps.map(([at, next, discrete]) => {
    const proposed = next(edit);
    const step = classifyChange(edit, proposed, gesture, at, discrete);
    if (step.kind === 'none') return 'none';
    gesture = step.gesture;
    edit = proposed;
    return step.kind;
  });
}

it('ignores an edit that is value-equal to the current one, even when its objects are new', () => {
  const copy: Edit = JSON.parse(JSON.stringify(base));
  expect(classifyChange(base, copy, null, 0)).toEqual({ kind: 'none' });
});

it('makes one step of a slider drag and a new step once the drag has paused', () => {
  expect(
    run(base, [
      [0, (edit) => radius(edit, 23)],
      [16, (edit) => radius(edit, 24)],
      [799, (edit) => radius(edit, 40)],
      // The window runs from the last change, not from the start of the drag.
      [1598, (edit) => radius(edit, 41)],
      [2398, (edit) => radius(edit, 42)],
    ]),
  ).toEqual(['push', 'merge', 'merge', 'merge', 'push']);
});

it('makes a discrete command its own step, however soon it follows, and closes the open one', () => {
  expect(
    run(base, [
      [0, (edit) => radius(edit, 23), true],
      // Same numeric value again inside the window: a drag would fold it, a command never does.
      [10, (edit) => radius(edit, 24), true],
      [20, (edit) => radius(edit, 25), true],
      // The step a command made stays closed to a drag that follows.
      [30, (edit) => radius(edit, 26)],
      [40, (edit) => radius(edit, 27)],
      [50, (edit) => radius(edit, 28), true],
      [60, (edit) => radius(edit, 28), true],
    ]),
  ).toEqual(['push', 'push', 'push', 'push', 'merge', 'push', 'none']);
});

it('starts a new step when a different value changes', () => {
  expect(
    run(base, [
      [0, (edit) => radius(edit, 23)],
      [10, (edit) => ({ ...edit, layout: { ...edit.layout, screenX: 40 } })],
      [20, (edit) => radius(edit, 24)],
    ]),
  ).toEqual(['push', 'push', 'push']);
});

it('never folds an added, removed or replaced clip or zoom into another step', () => {
  const dropFirst = (edit: Edit): Edit => ({ ...edit, clips: edit.clips.slice(1) });
  const move = (edit: Edit): Edit => ({
    ...edit,
    clips: edit.clips.map((clip, index) => (index ? clip : { ...clip, start: clip.start + 5 })),
  });
  expect(
    run(base, [
      [0, move],
      // Clip b now sits where clip a was just moved; it must not inherit that step.
      [10, dropFirst],
      [20, move],
      [30, (edit) => ({ ...edit, zooms: [{ ...edit.zooms[0], id: 'regenerated' }] })],
      [40, (edit) => ({ ...edit, zooms: [{ ...edit.zooms[0], id: 'again' }] })],
    ]),
  ).toEqual(['push', 'push', 'push', 'push', 'push']);
  // A reorder touches every field of both clips; a move right after it is still its own step.
  expect(
    run(base, [
      [0, (edit) => ({ ...edit, clips: [edit.clips[1], edit.clips[0]] })],
      [10, move],
    ]),
  ).toEqual(['push', 'push']);
});

it('does not treat a repeated switch as a drag', () => {
  const swap = (edit: Edit): Edit => ({
    ...edit,
    layout: { ...edit.layout, swapped: !edit.layout.swapped },
  });
  expect(
    run(base, [
      [0, swap],
      [10, swap],
    ]),
  ).toEqual(['push', 'push']);
});

it('keeps a drag in one step when its first change also cleared another field', () => {
  const instant: Edit = { ...base, zooms: [{ ...base.zooms[0], instant: true }] };
  const scale = (value: number) => (edit: Edit) => ({
    ...edit,
    zooms: [{ ...edit.zooms[0], scale: value, instant: undefined }],
  });
  expect(
    run(instant, [
      [0, scale(1.9)],
      [16, scale(2)],
      [32, scale(2.1)],
    ]),
  ).toEqual(['push', 'merge', 'merge']);
});

it('does not continue a gesture after the edit was replaced by an undo or an opened project', () => {
  const first = radius(base, 23);
  const step = classifyChange(base, first, null, 0);
  expect(step.kind).toBe('push');
  const gesture = step.kind === 'none' ? null : step.gesture;
  // The editor is back on `base`, which is not the edit the gesture produced.
  expect(classifyChange(base, radius(base, 24), gesture, 10).kind).toBe('push');
});

it('makes a created or reordered track its own step, even mid-drag', () => {
  expect(
    run(base, [
      [0, (edit) => radius(edit, 23)],
      [10, (edit) => ({ ...edit, tracks: createTrack(edit.tracks, 'background').tracks })],
      [20, (edit) => ({ ...edit, tracks: moveTrack(edit.tracks, 'camera', -1) })],
      [30, (edit) => ({ ...edit, tracks: structuredClone(edit.tracks) })],
    ]),
  ).toEqual(['push', 'push', 'push', 'none']);
});

it('makes a chapter added, renamed or removed its own step, even mid-drag, and ignores no change', () => {
  const chaptered = (edit: Edit, ...frames: number[]): Edit => ({
    ...edit,
    chapters: frames.map((frame) => ({ frame, title: `Chapter ${frame}` })),
  });
  expect(
    run(base, [
      [0, (edit) => radius(edit, 23)],
      [10, (edit) => chaptered(edit, 5)],
      [20, (edit) => radius(edit, 24)],
      [30, (edit) => ({ ...edit, chapters: [{ frame: 5, title: 'Intro' }] })],
      [40, (edit) => chaptered(edit)],
    ]),
  ).toEqual(['push', 'push', 'push', 'push', 'push']);
  // Absent and empty are the same list: no change, so nothing enters history.
  expect(run(base, [[0, (edit) => ({ ...edit, chapters: [] })]])).toEqual(['none']);
});
