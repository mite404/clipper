import { cameraTransform, type Rect } from './stage';
import { MAX_FRAMES } from './timeline-model';

/**
 * What a mask does to the screen panel: `solid` paints over the region, `spotlight` dims everything
 * outside it, `blur` blurs the region and `pixelate` turns it into coarse blocks (a mosaic).
 */
const MASK_KINDS = ['solid', 'spotlight', 'blur', 'pixelate'] as const;
const STRENGTH_KINDS = ['blur', 'pixelate'] as const;

type MaskBase = {
  id: string;
  /** First frame it shows on. */
  start: number;
  /** Frames it shows for; it is gone from frame `start + duration`. */
  duration: number;
  /** Left edge, 0 to 1 of the panel width. */
  x: number;
  /** Top edge, 0 to 1 of the panel height. */
  y: number;
  /** 0 to 1 of the panel width. */
  width: number;
  /** 0 to 1 of the panel height. */
  height: number;
};

/**
 * A timed region of the screen panel. It lives on the timeline like a zoom (frames, not source
 * time) and, unlike zooms, may overlap others. The rect is in fractions of the panel at camera
 * scale 1, anchored to the screen panel after crop; it follows zoom and pan with the content it
 * covers. Screen panel only.
 *
 * `solid` and `spotlight` have an `opacity`: how strongly the fill or the dimming shows. `blur` and
 * `pixelate` are always fully applied, so they have no opacity and take a `strength` instead.
 */
export type Mask = MaskBase &
  (
    | {
        kind: 'solid' | 'spotlight';
        /** 0 to 1: how strongly the solid fill or the dimming shows. */
        opacity: number;
        strength?: undefined;
      }
    | {
        kind: 'blur' | 'pixelate';
        /**
         * How hard the video underneath is to read, as a fraction of the screen panel's width at
         * camera scale 1, so it does not depend on the export size. For `blur` it is the blur
         * radius, for `pixelate` the edge of one block; see {@link maskStrengthPx}.
         */
        strength: number;
        opacity?: undefined;
      }
  );

/**
 * Smallest mask: whole frames and fractions of the panel; nothing a viewer could not see. Strength
 * runs from half a percent of the panel width, a light softening, to a tenth of it, a heavy one.
 * That is a visual range, not a privacy guarantee: large text can stay recognizable at the maximum
 * and a small label can stay readable at the minimum. For real redaction use `solid`.
 */
export const MASK_LIMITS = {
  minFrames: 6,
  minSize: 0.02,
  minOpacity: 0.05,
  minStrength: 0.005,
  maxStrength: 0.1,
};

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

/**
 * The blur radius, or the pixelate block edge, for a blur or pixelate mask: its strength times the
 * panel's width, times the zoom scale once, since a zoom magnifies the content the mask hides. The
 * result is in the units of the `panel` you pass in (stage pixels for a stage rect, render pixels
 * for a render rect). Undefined for `solid` and `spotlight`.
 */
export function maskStrengthPx(
  mask: Mask,
  panel: Rect,
  camera?: Parameters<typeof cameraTransform>[1],
): number | undefined {
  if (mask.strength === undefined) return undefined;
  return mask.strength * panel.width * (camera?.scale ?? 1);
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
  if ((STRENGTH_KINDS as readonly string[]).includes(mask.kind)) {
    if (mask.opacity !== undefined) fail('opacity', 'absent for blur and pixelate');
    between(mask.strength as number, MASK_LIMITS.minStrength, MASK_LIMITS.maxStrength, 'strength');
  } else {
    if (mask.strength !== undefined) fail('strength', 'absent for solid and spotlight');
    between(mask.opacity as number, MASK_LIMITS.minOpacity, 1, 'opacity');
  }
  return mask;
}
