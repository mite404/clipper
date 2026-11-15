export type Layout = {
  swapped?: boolean;
  radius: number;
  screenX: number;
  screenY: number;
  cameraX: number;
  cameraY: number;
};
export type Rect = { x: number; y: number; width: number; height: number };
// A point in pixels, or a crop position in percent, depending on the function.
type Point = { x: number; y: number };
type Size = { width: number; height: number };
// zoomCamera's output: scale about the mask centre, then a pan in percent of the mask size.
type Camera = { scale: number; x: number; y: number };
// stage = local * scale + (x, y), all in stage pixels.
type Affine = { scale: number; x: number; y: number };
const STILL: Camera = { scale: 1, x: 0, y: 0 };
type VideoTrack = 'screen' | 'camera';

/** Composition size in stage pixels. Preview, export and overlays all draw in this space. */
export const STAGE = { width: 1280, height: 720 };

const MARGIN = 10;
const GAP = 18;
const MASK_WIDTH = { screen: 880, camera: STAGE.width - 2 * MARGIN - GAP - 880 };

/** Stage rectangle of a video track's mask; `swapped` puts the camera on the left. */
export function maskRect(track: VideoTrack, layout: Layout): Rect {
  const first: VideoTrack = layout.swapped ? 'camera' : 'screen';
  return {
    x: track === first ? MARGIN : MARGIN + MASK_WIDTH[first] + GAP,
    y: MARGIN,
    width: MASK_WIDTH[track],
    height: STAGE.height - 2 * MARGIN,
  };
}

/** Crop position of a track in percent, with the meaning of CSS `object-position`. */
export function cropPosition(track: VideoTrack, layout: Layout): Point {
  return track === 'screen'
    ? { x: layout.screenX, y: layout.screenY }
    : { x: layout.cameraX, y: layout.cameraY };
}

/**
 * Rectangle a source occupies when it cover-fits a mask, in mask-local pixels.
 * `scale` is mask pixels per source pixel.
 * @param position crop position in percent: 0 keeps the left or top edge, 100 the right or bottom
 */
export function coverRect(mask: Size, source: Size, position: Point): Rect & { scale: number } {
  const scale = Math.max(mask.width / source.width, mask.height / source.height);
  const width = source.width * scale;
  const height = source.height * scale;
  return {
    x: ((mask.width - width) * position.x) / 100,
    y: ((mask.height - height) * position.y) / 100,
    width,
    height,
    scale,
  };
}

/** Zoom camera as an affine from mask-local to stage pixels; no camera leaves the mask still. */
export function cameraTransform(mask: Rect, camera: Camera = STILL): Affine {
  return {
    scale: camera.scale,
    x: mask.x + (mask.width / 2) * (1 - camera.scale) + (camera.x * mask.width) / 100,
    y: mask.y + (mask.height / 2) * (1 - camera.scale) + (camera.y * mask.height) / 100,
  };
}

/**
 * Stage position of a source point after cover crop and zoom.
 * @param point normalized source position, 0 to 1 on each axis
 * @param cover the source's `coverRect` in this mask
 */
export function sourceToStage(point: Point, mask: Rect, cover: Rect, camera: Camera): Point {
  const transform = cameraTransform(mask, camera); // → mask-local to stage affine
  return {
    x: (cover.x + point.x * cover.width) * transform.scale + transform.x,
    y: (cover.y + point.y * cover.height) * transform.scale + transform.y,
  };
}
