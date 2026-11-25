import { cameraTransform, type Rect } from './stage';
import { MAX_FRAMES } from './timeline-model';

/**
 * What a mask does to the screen panel: `solid` paints over the region, `spotlight` dims everything
 * outside it. Blur and pixelate are not here until the owner picks them.
 */
const MASK_KINDS = ['solid', 'spotlight'] as const;
export type MaskKind = (typeof MASK_KINDS)[number];

/**
 * A timed region of the screen panel. It lives on the timeline like a zoom (frames, not source
 * time) and, unlike zooms, may overlap others. The rect is in fractions of the panel at camera
 * scale 1, so it follows crop, zoom and pan with the content it covers. Screen panel only.
 */
export type Mask = {
  id: string;
  /** First frame it shows on. */
  start: number;
  /** Frames it shows for; it is gone from frame `start + duration`. */
  duration: number;
  kind: MaskKind;
  /** Left edge, 0 to 1 of the panel width. */
  x: number;
  /** Top edge, 0 to 1 of the panel height. */
  y: number;
  /** 0 to 1 of the panel width. */
  width: number;
  /** 0 to 1 of the panel height. */
  height: number;
  /** 0 to 1: how strongly the solid fill or the dimming shows. */
  opacity: number;
};

/** Smallest mask: whole frames and fractions of the panel; nothing a viewer could not see. */
export const MASK_LIMITS = { minFrames: 6, minSize: 0.02, minOpacity: 0.05 };

const EPSILON = 1e-9; // → slack for fractions that sum to 1 in floating point

/** The masks showing on `frame`: start included, `start + duration` excluded, in list order. */
export function activeMasks(masks: readonly Mask[], frame: number): Mask[] {
  return masks.filter((mask) => frame >= mask.start && frame < mask.start + mask.duration);
}

/**
 * The mask's rect in stage pixels, moved and scaled as the zoom camera moves the panel's content.
 * @param panel the screen panel's rect on the stage (`maskRect('screen', layout)`)
 * @param camera the zoom camera at the frame; omit for a still panel
 */
export function maskOnStage(
  mask: Rect,
  panel: Rect,
  camera?: Parameters<typeof cameraTransform>[1],
): Rect {
  const view = cameraTransform(panel, camera); // → panel-local to stage affine
  return {
    x: mask.x * panel.width * view.scale + view.x,
    y: mask.y * panel.height * view.scale + view.y,
    width: mask.width * panel.width * view.scale,
    height: mask.height * panel.height * view.scale,
  };
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** A copy of `rect` that is at least the minimum size and sits wholly inside the panel. */
export function clampMaskRect<T extends Rect>(rect: T): T {
  const width = clamp(rect.width, MASK_LIMITS.minSize, 1);
  const height = clamp(rect.height, MASK_LIMITS.minSize, 1);
  return {
    ...rect,
    width,
    height,
    x: clamp(rect.x, 0, 1 - width),
    y: clamp(rect.y, 0, 1 - height),
  };
}

const fail = (field: string, rule: string): never => {
  throw new RangeError(`mask.${field} must be ${rule}.`);
};

const between = (value: number, low: number, high: number, field: string) => {
  if (!Number.isFinite(value) || value < low || value > high)
    fail(field, `a number from ${low} to ${high}`);
};

/**
 * Checks a mask is one the renderer can draw faithfully and returns it unchanged.
 * @throws {RangeError} Naming the first bad field: an empty id, an unknown kind, a start or
 * duration that is not whole frames, a mask past 24 hours, or a rect, opacity or size outside
 * its limits.
 */
export function validateMask(mask: Mask): Mask {
  if (!mask.id) fail('id', 'a non-empty string');
  if (!(MASK_KINDS as readonly string[]).includes(mask.kind))
    fail('kind', `one of ${MASK_KINDS.join(', ')}`);
  if (!Number.isInteger(mask.start) || mask.start < 0) fail('start', 'a whole frame from 0');
  if (!Number.isInteger(mask.duration) || mask.duration < MASK_LIMITS.minFrames)
    fail('duration', `a whole number of at least ${MASK_LIMITS.minFrames} frames`);
  if (mask.start + mask.duration > MAX_FRAMES) fail('start', 'inside the 24 hours of timeline');
  between(mask.x, 0, 1, 'x');
  between(mask.y, 0, 1, 'y');
  between(mask.width, MASK_LIMITS.minSize, 1, 'width');
  between(mask.height, MASK_LIMITS.minSize, 1, 'height');
  if (mask.x + mask.width > 1 + EPSILON || mask.y + mask.height > 1 + EPSILON)
    fail('rect', 'inside the panel');
  between(mask.opacity, MASK_LIMITS.minOpacity, 1, 'opacity');
  return mask;
}
