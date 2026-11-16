import type { Zoom } from './timeline-model';

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
      <p className="inspector-copy">
        Follow needs recorded pointer data. Fixed focus works without it.
      </p>
    </>
  );
}
