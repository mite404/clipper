import type { Edit } from './project';

/** The undo step that is still open: later changes to the same values fold into it. */
export type Gesture = {
  // The edit the step produced, by identity, so an undo or an opened project ends it.
  edit: Edit;
  paths: string[];
  at: number;
};
/** How a proposed edit enters undo history. */
export type HistoryStep =
  | { kind: 'none' }
  | { kind: 'push'; gesture: Gesture | null }
  | { kind: 'merge'; gesture: Gesture };
// One changed value. Only number-to-number changes can come from a drag or a held key.
type Change = { path: string; continuous: boolean };

// A slider reports far faster than this; a person who pauses this long has started a new edit.
const GESTURE_MS = 800;

// (prefix, before, after) → the fields that differ in value
function fieldChanges(prefix: string, before: object, after: object): Change[] {
  const a = before as Record<string, unknown>;
  const b = after as Record<string, unknown>;
  return [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
    .map((key) => ({
      path: `${prefix}.${key}`,
      continuous: typeof a[key] === 'number' && typeof b[key] === 'number',
    }));
}

// null means items were added, removed, replaced or reordered, which is never part of a drag.
function listChanges(
  prefix: string,
  before: { id: string }[],
  after: { id: string }[],
): Change[] | null {
  if (before.length !== after.length || before.some((item, i) => item.id !== after[i].id))
    return null;
  return before.flatMap((item, i) => fieldChanges(`${prefix}.${item.id}`, item, after[i]));
}

/**
 * Decides whether a proposed edit is no change, a new undo step, or more of the open one.
 * A step stays open while the same numeric values keep changing less than 800 ms apart.
 * @param gesture The step the previous call returned, or null.
 * @param now Milliseconds on any monotonic clock.
 * @param discrete A one-shot command, such as a key or a released trim: always a step of its own,
 * however soon it follows another, and it closes the open one.
 */
export function classifyChange(
  current: Edit,
  next: Edit,
  gesture: Gesture | null,
  now: number,
  discrete = false,
): HistoryStep {
  const clips = listChanges('clips', current.clips, next.clips); // → Change[] | null
  const zooms = listChanges('zooms', current.zooms, next.zooms); // → Change[] | null
  // A created or reordered track, or a chapter added, removed or renamed, is a step of its own,
  // never part of a drag.
  const registry =
    JSON.stringify(current.tracks) !== JSON.stringify(next.tracks) ||
    JSON.stringify(current.chapters ?? []) !== JSON.stringify(next.chapters ?? []);
  if (!clips || !zooms || registry) return { kind: 'push', gesture: null };
  const changes = [...clips, ...zooms, ...fieldChanges('layout', current.layout, next.layout)];
  if (!changes.length) return { kind: 'none' };
  if (discrete) return { kind: 'push', gesture: null };
  const continues =
    gesture !== null &&
    gesture.edit === current &&
    now - gesture.at < GESTURE_MS &&
    changes.every((change) => change.continuous && gesture.paths.includes(change.path));
  return continues
    ? { kind: 'merge', gesture: { ...gesture, edit: next, at: now } }
    : {
        kind: 'push',
        gesture: { edit: next, paths: changes.map((change) => change.path), at: now },
      };
}
