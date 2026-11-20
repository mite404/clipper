import type { Clip, VisualRole } from './timeline-model';

/** Picture-in-picture corners for the camera inset, in reading order. */
export const CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
export type Corner = (typeof CORNERS)[number];
export type Layout = {
  // Side by side when absent. In PiP, swapped is kept but not applied.
  mode?: 'pip';
  // The PiP inset's corner; bottom-right when absent.
  corner?: Corner;
  swapped?: boolean;
  // The stage behind the panels: a solid colour, or with `fillTo` a gradient from `fill` to it.
  // All absent is today's look. `fillAngle` is CSS's: 0 points up, 90 right; 135 when absent.
  fill?: string;
  fillTo?: string;
  fillAngle?: number;
  // The panels' shadow strength, 0 to 100; absent or 0 draws none.
  shadow?: number;
  // The stage geometry, all absent is today's look: the padding around the panels in edit px, the
  // screen's share of the side-by-side width, and the PiP inset's share of the stage width.
  padding?: number;
  screenShare?: number;
  pipSize?: number;
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

/** The stage colour with no fill chosen. */
export const DEFAULT_FILL = '#172324';
/** What switching to a gradient starts from. */
export const DEFAULT_GRADIENT = { from: '#3b2a6b', to: DEFAULT_FILL, angle: 135 };
export const SHADOW_MAX = 100;

/** The stage's CSS `background` for a layout. */
export function fillCss({
  fill = DEFAULT_FILL,
  fillTo,
  fillAngle = DEFAULT_GRADIENT.angle,
}: Layout) {
  return fillTo === undefined ? fill : `linear-gradient(${fillAngle}deg, ${fill}, ${fillTo})`;
}

/**
 * The gradient line CSS draws for an angle over a box: through the centre, long enough that the
 * corners take the end colours, from the first colour's end to the second's.
 */
export function gradientLine(angle: number, size: Size) {
  const radians = (angle * Math.PI) / 180;
  const [dx, dy] = [Math.sin(radians), -Math.cos(radians)];
  const half = (Math.abs(size.width * dx) + Math.abs(size.height * dy)) / 2;
  const [cx, cy] = [size.width / 2, size.height / 2];
  return { x0: cx - dx * half, y0: cy - dy * half, x1: cx + dx * half, y1: cy + dy * half };
}

/**
 * The shadow under a masked panel, for a strength and the render size over the edit's:
 * a soft black drop, as CSS `box-shadow` and a canvas shadow both take it. None at 0.
 */
export function panelShadow(strength = 0, scale = 1) {
  if (!strength) return undefined;
  return {
    blur: 0.6 * strength * scale,
    offsetY: 0.2 * strength * scale,
    color: 'rgba(0, 0, 0, 0.5)',
  };
}

/** A masked panel's CSS `box-shadow`; none for the full-frame Background or a layout without one. */
export function maskShadowCss(role: VisualRole, layout: Layout, scale: number): string | undefined {
  const shadow = role === 'background' ? undefined : panelShadow(layout.shadow, scale);
  return shadow && `0 ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`;
}

/** The layout with its backdrop switched between a solid colour and a gradient. */
export function withBackdropStyle(layout: Layout, style: 'solid' | 'gradient'): Layout {
  if (style === 'gradient')
    return { ...layout, fill: layout.fill ?? DEFAULT_GRADIENT.from, fillTo: DEFAULT_GRADIENT.to };
  const { fillTo: _to, fillAngle: _angle, ...solid } = layout;
  return solid;
}

/** The layout with a panel shadow strength; 0 removes the field, so the file is as it was. */
export function withShadow(layout: Layout, strength: number): Layout {
  const { shadow: _previous, ...rest } = layout;
  return strength ? { ...rest, shadow: strength } : rest;
}

const GAP = 18;
/** The padding around the panels in edit px, and its bound; absent is today's 10. */
export const DEFAULT_PADDING = 10;
export const PADDING_MAX = 120;

/**
 * The value a stage field's text commits: a rounded number held inside the field's bounds, or
 * undefined when the text names no number, so the field puts its current value back.
 */
export function stageValueFromText(text: string, min: number, max: number): number | undefined {
  const value = text.trim() === '' ? NaN : Number(text);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : undefined;
}
/** The screen's share of the side-by-side width; absent is today's 880 of 1242. */
export const SCREEN_SHARE_LIMITS = { min: 0.5, max: 0.8 };
export const DEFAULT_SCREEN_SHARE = 880 / (STAGE.width - 2 * DEFAULT_PADDING - GAP);
/** The PiP inset's share of the stage width; absent is today's third. */
export const PIP_SIZE_LIMITS = { min: 0.2, max: 0.5 };
export const DEFAULT_PIP_SIZE = 1 / 3;

// A layout's panel geometry in edit coordinates: the panels' bounds, their side-by-side widths,
// and the PiP inset's 16:9 size.
function geometry({
  padding = DEFAULT_PADDING,
  screenShare = DEFAULT_SCREEN_SHARE,
  pipSize = DEFAULT_PIP_SIZE,
}: Layout) {
  const full: Rect = {
    x: padding,
    y: padding,
    width: STAGE.width - 2 * padding,
    height: STAGE.height - 2 * padding,
  };
  const screen = screenShare * (full.width - GAP);
  const insetWidth = full.width * pipSize;
  const inset = { width: insetWidth, height: (insetWidth * 9) / 16 };
  return { padding, full, maskWidth: { screen, camera: full.width - GAP - screen }, inset };
}

// The PiP camera inset, the padding inside the screen's corner, in edit coordinates.
function insetRect(
  corner: Corner = 'bottom-right',
  { padding, full, inset }: ReturnType<typeof geometry>,
): Rect {
  const [vertical, horizontal] = corner.split('-');
  const near = (start: number, length: number, size: number, far: boolean) =>
    far ? start + length - padding - size : start + padding;
  return {
    x: near(full.x, full.width, inset.width, horizontal === 'right'),
    y: near(full.y, full.height, inset.height, vertical === 'bottom'),
    ...inset,
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
  const panels = geometry(layout); // → panels, mask widths and inset in edit coordinates
  if (layout.mode === 'pip') {
    const rect = track === 'screen' ? panels.full : insetRect(layout.corner, panels); // → edit rect
    return {
      x: rect.x * scaleX,
      y: rect.y * scaleY,
      width: rect.width * scaleX,
      height: rect.height * scaleY,
    };
  }
  return {
    x: (track === first ? panels.padding : panels.padding + panels.maskWidth[first] + GAP) * scaleX,
    y: panels.padding * scaleY,
    width: panels.maskWidth[track] * scaleX,
    height: panels.full.height * scaleY,
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
 * Rectangle a clip occupies in its mask, in mask-local pixels. Fill is the cover crop at the crop
 * position; Fit is the whole source, centred. Scale then grows or shrinks it about the mask centre.
 * `scale` in the result is mask pixels per source pixel.
 */
export function clipRect(
  mask: Size,
  source: Size,
  position: Point,
  { fit, scale = 1 }: Pick<Clip, 'fit' | 'scale'>,
): Rect & { scale: number } {
  const base =
    fit === 'contain'
      ? Math.min(mask.width / source.width, mask.height / source.height) // → mask px per source px
      : Math.max(mask.width / source.width, mask.height / source.height);
  const at = fit === 'contain' ? CENTER : position;
  const grow = (side: number, size: number, percent: number) =>
    side / 2 + ((side - size * base) * (percent / 100) - side / 2) * scale;
  return {
    x: grow(mask.width, source.width, at.x),
    y: grow(mask.height, source.height, at.y),
    width: source.width * base * scale,
    height: source.height * base * scale,
    scale: base * scale,
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
 * @param cover the source's `clipRect` in this mask
 */
export function sourceToStage(point: Point, mask: Rect, cover: Rect, camera: Camera): Point {
  const transform = cameraTransform(mask, camera); // → mask-local to stage affine
  return {
    x: (cover.x + point.x * cover.width) * transform.scale + transform.x,
    y: (cover.y + point.y * cover.height) * transform.scale + transform.y,
  };
}
