import type { Asset } from './media';
import { screenTracks } from './cursor-render';
import { ZOOM_LIMITS, zoomsOverlap, type Clip, type TrackDef, type Zoom } from './timeline-model';
import { coverRect, cropPosition, maskRect, type Layout } from './stage';

function focus(source: NonNullable<Zoom['source']>, asset: Asset, layout: Layout) {
  const mask = maskRect('screen', layout);
  const cover = coverRect(mask, asset, cropPosition('screen', layout));
  return {
    x: Math.max(0, Math.min(100, ((cover.x + source.x * cover.width) / mask.width) * 100)),
    y: Math.max(0, Math.min(100, ((cover.y + source.y * cover.height) / mask.height) * 100)),
  };
}

// A shot keeps its whole clip range on any screen-role track; ownership only picks what follows.
function sourcePieces(
  zoom: Zoom,
  clips: Clip[],
  screens: string[],
  assets: Asset[],
  layout: Layout,
): Zoom[] {
  const source = zoom.source;
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
      source: { ...source, start },
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

/** Resolve source-anchored shots once per edit, retaining manual timeline zooms. */
export function resolveZooms(
  zooms: Zoom[],
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
 * so it stops at a neighbour's edge or the sequence end and never overlaps or jumps a zoom. A
 * generated shot's anchor moves in step while the shot stays in its clip; otherwise the shot
 * becomes a manual zoom, as when its start is edited.
 * @param total the sequence length in frames
 */
export function moveZoom(
  zooms: Zoom[],
  id: string,
  start: number,
  total: number,
  clips: Clip[],
  tracks: TrackDef[],
): Zoom[] {
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
  const { source, ...manual } = zoom;
  const shifted = source && { ...source, start: source.start + next - zoom.start };
  const screens = screenTracks(tracks);
  // The shot resolves to `next` only through a clip whose source range holds all of it.
  const anchored =
    shifted &&
    clips.some(
      (clip) =>
        screens.includes(clip.track) &&
        clip.assetId === shifted.assetId &&
        (clip.originId ?? clip.id) === shifted.clipId &&
        shifted.start >= clip.offset &&
        shifted.start + zoom.duration <= clip.offset + clip.duration &&
        clip.start + shifted.start - clip.offset === next,
    );
  const moved = anchored ? { ...manual, start: next, source: shifted } : { ...manual, start: next };
  return zooms.map((z) => (z.id === id ? moved : z));
}
