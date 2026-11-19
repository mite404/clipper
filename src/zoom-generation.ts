import type { Asset } from './media';
import { screenTracks } from './cursor-render';
import type { AnchoredZoom, ZoomAnchor } from './project';
import {
  ZOOM_LIMITS,
  overwrite,
  zoomsOverlap,
  type Clip,
  type TrackDef,
  type Zoom,
} from './timeline-model';
import { clipRect, cropPosition, maskRect, type Layout } from './stage';

function focus(source: ZoomAnchor, asset: Asset, layout: Layout, clip: Clip) {
  const mask = maskRect('screen', layout);
  const cover = clipRect(mask, asset, cropPosition('screen', layout), clip); // → this piece's rect
  return {
    x: Math.max(0, Math.min(100, ((cover.x + source.x * cover.width) / mask.width) * 100)),
    y: Math.max(0, Math.min(100, ((cover.y + source.y * cover.height) / mask.height) * 100)),
  };
}

// A shot keeps its whole clip range on any screen-role track; ownership only picks what follows.
function sourcePieces(
  { source, ...zoom }: AnchoredZoom,
  clips: Clip[],
  screens: string[],
  assets: Asset[],
  layout: Layout,
): Zoom[] {
  const asset = assets.find((item) => item.id === source?.assetId);
  if (!source || !asset) return [];
  const pieces: Zoom[] = [];
  const matching = clips.filter(
    (clip) =>
      screens.includes(clip.track) &&
      clip.assetId === source.assetId &&
      (clip.originId ?? clip.id) === source.clipId,
  );
  for (const clip of matching) {
    const start = Math.max(source.start, clip.offset);
    const end = Math.min(source.start + zoom.duration, clip.offset + clip.duration);
    if (end - start < ZOOM_LIMITS.minFrames) continue;
    pieces.push({
      ...zoom,
      id: pieces.length ? `${zoom.id}/${clip.id}` : zoom.id,
      start: clip.start + start - clip.offset,
      duration: end - start,
      ...focus(source, asset, layout, clip),
    });
  }
  return pieces;
}

function nonOverlapping(manual: Zoom[], generated: Zoom[], clips: Clip[]): Zoom[] {
  const result = [...manual];
  const ids = new Set([...clips.map((clip) => clip.id), ...manual.map((zoom) => zoom.id)]);
  for (const zoom of generated.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id))) {
    let id = zoom.id;
    for (let suffix = 2; ids.has(id); suffix++) id = `${zoom.id}.${suffix}`;
    const candidate = { ...zoom, id };
    if (zoomsOverlap(result, candidate)) continue;
    result.push(candidate);
    ids.add(id);
  }
  return result;
}

/**
 * Pin a parsed file's source-anchored shots to the timeline frames and focus they resolve to,
 * dropping each anchor. Open calls it once; edits never re-anchor (D-1). Shots that resolve to
 * nothing, or collide with a pinned zoom, are dropped. Pinned zooms pass through unchanged.
 */
export function resolveZooms(
  zooms: AnchoredZoom[],
  clips: Clip[],
  assets: Asset[],
  layout: Layout,
  tracks: TrackDef[],
): Zoom[] {
  const screens = screenTracks(tracks); // → screen-role track IDs
  return nonOverlapping(
    zooms.filter((zoom) => !zoom.source),
    zooms.flatMap((zoom) => sourcePieces(zoom, clips, screens, assets, layout)),
    clips,
  );
}

/**
 * Move one zoom to a timeline frame, keeping its duration and overwriting the zooms it lands on.
 * It stops at frame 0 and the sequence end.
 * @param total the sequence length in frames
 */
export function moveZoom(zooms: Zoom[], id: string, start: number, total: number): Zoom[] {
  const zoom = zooms.find((z) => z.id === id);
  if (!zoom) return zooms;
  // A zoom the sequence already ends inside keeps its end as the bound, so no move pulls it left.
  const high = Math.max(total, zoom.start + zoom.duration) - zoom.duration; // → latest start
  const next = Math.max(0, Math.min(high, Math.round(start))); // → frame
  return overwrite(zooms, { ...zoom, start: next }, () => true, ZOOM_LIMITS.minFrames);
}

/**
 * Move one edge of a zoom to a timeline frame, the other edge staying put, overwriting the zooms
 * the span then covers. The edge stops at frame 0, the sequence end and `ZOOM_LIMITS.minFrames`
 * from the other edge, so a zoom never inverts or vanishes. Every other field is kept.
 * @param frame where the dragged edge should sit
 * @param total the sequence length in frames
 */
export function resizeZoom(
  zooms: Zoom[],
  id: string,
  edge: 'left' | 'right',
  frame: number,
  total: number,
): Zoom[] {
  const zoom = zooms.find((z) => z.id === id);
  if (!zoom) return zooms;
  const min = ZOOM_LIMITS.minFrames;
  const end = zoom.start + zoom.duration;
  const at = Math.round(frame);
  // A zoom the sequence already ends inside keeps its end as the bound, so no edit pulls it left.
  const stop =
    edge === 'right' ? Math.max(zoom.start + min, Math.min(Math.max(total, end), at)) : end;
  const start = edge === 'left' ? Math.max(0, Math.min(end - min, at)) : zoom.start; // → frame
  return overwrite(zooms, { ...zoom, start, duration: stop - start }, () => true, min);
}
