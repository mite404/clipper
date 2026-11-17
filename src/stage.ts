import type { VisualRole } from './timeline-model';

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
const CENTER: Point = { x: 50, y: 50 };

/** Normalized edit coordinates. Actual composer and export dimensions are selected separately. */
export const STAGE = { width: 1280, height: 720 };

const MARGIN = 10;
const GAP = 18;
const MASK_WIDTH = { screen: 880, camera: STAGE.width - 2 * MARGIN - GAP - 880 };

/**
 * Where a visual role paints, in render pixels or normalized edit coordinates when size is
 * omitted: a background fills the whole stage, a screen or camera its mask.
 */
export function maskRect(track: VisualRole, layout: Layout, size: Size = STAGE): Rect {
  if (track === 'background') return { x: 0, y: 0, ...size };
  const first: VideoTrack = layout.swapped ? 'camera' : 'screen';
  const scaleX = size.width / STAGE.width;
  const scaleY = size.height / STAGE.height;
  return {
    x: (track === first ? MARGIN : MARGIN + MASK_WIDTH[first] + GAP) * scaleX,
    y: MARGIN * scaleY,
    width: MASK_WIDTH[track] * scaleX,
    height: (STAGE.height - 2 * MARGIN) * scaleY,
  };
}

/** Crop position of a role in percent, with the meaning of CSS `object-position`. */
export function cropPosition(track: VisualRole, layout: Layout): Point {
  if (track === 'background') return CENTER;
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
