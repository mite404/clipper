import type { Asset } from './media';
import { covers, sourceFrame, FPS, type Clip } from './timeline-model';
import { coverRect, cropPosition, maskRect, STAGE, type Layout, type Rect } from './stage';
import { cursorAt, TOUCH_CURSOR_ASSET } from './cursor-motion';

export type CursorFrame = Rect & {
  imageDataUrl: string;
  // Clockwise degrees about the scaled bitmap hotspot, not its center.
  rotation: number;
  hotspotX: number;
  hotspotY: number;
};

/** Project a cursor and its bitmap hotspot into mask-local pixels at the requested render size. */
export function cursorFrame(
  clips: Clip[],
  assets: Asset[],
  frame: number,
  layout: Layout,
  renderSize = STAGE,
): CursorFrame | undefined {
  const clip = clips.find((item) => item.track === 'screen' && covers(item, frame));
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
  const cover = coverRect(mask, source, cropPosition('screen', layout));
  const size = cover.scale * (source.cursor.settings?.size ?? 1);
  return {
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
): (CursorFrame & { image: HTMLImageElement }) | undefined {
  const cursor = cursorFrame(clips, assets, frame, layout);
  const image = cursor && images.get(cursor.imageDataUrl);
  return cursor && image ? { ...cursor, image } : undefined;
}
