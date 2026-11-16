import { SelectField, type SelectOption } from './components';
import type { Zoom } from './timeline-model';

const FOLLOW_OPTIONS: SelectOption<'fixed' | 'focused' | 'smooth'>[] = [
  { value: 'fixed', label: 'Fixed focus' },
  { value: 'focused', label: 'Focused · quick reading holds' },
  { value: 'smooth', label: 'Smooth · fluid follow' },
];

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
      <div className="slider-label">
        <SelectField
          caption="Camera follow"
          label="Camera follow"
          value={zoom.follow ?? 'fixed'}
          options={FOLLOW_OPTIONS}
          onValueChange={(value) =>
            onChange({ ...zoom, follow: value === 'fixed' ? undefined : value })
          }
        />
      </div>
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
