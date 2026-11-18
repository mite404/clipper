import { bindDrag } from '@ui-sdk/core';
import { useState, type PointerEvent } from 'react';
import { ZOOM_CURVES, type Zoom, type ZoomCurve } from './timeline-model';

type Preset = keyof typeof ZOOM_CURVES;
const PRESETS = Object.keys(ZOOM_CURVES) as Preset[];
// The plot is 200 × 100 user units inside an 8-unit margin, so a handle at an edge stays whole.
const [W, H, PAD] = [200, 100, 8];
// The two control points: which curve entries hold each one's x and y.
const POINTS = [
  { x: 0, y: 1 },
  { x: 2, y: 3 },
] as const;
// A value kept to 0..1 in hundredths.
const clamp = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
// The preset a curve is, or Custom; no curve is Smooth.
const presetOf = (curve?: ZoomCurve): Preset | 'Custom' =>
  curve
    ? (PRESETS.find((name) => ZOOM_CURVES[name].every((v, i) => v === curve[i])) ?? 'Custom')
    : 'Smooth';
// What a zoom stores for a curve: nothing for Smooth, so it eases exactly as zooms always have.
const stored = (curve: ZoomCurve) => (presetOf(curve) === 'Smooth' ? undefined : curve);
// The curve with one handle moved to (x, y).
const moved = (curve: ZoomCurve, point: number, x: number, y: number): ZoomCurve => {
  const next = [...curve] as ZoomCurve;
  next[POINTS[point].x] = clamp(x);
  next[POINTS[point].y] = clamp(y);
  return next;
};
// A handle drag: the curve follows the pointer, a release commits it and Escape puts it back.
function dragHandle(
  event: PointerEvent<SVGCircleElement>,
  curve: ZoomCurve,
  point: number,
  preview: (curve?: ZoomCurve) => void,
  commit: (curve: ZoomCurve) => void,
) {
  if (event.button !== 0) return;
  const plot = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
  let next = curve;
  bindDrag(event.currentTarget as unknown as HTMLElement, event.nativeEvent, {
    cancelOnEscape: true,
    onMove: ({ x, y }) => {
      const ux = ((x - plot.left) / plot.width) * (W + 2 * PAD) - PAD; // → plot units
      const uy = ((y - plot.top) / plot.height) * (H + 2 * PAD) - PAD;
      next = moved(curve, point, ux / W, 1 - uy / H);
      preview(next);
    },
    onEnd: (_event, canceled) => {
      preview(undefined);
      if (!canceled && next !== curve) commit(next);
    },
  });
}

// The ramp-in curve with its two cubic-bezier handles and a preset list. The ramp out plays the
// same curve backwards. Smooth stores no curve, so old projects stay as they were.
function RampCurve({
  curve,
  onChange,
}: {
  curve?: ZoomCurve;
  onChange: (curve?: ZoomCurve) => void;
}) {
  // The curve a held handle shows before release.
  const [held, setHeld] = useState<ZoomCurve>();
  const shown = held ?? curve ?? ZOOM_CURVES.Smooth;
  const preset = presetOf(shown);
  const set = (next: ZoomCurve) => onChange(stored(next));
  const at = (x: number, y: number) => [x * W, (1 - y) * H] as const; // → plot units
  const [x1, y1, x2, y2] = shown;
  return (
    <div className="ramp-curve">
      <label className="slider-label">
        Zoom ramp
        <select
          aria-label="Zoom ramp curve"
          value={preset}
          onChange={(event) => {
            onChange(stored([...ZOOM_CURVES[event.currentTarget.value as Preset]]));
          }}
        >
          {PRESETS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          {preset === 'Custom' && <option value="Custom">Custom</option>}
        </select>
      </label>
      <svg
        viewBox={`${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}`}
        aria-label={`Zoom ramp: ${preset}`}
        role="img"
      >
        <rect className="ramp-plot" width={W} height={H} />
        <line x1={0} y1={H} x2={at(x1, y1)[0]} y2={at(x1, y1)[1]} />
        <line x1={W} y1={0} x2={at(x2, y2)[0]} y2={at(x2, y2)[1]} />
        <path
          d={`M0 ${H} C${at(x1, y1).join(' ')} ${at(x2, y2).join(' ')} ${W} 0`}
          className="ramp-path"
        />
        {POINTS.map(({ x, y }, point) => (
          <circle
            key={point}
            aria-hidden="true"
            data-point={`${clamp(shown[x])} ${clamp(shown[y])}`}
            cx={at(shown[x], shown[y])[0]}
            cy={at(shown[x], shown[y])[1]}
            r={6}
            onPointerDown={(event) => dragHandle(event, shown, point, setHeld, set)}
          />
        ))}
      </svg>
    </div>
  );
}

/** Per-shot camera motion, shared by the editor inspector and its Storybook preview. */
export function ZoomMotionControls({
  zoom,
  onChange,
}: {
  zoom: Zoom;
  onChange: (zoom: Zoom) => void;
}) {
  return (
    <>
      <label className="slider-label">
        Camera follow
        <select
          aria-label="Camera follow"
          value={zoom.follow ?? 'fixed'}
          onChange={(event) => {
            const value = event.currentTarget.value;
            onChange({
              ...zoom,
              follow: value === 'focused' || value === 'smooth' ? value : undefined,
            });
          }}
        >
          <option value="fixed">Fixed focus</option>
          <option value="focused">Focused · quick reading holds</option>
          <option value="smooth">Smooth · fluid follow</option>
        </select>
      </label>
      <label className="slider-label">
        <span>
          <input
            type="checkbox"
            aria-label="Instant zoom"
            checked={zoom.instant ?? false}
            onChange={(event) => onChange({ ...zoom, instant: event.currentTarget.checked })}
          />{' '}
          Instant zoom
        </span>
      </label>
      {!zoom.instant && (
        <RampCurve
          curve={zoom.curve}
          onChange={(curve) => {
            const { curve: _old, ...rest } = zoom;
            onChange(curve ? { ...rest, curve } : rest);
          }}
        />
      )}
      <p className="inspector-copy">
        Follow needs recorded pointer data. Fixed focus works without it.
      </p>
    </>
  );
}
