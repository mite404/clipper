import type { Asset } from './media';
import { covers, paintOrder, sourceFrame, FPS, type Clip, type TrackDef } from './timeline-model';
import { clipRect, cropPosition, maskRect, STAGE, type Layout, type Rect } from './stage';
import { cursorAt, TOUCH_CURSOR_ASSET } from './cursor-motion';

export type CursorFrame = Rect & {
  // The owner's track: the cursor paints inside this track's mask.
  track: string;
  imageDataUrl: string;
  // Clockwise degrees about the scaled bitmap hotspot, not its center.
  rotation: number;
  hotspotX: number;
  hotspotY: number;
};

/** Screen-role tracks in paint order, back to front: the tracks a cursor owner can sit on. */
export function screenTracks(tracks: TrackDef[]): string[] {
  return paintOrder(tracks).flatMap((t) => (t.role === 'screen' ? [t.id] : []));
}

// Screen-role clips the renderer paints: the paint path draws nothing for a source not loaded.
function paintedScreens(clips: Clip[], assets: Asset[], tracks: TrackDef[]) {
  const screens = screenTracks(tracks);
  const painted = clips.filter(
    (clip) => screens.includes(clip.track) && assets.some((asset) => asset.id === clip.assetId),
  );
  return { painted, rank: (clip: Clip) => screens.indexOf(clip.track) };
}

// The clip whose sidecar owns the cursor at a frame: the frontmost painted screen-role clip.
// Every screen-role track shares one mask, so it hides any screen clip below it.
function cursorOwner(
  clips: Clip[],
  assets: Asset[],
  tracks: TrackDef[],
  frame: number,
): Clip | undefined {
  // ponytail: a transparent still on a front screen track owns the frame and hides the cursor of a
  // video showing through it, and so does an export frame whose decode returns no canvas; make
  // ownership alpha- and decode-aware if stills over screen video or failed decodes become common.
  const { painted, rank } = paintedScreens(clips, assets, tracks);
  let owner: Clip | undefined;
  for (const clip of painted)
    if (covers(clip, frame) && (!owner || rank(clip) > rank(owner))) owner = clip;
  return owner;
}

/**
 * Each run of frames a clip owns the cursor for, clip by clip: a painted screen-role clip loses
 * only the frames a painted clip on a higher screen-role track covers.
 */
export function cursorSpans(
  clips: Clip[],
  assets: Asset[],
  tracks: TrackDef[],
): { clip: Clip; start: number; duration: number }[] {
  // ponytail: O(n²) in screen clips, once per edit; sweep sorted edges if edits reach thousands.
  const { painted, rank } = paintedScreens(clips, assets, tracks);
  return painted.flatMap((clip) => {
    const end = clip.start + clip.duration;
    const above = painted.filter((c) => rank(c) > rank(clip));
    const edges = [
      ...new Set([clip.start, end, ...above.flatMap((c) => [c.start, c.start + c.duration])]),
    ]
      .filter((edge) => edge >= clip.start && edge <= end)
      .sort((x, y) => x - y);
    const spans: { clip: Clip; start: number; duration: number }[] = [];
    for (let i = 0; i < edges.length - 1; i++) {
      if (above.some((c) => covers(c, edges[i]))) continue;
      const last = spans[spans.length - 1];
      if (last && last.start + last.duration === edges[i]) last.duration += edges[i + 1] - edges[i];
      else spans.push({ clip, start: edges[i], duration: edges[i + 1] - edges[i] });
    }
    return spans;
  });
}

/** Project the owner's cursor and its bitmap hotspot into mask-local pixels at a render size. */
export function cursorFrame(
  clips: Clip[],
  assets: Asset[],
  frame: number,
  layout: Layout,
  tracks: TrackDef[],
  renderSize = STAGE,
): CursorFrame | undefined {
  const clip = cursorOwner(clips, assets, tracks, frame);
  const source = assets.find((asset) => asset.id === clip?.assetId);
  if (!clip || !source?.cursor) return undefined;
  const sourceMs = (sourceFrame(clip, frame) / FPS) * 1000;
  const range = {
    startMs: (clip.offset / FPS) * 1000,
    endMs: ((clip.offset + clip.duration - 1) / FPS) * 1000,
  };
  const pose = cursorAt(source.cursor, sourceMs, undefined, range);
  if (!pose) return undefined;
  const previous = source.cursor.settings?.rotate
    ? cursorAt(source.cursor, Math.max(range.startMs, sourceMs - 100), undefined, range)
    : undefined;
  const mask = maskRect('screen', layout, renderSize);
  const cover = clipRect(mask, source, cropPosition('screen', layout), clip);
  const size = cover.scale * (source.cursor.settings?.size ?? 1);
  return {
    track: clip.track,
    x: cover.x + pose.cx * cover.width - pose.asset.hotspotX * size,
    y: cover.y + pose.cy * cover.height - pose.asset.hotspotY * size,
    width: pose.asset.width * size,
    height: pose.asset.height * size,
    imageDataUrl: pose.asset.imageDataUrl,
    rotation: previous ? Math.max(-12, Math.min(12, (pose.cx - previous.cx) * 120)) : 0,
    hotspotX: pose.asset.hotspotX * size,
    hotspotY: pose.asset.hotspotY * size,
  };
}

/** Decode each local cursor bitmap once for a complete export.
 * @throws When an embedded cursor PNG cannot be decoded.
 */
export async function decodeCursorImages(assets: Asset[]): Promise<Map<string, HTMLImageElement>> {
  const urls = new Set(
    assets.flatMap(
      (asset) => asset.cursor?.recording.assets.map((cursor) => cursor.imageDataUrl) ?? [],
    ),
  );
  if (assets.some((asset) => asset.cursor?.settings?.style === 'touch'))
    urls.add(TOUCH_CURSOR_ASSET.imageDataUrl);
  const images = new Map<string, HTMLImageElement>();
  for (const url of urls) {
    const image = new Image();
    image.src = url;
    await image.decode();
    images.set(url, image);
  }
  return images;
}

/** Resolve a frame's cursor and already-decoded bitmap for the synchronous export draw. */
export function cursorDrawing(
  clips: Clip[],
  assets: Asset[],
  frame: number,
  layout: Layout,
  images: Map<string, HTMLImageElement>,
  tracks: TrackDef[],
): (CursorFrame & { image: HTMLImageElement }) | undefined {
  const cursor = cursorFrame(clips, assets, frame, layout, tracks);
  const image = cursor && images.get(cursor.imageDataUrl);
  return cursor && image ? { ...cursor, image } : undefined;
}
