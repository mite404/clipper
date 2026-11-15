import type { CursorAsset, CursorSample, CursorTrack } from './cursor';

export type CursorPose = Pick<CursorSample, 'cx' | 'cy'> & { asset: CursorAsset };

// Native captures can leave a 152 ms gap. Longer gaps are disconnected tracking, not motion.
const MAX_GAP_MS = 250;

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

/** Sample source-time motion with bounded cubic smoothing or raw linear interpolation.
 * Repeated timestamps use the last sample. Hidden or disconnected tracking returns no cursor.
 * Positive track offsets delay the cursor. Results never depend on playback or seek history.
 */
export function cursorAt(
  track: CursorTrack,
  sourceMs: number,
  mode: 'raw' | 'smooth' = track.settings?.mode ?? 'smooth',
): CursorPose | undefined {
  const timeMs = sourceMs - track.offsetMs;
  const { samples, assets } = track.recording;
  const left = lastAt(samples, timeMs);
  const sample = samples[left];
  if (
    track.settings?.hidden ||
    !sample ||
    sample.visible === false ||
    timeMs - sample.timeMs > MAX_GAP_MS
  )
    return undefined;
  const asset = assets.find((image) => image.id === sample.assetId);
  if (!asset) return undefined;
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
