import type { Asset } from './media';
import { screenTracks } from './cursor-render';
import type { AnchoredZoom, ZoomAnchor } from './project';
import { ZOOM_LIMITS, zoomsOverlap, type Clip, type TrackDef, type Zoom } from './timeline-model';
import { coverRect, cropPosition, maskRect, type Layout } from './stage';

function focus(source: ZoomAnchor, asset: Asset, layout: Layout) {
  const mask = maskRect('screen', layout);
  const cover = coverRect(mask, asset, cropPosition('screen', layout));
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
      ...focus(source, asset, layout),
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
 * Move one zoom to a timeline frame, keeping its duration. It stays in the free gap it sits in,
 * so it stops at a neighbour's edge or the sequence end and never overlaps or jumps a zoom.
 * @param total the sequence length in frames
 */
export function moveZoom(zooms: Zoom[], id: string, start: number, total: number): Zoom[] {
  const zoom = zooms.find((z) => z.id === id);
  if (!zoom) return zooms;
  const end = zoom.start + zoom.duration;
  const others = zooms.filter((z) => z.id !== id);
  const low = Math.max(
    0,
    ...others.flatMap((z) => (z.start < zoom.start ? [z.start + z.duration] : [])),
  );
  // A zoom the sequence already ends inside keeps its end as the bound, so no move pulls it left.
  const high = Math.min(
    Math.max(total, end),
    ...others.flatMap((z) => (z.start >= end ? [z.start] : [])),
  );
  const next = Math.max(low, Math.min(high - zoom.duration, Math.round(start))); // → frame
  return zooms.map((z) => (z.id === id ? { ...z, start: next } : z));
}
