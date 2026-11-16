import type { CursorAsset, CursorSample, CursorTrack } from './cursor';
import touchImage from './cursor-touch.png?inline';

export type CursorPose = Pick<CursorSample, 'cx' | 'cy'> & { asset: CursorAsset };

// Original touch artwork, not a native cursor replacement or imported recording asset.
export const TOUCH_CURSOR_ASSET: CursorAsset = {
  id: 'clipper-touch',
  platform: 'clipper',
  imageDataUrl: touchImage,
  width: 32,
  height: 32,
  hotspotX: 16,
  hotspotY: 16,
};

// Native captures can leave a 152 ms gap. Longer gaps are disconnected tracking, not motion.
const MAX_GAP_MS = 250;

type MotionSample = CursorSample & { activeMs: number };
const paths = new WeakMap<CursorTrack, MotionSample[]>();

function lastAt(samples: CursorSample[], timeMs: number): number {
  let low = 0;
  let high = samples.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (samples[middle].timeMs <= timeMs) low = middle + 1;
    else high = middle;
  }
  return low - 1;
}

function connected(left: CursorSample, right: CursorSample): boolean {
  const duration = right.timeMs - left.timeMs;
  return (
    duration > 0 &&
    duration <= MAX_GAP_MS &&
    left.visible !== false &&
    right.visible !== false &&
    Boolean(left.assetId && right.assetId)
  );
}

function isInteraction(sample: CursorSample): boolean {
  return Boolean(sample.interactionType && sample.interactionType !== 'move');
}

function steadyPosition(sample: CursorSample, previous?: CursorSample) {
  if (
    previous &&
    connected(previous, sample) &&
    !isInteraction(sample) &&
    Math.hypot(sample.cx - previous.cx, sample.cy - previous.cy) <= 0.005
  )
    return { cx: previous.cx, cy: previous.cy };
  return { cx: sample.cx, cy: sample.cy };
}

function isActivity(sample: CursorSample, previous?: CursorSample): boolean {
  return (
    !previous ||
    !connected(previous, sample) ||
    sample.cx !== previous.cx ||
    sample.cy !== previous.cy ||
    isInteraction(sample)
  );
}

function stableShapes(samples: CursorSample[]): CursorSample[] {
  let accepted = samples[0];
  let candidate = samples[0];
  return samples.map((sample, index) => {
    const previous = samples[index - 1];
    if (!previous || !connected(previous, sample) || isInteraction(sample)) {
      accepted = sample;
      candidate = sample;
    } else {
      if (sample.assetId !== candidate.assetId) candidate = sample;
      if (sample.timeMs - candidate.timeMs >= 100) accepted = sample;
    }
    return { ...sample, assetId: accepted.assetId };
  });
}

function preparedSamples(track: CursorTrack): MotionSample[] {
  const cached = paths.get(track);
  if (cached) return cached;
  let activeMs = 0;
  const samples: MotionSample[] = [];
  const source = track.settings?.stabilizeShapes
    ? stableShapes(track.recording.samples)
    : track.recording.samples;
  for (const original of source) {
    const previous = samples[samples.length - 1];
    const sample = track.settings?.removeShakes
      ? { ...original, ...steadyPosition(original, previous) }
      : original;
    if (isActivity(sample, previous)) activeMs = sample.timeMs;
    samples.push({ ...sample, activeMs });
  }
  paths.set(track, samples);
  return samples;
}

function tangent(
  point: CursorSample,
  neighbor: CursorSample | undefined,
  axis: 'cx' | 'cy',
  secant: number,
): number {
  if (!neighbor) return secant;
  if (!connected(neighbor, point) && !connected(point, neighbor)) return 0;
  const other = (neighbor[axis] - point[axis]) / (neighbor.timeMs - point.timeMs);
  return other * secant > 0 ? (2 * other * secant) / (other + secant) : 0;
}

