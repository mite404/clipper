import type { Asset } from './media';
import type { CursorTrack } from './cursor';
import { coverRect, cropPosition, maskRect, type Layout, type Rect } from './stage';
import { cursorSpans } from './cursor-render';
import {
  covers,
  FPS,
  sourceFrame,
  zoomCamera,
  type Clip,
  type TrackDef,
  type Zoom,
} from './timeline-model';

type Point = { timeMs: number; x: number; y: number; targetX: number; targetY: number };
type Path = {
  start: number;
  duration: number;
  scale: number;
  halfLife: number;
  bounds: { left: number; right: number; top: number; bottom: number };
  points: Point[];
};

function position(point: Point, timeMs: number, halfLife: number) {
  const decay = 2 ** (-(timeMs - point.timeMs) / halfLife);
  return {
    x: point.targetX + (point.x - point.targetX) * decay,
    y: point.targetY + (point.y - point.targetY) * decay,
  };
}

// Pan limits that keep a source's cover rect over its whole mask, in percent of the mask.
type Bounds = Path['bounds'];
const MASK_BOUNDS: Bounds = { left: 0, right: 100, top: 0, bottom: 100 };

// Sparse follow targets from a clip's telemetry over timeline frames [start, end), held still
// inside a dead zone and kept where the zoomed view stays within the source's bounds.
function followPoints(
  zoom: Zoom,
  clip: Clip,
  frames: { start: number; end: number; halfLife: number },
  view: { mask: Rect; cover: Rect; bounds: Bounds },
  cursor: CursorTrack,
): Point[] {
  const { start, end, halfLife } = frames;
  const { mask, cover, bounds } = view;
  const points: Point[] = [
    { timeMs: (start * 1000) / FPS, x: zoom.x, y: zoom.y, targetX: zoom.x, targetY: zoom.y },
  ];
  const fromMs = (sourceFrame(clip, start) * 1000) / FPS - cursor.offsetMs;
  const toMs = (sourceFrame(clip, end) * 1000) / FPS - cursor.offsetMs;
  for (const sample of cursor.recording.samples) {
    if (sample.timeMs < fromMs || sample.timeMs >= toMs || sample.visible === false) continue;
    const x = Math.max(
      bounds.left + 50 / zoom.scale,
      Math.min(
        bounds.right - 50 / zoom.scale,
        ((cover.x + sample.cx * cover.width) / mask.width) * 100,
      ),
    );
    const y = Math.max(
      bounds.top + 50 / zoom.scale,
      Math.min(
        bounds.bottom - 50 / zoom.scale,
        ((cover.y + sample.cy * cover.height) / mask.height) * 100,
      ),
    );
    const previous = points[points.length - 1];
    if (
      Math.abs(x - previous.targetX) <= 10 / zoom.scale &&
      Math.abs(y - previous.targetY) <= 10 / zoom.scale
    )
      continue;
    const timeMs = ((clip.start - clip.offset) * 1000) / FPS + sample.timeMs + cursor.offsetMs;
    points.push({ timeMs, ...position(previous, timeMs, halfLife), targetX: x, targetY: y });
  }
  return points;
}

// `span` is the run of frames `clip` owns the cursor for; the path never leaves it. Every path
// carries its source's bounds; only a following zoom over telemetry also gets follow points.
function pathFor(
  zoom: Zoom,
  clip: Clip,
  span: { start: number; duration: number },
  asset: Asset,
  layout: Layout,
  cursor: CursorTrack | undefined,
): Path {
  const start = Math.max(zoom.start, span.start);
  const end = Math.min(zoom.start + zoom.duration, span.start + span.duration);
  // Engineering defaults: 100/300 ms half-lives and a 20% viewport-half-width dead zone.
  const halfLife = zoom.follow === 'smooth' ? 300 : 100;
  const mask = maskRect('screen', layout);
  const cover = coverRect(mask, asset, cropPosition('screen', layout));
  const bounds = {
    left: (cover.x / mask.width) * 100,
    right: ((cover.x + cover.width) / mask.width) * 100,
    top: (cover.y / mask.height) * 100,
    bottom: ((cover.y + cover.height) / mask.height) * 100,
  };
  const points = cursor
    ? followPoints(zoom, clip, { start, end, halfLife }, { mask, cover, bounds }, cursor)
    : [];
  return { start, duration: end - start, scale: zoom.scale, halfLife, bounds, points };
}

/** Prepare camera paths once per edit over the clip that owns the cursor, never across source
 * cuts: each keeps the zoom inside that clip's source, and a follow zoom also tracks its cursor.
 * Cursor visibility preferences do not hide recorded activity.
 */
export function prepareFraming(
  zooms: Zoom[],
  clips: Clip[],
  assets: Asset[],
  layout: Layout,
  tracks: TrackDef[],
): Path[] {
  const spans = cursorSpans(clips, assets, tracks); // → owned frame runs
  return zooms.flatMap((zoom) =>
    spans.flatMap((span) => {
      if (span.start >= zoom.start + zoom.duration || span.start + span.duration <= zoom.start)
        return [];
      const asset = assets.find((item) => item.id === span.clip.assetId);
      const cursor = zoom.follow ? asset?.cursor : undefined; // → telemetry to follow, if any
      return asset ? [pathFor(zoom, span.clip, span, asset, layout, cursor)] : [];
    }),
  );
}

// The followed focus, in percent of the mask, at a frame inside a path with follow points.
function followFocus(path: Path, frame: number) {
  const timeMs = (frame * 1000) / FPS;
  let low = 0,
    high = path.points.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (path.points[middle].timeMs <= timeMs) low = middle + 1;
    else high = middle;
  }
  return position(path.points[Math.max(0, low - 1)], timeMs, path.halfLife);
}

/** Evaluate the same prepared path for playback, arbitrary seeks and encoded frames. The pan
 * stops where the source's edge meets the mask's, so a zoom never reveals empty mask.
 */
export function framingAt(
  zooms: Zoom[],
  paths: Path[],
  frame: number,
): ReturnType<typeof zoomCamera> {
  const camera = zoomCamera(zooms, frame);
  const path = paths.find((item) => covers(item, frame));
  if (camera.scale === 1) return camera;
  const scale = camera.scale;
  const bounds = path?.bounds ?? MASK_BOUNDS;
  const focus = path?.points.length ? followFocus(path, frame) : undefined;
  const weight = path ? (scale - 1) / (path.scale - 1) : 1;
  const clamp = (pan: number, low: number, high: number) =>
    Math.max(50 * (1 + scale) - high * scale, Math.min(50 * (scale - 1) - low * scale, pan));
  return {
    scale,
    x: clamp(focus ? (50 - focus.x) * scale * weight : camera.x, bounds.left, bounds.right),
    y: clamp(focus ? (50 - focus.y) * scale * weight : camera.y, bounds.top, bounds.bottom),
  };
}
