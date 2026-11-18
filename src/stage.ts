import type { VisualRole } from './timeline-model';

/** Picture-in-picture corners for the camera inset, in reading order. */
export const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
export type Corner = (typeof CORNERS)[number];
export type Layout = {
  // Side by side when absent. In PiP, swapped is kept but not applied.
  mode?: 'pip';
  // The PiP inset's corner; bottom-right when absent.
  corner?: Corner;
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
// The PiP screen fills the stage inside the margin; the camera is a 16:9 third of it.
const FULL: Rect = {
  x: MARGIN,
  y: MARGIN,
  width: STAGE.width - 2 * MARGIN,
  height: STAGE.height - 2 * MARGIN,
};
const INSET = { width: FULL.width / 3, height: ((FULL.width / 3) * 9) / 16 };

// The PiP camera inset, MARGIN inside the screen's corner, in edit coordinates.
function insetRect(corner: Corner = 'bottom-right'): Rect {
  const [vertical, horizontal] = corner.split('-');
  const near = (start: number, length: number, inset: number, far: boolean) =>
    far ? start + length - MARGIN - inset : start + MARGIN;
  return {
    x: near(FULL.x, FULL.width, INSET.width, horizontal === 'right'),
    y: near(FULL.y, FULL.height, INSET.height, vertical === 'bottom'),
    ...INSET,
  };
}

/**
 * Where a visual role paints, in render pixels or normalized edit coordinates when size is
 * omitted: a background fills the whole stage, a screen or camera its mask.
 */
export function maskRect(track: VisualRole, layout: Layout, size: Size = STAGE): Rect {
  if (track === 'background') return { x: 0, y: 0, ...size };
  const first: VideoTrack = layout.swapped ? 'camera' : 'screen';
  const scaleX = size.width / STAGE.width;
  const scaleY = size.height / STAGE.height;
  if (layout.mode === 'pip') {
    const rect = track === 'screen' ? FULL : insetRect(layout.corner); // → edit rect
    return {
      x: rect.x * scaleX,
      y: rect.y * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    };
  }
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