function interpolate(
  samples: CursorSample[],
  left: number,
  right: number,
  timeMs: number,
  axis: 'cx' | 'cy',
  mode: 'raw' | 'smooth',
): number {
  const a = samples[left];
  const b = samples[right];
  const duration = b.timeMs - a.timeMs;
  const t = (timeMs - a.timeMs) / duration;
  if (mode === 'raw') return a[axis] + (b[axis] - a[axis]) * t;
  const secant = (b[axis] - a[axis]) / duration;
  const start = tangent(a, samples[left - 1], axis, secant) * duration;
  const end = tangent(b, samples[right + 1], axis, secant) * duration;
  return (
    (2 * t ** 3 - 3 * t ** 2 + 1) * a[axis] +
    (t ** 3 - 2 * t ** 2 + t) * start +
    (-2 * t ** 3 + 3 * t ** 2) * b[axis] +
    (t ** 3 - t ** 2) * end
  );
}

function interpolatedPose(
  samples: CursorSample[],
  left: number,
  timeMs: number,
  mode: 'raw' | 'smooth',
  asset: CursorAsset,
): CursorPose | undefined {
  const sample = samples[left];
  const next = samples[left + 1];
  if (!next || timeMs === sample.timeMs) return { cx: sample.cx, cy: sample.cy, asset };
  const right = lastAt(samples, next.timeMs);
  if (samples[right].timeMs - sample.timeMs > MAX_GAP_MS) return undefined;
  if (!connected(sample, samples[right])) return { cx: sample.cx, cy: sample.cy, asset };
  return {
    cx: interpolate(samples, left, right, timeMs, 'cx', mode),
    cy: interpolate(samples, left, right, timeMs, 'cy', mode),
    asset,
  };
}

function visible(sample: MotionSample, timeMs: number, hideIdle: boolean): boolean {
  return (
    sample.visible !== false &&
    timeMs - sample.timeMs <= MAX_GAP_MS &&
    (!hideIdle || timeMs - sample.activeMs < 1000)
  );
}

function styledAsset(track: CursorTrack, assetId?: string | null): CursorAsset | undefined {
  const { assets } = track.recording;
  const recorded = assets.find((image) => image.id === assetId);
  if (!recorded) return undefined;
  if (track.settings?.style === 'touch') return TOUCH_CURSOR_ASSET;
  return track.settings?.style === 'default' ? assets[0] : recorded;
}

function motionAt(
  track: CursorTrack,
  sourceMs: number,
  mode: 'raw' | 'smooth',
  ignoreIdle = false,
): CursorPose | undefined {
  const timeMs = sourceMs - track.offsetMs;
  const samples = preparedSamples(track);
  const left = lastAt(samples, timeMs);
  const sample = samples[left];
  if (
    track.settings?.hidden ||
    !sample ||
    !visible(sample, timeMs, Boolean(track.settings?.hideIdle && !ignoreIdle))
  )
    return undefined;
  const asset = styledAsset(track, sample.assetId);
  if (!asset) return undefined;
  return interpolatedPose(samples, left, timeMs, mode, asset);
}

/** Evaluate source-time cursor motion independently of seek/playback history.
 * Native gaps/visibility and positive-delay offsets always apply. Optional ending effects use
 * the trimmed clip's inclusive source range, not the whole untrimmed recording.
 */
export function cursorAt(
  track: CursorTrack,
  sourceMs: number,
  mode: 'raw' | 'smooth' = track.settings?.mode ?? 'smooth',
  range?: { startMs: number; endMs: number },
): CursorPose | undefined {
  if (
    track.settings?.hiddenRanges?.some(
      ({ startMs, endMs }) => sourceMs >= startMs && sourceMs < endMs,
    )
  )
    return undefined;
  const ending = track.settings?.ending;
  if (!ending || !range || range.endMs <= range.startMs) return motionAt(track, sourceMs, mode);
  const fromMs = range.endMs - Math.min(500, (range.endMs - range.startMs) / 2);
  if (sourceMs < fromMs) return motionAt(track, sourceMs, mode);
  if (!motionAt(track, sourceMs, mode, true)) return undefined;
  const from = motionAt(track, fromMs, mode, true);
  if (!from) return undefined;
  if (ending === 'stop') return from;
  const to = motionAt(track, range.startMs, mode, true);
  if (!to) return from;
  const t = Math.max(0, Math.min(1, (sourceMs - fromMs) / (range.endMs - fromMs)));
  const ease = t * t * (3 - 2 * t);
  return {
    cx: from.cx + (to.cx - from.cx) * ease,
    cy: from.cy + (to.cy - from.cy) * ease,
    asset: t === 1 ? to.asset : from.asset,
  };
}
