import type { Asset } from './media';
import type { CursorTrack } from './cursor';
import { coverRect, cropPosition, maskRect, type Layout } from './stage';
import { covers, FPS, sourceFrame, zoomCamera, type Clip, type Zoom } from './timeline-model';

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

function pathFor(zoom: Zoom, clip: Clip, asset: Asset, layout: Layout, cursor: CursorTrack): Path {
  const start = Math.max(zoom.start, clip.start);
  const end = Math.min(zoom.start + zoom.duration, clip.start + clip.duration);
  // Engineering defaults: 100/300 ms half-lives and a 20% viewport-half-width dead zone.
  const halfLife = zoom.follow === 'smooth' ? 300 : 100;
  const points: Point[] = [
    { timeMs: (start * 1000) / FPS, x: zoom.x, y: zoom.y, targetX: zoom.x, targetY: zoom.y },
  ];
  const mask = maskRect('screen', layout);
  const cover = coverRect(mask, asset, cropPosition('screen', layout));
  const bounds = {
    left: (cover.x / mask.width) * 100,
    right: ((cover.x + cover.width) / mask.width) * 100,
    top: (cover.y / mask.height) * 100,
    bottom: ((cover.y + cover.height) / mask.height) * 100,
  };
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
  return { start, duration: end - start, scale: zoom.scale, halfLife, bounds, points };
}

/** Prepare sparse screen-only camera paths once per edit, never across source cuts.
 * Cursor visibility preferences do not hide recorded activity from the camera.
 */
export function prepareFraming(
  zooms: Zoom[],
  clips: Clip[],
  assets: Asset[],
  layout: Layout,
): Path[] {
  return zooms.flatMap((zoom) => {
    if (!zoom.follow) return [];
    return clips.flatMap((clip) => {
      if (
        clip.track !== 'screen' ||
        clip.start >= zoom.start + zoom.duration ||
        clip.start + clip.duration <= zoom.start
      )
        return [];
      const asset = assets.find((item) => item.id === clip.assetId);
      return asset?.cursor ? [pathFor(zoom, clip, asset, layout, asset.cursor)] : [];
    });
  });
}

/** Evaluate the same prepared path for playback, arbitrary seeks and encoded frames. */
export function framingAt(
  zooms: Zoom[],
  paths: Path[],
  frame: number,
): ReturnType<typeof zoomCamera> {
  const camera = zoomCamera(zooms, frame);
  const path = paths.find((item) => covers(item, frame));
  if (!path || camera.scale === 1) return camera;
  const timeMs = (frame * 1000) / FPS;
  let low = 0,
    high = path.points.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (path.points[middle].timeMs <= timeMs) low = middle + 1;
    else high = middle;
  }
  const point = path.points[Math.max(0, low - 1)];
  const focus = position(point, timeMs, path.halfLife);
  const weight = (camera.scale - 1) / (path.scale - 1);
  const scale = camera.scale;
  return {
    scale,
    x: Math.max(
      50 * (1 + scale) - path.bounds.right * scale,
      Math.min(50 * (scale - 1) - path.bounds.left * scale, (50 - focus.x) * scale * weight),
    ),
    y: Math.max(
      50 * (1 + scale) - path.bounds.bottom * scale,
      Math.min(50 * (scale - 1) - path.bounds.top * scale, (50 - focus.y) * scale * weight),
    ),
  };
}
