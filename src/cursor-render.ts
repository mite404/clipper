import type { Asset } from './media';
import { covers, sourceFrame, FPS, type Clip } from './timeline-model';
import { coverRect, cropPosition, maskRect, type Layout, type Rect } from './stage';
import { cursorAt } from './cursor-motion';

export type CursorFrame = Rect & { imageDataUrl: string };

/** Project one frame's source cursor into the screen mask's local pixel coordinates. */
export function cursorFrame(
  clips: Clip[],
  assets: Asset[],
  frame: number,
  layout: Layout,
): CursorFrame | undefined {
  const clip = clips.find((item) => item.track === 'screen' && covers(item, frame));
  const source = assets.find((asset) => asset.id === clip?.assetId);
  if (!clip || !source?.cursor) return undefined;
  const pose = cursorAt(source.cursor, (sourceFrame(clip, frame) / FPS) * 1000);
  if (!pose) return undefined;
  const mask = maskRect('screen', layout);
  const cover = coverRect(mask, source, cropPosition('screen', layout));
  const size = cover.scale * (source.cursor.settings?.size ?? 1);
  return {
    x: cover.x + pose.cx * cover.width - pose.asset.hotspotX * size,
    y: cover.y + pose.cy * cover.height - pose.asset.hotspotY * size,
    width: pose.asset.width * size,
    height: pose.asset.height * size,
    imageDataUrl: pose.asset.imageDataUrl,
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
