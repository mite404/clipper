/**
 * The part of a clip that retiming reads: where it sits on the timeline, where its source starts,
 * and how fast the source plays. `speed` is absent for 1, so every clip saved before retiming
 * existed is unchanged. Any clip type with these fields fits.
 *
 * `sourceEnd` is the source frame just past the last one the clip may show, kept apart from the
 * rounded `duration` so retiming never loses the true out point. It is absent while it equals
 * `offset + duration * speed`, which is every clip that was never rounded or cut back. Anything
 * that trims a clip must set or drop it. A split's left half takes `splitOffset(...)` as its
 * `sourceEnd`; the right half keeps the whole's. Split offsets and `sourceEnd` can be fractional,
 * so persistence must keep them fractional.
 */
export type Retimed = {
  start: number;
  duration: number;
  offset: number;
  speed?: number;
  sourceEnd?: number;
};

/** What `retimeClip` returns: the input's other fields, with a new length and optional fields. */
export type RetimeResult<T> = Omit<T, 'speed' | 'duration' | 'sourceEnd'> & {
  duration: number;
  speed?: number;
  sourceEnd?: number;
};

/** The slowest and fastest a clip may play, in source frames per timeline frame. */
export const SPEED_LIMITS = { min: 0.25, max: 4 };

/** The speeds the editor offers, in menu order; any speed inside `SPEED_LIMITS` is valid. */
export const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 4] as const;

/** A clip's speed: 1 when it has none. */
const clipSpeed = (clip: Pick<Retimed, 'speed'>): number => clip.speed ?? 1;

/** The source frame just past the clip's range: its `sourceEnd`, else length times speed on. */
const sourceEndOf = (clip: Retimed): number =>
  clip.sourceEnd ?? clip.offset + clip.duration * clipSpeed(clip);

/**
 * The source position a clip plays at a timeline frame, fractional when the speed is. It is
 * `sourceFrame` from timeline-model at speed 1. It never passes `sourceEnd`, which is exclusive
 * and may be returned, so audio reads and geometry stay inside the cut however the duration was
 * rounded.
 *
 * It is a timeline-grid position, not a decoder timestamp: the pure helpers do not know the source
 * frame rate. The render unit must hold the last decoded picture by source presentation timestamp
 * once `sourceAt` reaches the end. The 30 fps and 60 fps decoder probes (last samples of [20,121)
 * at 2x must decode 240, 241, 241, 241 on 60 fps footage) become that unit's regressions.
 */
export function sourceAt(clip: Retimed, frame: number): number {
  const at = clip.offset + (frame - clip.start) * clipSpeed(clip);
  return clip.sourceEnd === undefined ? at : Math.min(at, clip.sourceEnd);
}

/** The timeline frame a source frame plays at, the inverse of `sourceAt`; fractional in between. */
export function timelineAt(clip: Retimed, sourceFrame: number): number {
  return clip.start + (sourceFrame - clip.offset) / clipSpeed(clip);
}

/** How many source frames the clip uses: from its offset to its out point. */
export function sourceSpan(clip: Retimed): number {
  return sourceEndOf(clip) - clip.offset;
}

/**
 * The source offset of the right half when a clip is split `elapsed` timeline frames in, so both
 * halves still show the frames the whole did.
 */
export function splitOffset(clip: Retimed, elapsed: number): number {
  return clip.offset + elapsed * clipSpeed(clip);
}

/**
 * Checks a speed is one a clip can play and returns it.
 * @throws {RangeError} When it is not a number inside `SPEED_LIMITS`.
 */
export function validateSpeed(speed: number): number {
  if (!Number.isFinite(speed) || speed < SPEED_LIMITS.min || speed > SPEED_LIMITS.max)
    throw new RangeError(
      `A clip speed must be a number from ${SPEED_LIMITS.min} to ${SPEED_LIMITS.max}, got ${speed}.`,
    );
  return speed;
}

/**
 * The clip at another speed over the same source range: the offset stays, and the length becomes
 * the source span divided by the speed, rounded to whole frames and at least one. The true source
 * out point is kept in `sourceEnd` whenever rounding makes it differ from length times speed, so a
 * round trip through any speeds back to 1x returns the original clip. Speed 1 drops the field.
 * Other fields are kept; the input is not touched.
 *
 * `maxFrames` is the room the clip has before the next clip on its track, unlimited when absent.
 * A slowdown that would run past it grows only that far: the speed and the source in point are
 * kept, and the out point is cut back, so the source used is the length times the speed. A
 * speed-up shortens the clip, and nothing else moves.
 * @param maxFrames a whole number of at least 1, or `Infinity`
 * @throws {RangeError} When the speed is outside `SPEED_LIMITS`, or `maxFrames` is not a whole
 * number of at least 1.
 */
export function retimeClip<T extends Retimed>(
  clip: T,
  speed: number,
  maxFrames = Infinity,
): RetimeResult<T> {
  validateSpeed(speed);
  if (maxFrames !== Infinity && !(Number.isInteger(maxFrames) && maxFrames >= 1))
    throw new RangeError(
      `The room for a retimed clip must be a whole number of frames, got ${maxFrames}.`,
    );
  const { speed: _speed, sourceEnd: _end, duration: _length, ...rest } = clip;
  const wanted = Math.max(1, Math.round(sourceSpan(clip) / speed));
  const duration = Math.min(maxFrames, wanted);
  const end = duration < wanted ? clip.offset + duration * speed : sourceEndOf(clip);
  const keepEnd = end !== clip.offset + duration * speed; // exact: one float step is a real end
  return {
    ...rest,
    duration,
    ...(speed !== 1 && { speed }),
    ...(keepEnd && { sourceEnd: end }),
  };
}
