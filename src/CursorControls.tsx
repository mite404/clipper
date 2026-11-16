import { useRef, useState } from 'react';
import { Activity, MousePointer2, Shapes, Spline } from 'lucide-react';
import touchImage from './cursor-touch.png?inline';
import { Collapsible } from '@/components/ui/collapsible';
import { Stepper } from '@/components/ui/stepper';
import { SelectField, type SelectOption } from './components';
import type { Asset } from './media';
import {
  DEFAULT_CURSOR_SETTINGS,
  parseCursor,
  validateCursorImages,
  type CursorSettings,
  type CursorTrack,
} from './cursor';

type ImportState = { kind: 'idle' } | { kind: 'reading' } | { kind: 'error'; message: string };

const ANIMATION_STYLES = ['smooth', 'medium', 'rapid', 'none'] as const;

const MOTION_OPTIONS: SelectOption<'smooth' | 'raw'>[] = [
  { value: 'smooth', label: 'Smooth', icon: <Spline size={13} /> },
  { value: 'raw', label: 'Raw', icon: <Activity size={13} /> },
];

const STYLE_OPTIONS: SelectOption<'recorded' | 'default' | 'touch'>[] = [
  { value: 'recorded', label: 'Recorded shapes', icon: <Shapes size={13} /> },
  { value: 'default', label: 'First embedded shape', icon: <MousePointer2 size={13} /> },
  { value: 'touch', label: 'Touch', icon: <img src={touchImage} alt="" width={13} height={13} /> },
];

const ENDING_OPTIONS: SelectOption<'none' | 'stop' | 'loop'>[] = [
  { value: 'none', label: 'Recorded ending' },
  { value: 'stop', label: 'Stop early' },
  { value: 'loop', label: 'Return to start' },
];

const BEHAVIOR_FLAGS = [
  ['hideIdle', 'Hide when idle (1 s)'],
  ['removeShakes', 'Remove small shakes'],
  ['stabilizeShapes', 'Stabilize recorded shapes'],
  ['rotate', 'Rotate with movement'],
] as const;

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()} ${singular}${count === 1 ? '' : 's'}`;
}

function CursorHiddenRanges({
  settings,
  onChange,
}: {
  settings: CursorSettings;
  onChange: (settings: CursorSettings) => void;
}) {
  const ranges = settings.hiddenRanges ?? [];
  const end = useRef<HTMLInputElement>(null);
  return (
    <section aria-label="Hidden cursor ranges">
      <p className="cursor-note">
        Hide sections by source video time, in seconds. Start is included; end is excluded. Applies
        to every use of this source, regardless of cursor offset.
      </p>
      {ranges.length === 0 && <p className="cursor-note">No hidden ranges.</p>}
      {ranges.map((range, index) => (
        <div className="cursor-appearance" key={`${range.startMs}-${range.endMs}-${index}`}>
          <span>
            {range.startMs / 1000} to {range.endMs / 1000} s
          </span>
          <button
            type="button"
            className="text-button"
            aria-label={`Remove hidden range ${index + 1}`}
            onClick={() =>
              onChange({ ...settings, hiddenRanges: ranges.filter((_, i) => i !== index) })
            }
          >
            Remove
          </button>
        </div>
      ))}
      <form
        className="cursor-appearance"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const startMs = Number(data.get('start')) * 1000;
          const endMs = Number(data.get('end')) * 1000;
          if (endMs <= startMs) {
            end.current?.setCustomValidity('End must be after start.');
            end.current?.reportValidity();
            return;
          }
          onChange({ ...settings, hiddenRanges: [...ranges, { startMs, endMs }] });
          event.currentTarget.reset();
        }}
        onInput={() => end.current?.setCustomValidity('')}
      >
        <label>
          From (s)
          <input
            type="number"
            name="start"
            aria-label="Hide cursor from (source seconds)"
            min="0"
            max={Number.MAX_SAFE_INTEGER / 1000}
            step="any"
            required
          />
        </label>
        <label>
          Until (s)
          <input
            ref={end}
            type="number"
            name="end"
            aria-label="Hide cursor until (source seconds)"
            min="0"
            max={Number.MAX_SAFE_INTEGER / 1000}
            step="any"
            required
          />
        </label>
        <button type="submit" className="text-button">
          Add hidden range
        </button>
      </form>
    </section>
  );
}

function CursorBehavior({
  settings,
  onChange,
}: {
  settings: CursorSettings;
  onChange: (settings: CursorSettings) => void;
}) {
  return (
    <Collapsible title="Advanced cursor" keepMounted>
      <div className="cursor-appearance">
        {BEHAVIOR_FLAGS.map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={Boolean(settings[key])}
              onChange={(event) => onChange({ ...settings, [key]: event.currentTarget.checked })}
            />
            {label}
          </label>
        ))}
        <label>
          Animation
          <select
            aria-label="Cursor animation style"
            value={settings.animationStyle ?? 'smooth'}
            disabled={settings.mode === 'raw'}
            title="Raw motion bypasses animation styles."
            onChange={(event) => {
              const animationStyle = ANIMATION_STYLES.find(
                (style) => style === event.currentTarget.value,
              );
              if (animationStyle) onChange({ ...settings, animationStyle });
            }}
          >
            {ANIMATION_STYLES.map((style) => (
              <option key={style} value={style}>
                {style[0].toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <SelectField
          caption="Ending"
          label="Cursor ending"
          value={settings.ending ?? 'none'}
          options={ENDING_OPTIONS}
          onValueChange={(ending) =>
            onChange({ ...settings, ending: ending === 'none' ? undefined : ending })
          }
        />
      </div>
      <p className="cursor-note">
        Ending effects use the last 0.5 s of each trimmed clip, or half of shorter clips.
        Small-shake removal holds movements within 0.5% of the source. Clicks stay exact.
        Stabilization holds the previous shape until a new shape is confirmed by samples at least
        100 ms apart. Interaction shapes appear immediately; tracking gaps reset it. Rotation leans
        up to 12° with horizontal movement over the previous 100 ms, around the recorded hotspot.
        Each trimmed clip starts upright. Medium and Rapid animate over the final 75% and 50% of
        each sample interval; None steps at recorded sample times. Raw motion bypasses animation
        styles.
      </p>
      <CursorHiddenRanges settings={settings} onChange={onChange} />
    </Collapsible>
  );
}

function CursorAppearance({
  cursor,
  onChange,
}: {
  cursor: CursorTrack;
  onChange: (cursor: CursorTrack) => void;
}) {
  const settings = cursor.settings ?? DEFAULT_CURSOR_SETTINGS;
  return (
    <div className="cursor-appearance">
      <SelectField
        caption="Motion"
        label="Cursor motion"
        value={settings.mode}
        options={MOTION_OPTIONS}
        onValueChange={(mode) => onChange({ ...cursor, settings: { ...settings, mode } })}
      />
      <SelectField
        caption="Style"
        label="Cursor style"
        value={settings.style ?? 'recorded'}
        options={STYLE_OPTIONS}
        onValueChange={(style) => onChange({ ...cursor, settings: { ...settings, style } })}
      />
      <label>
        Size
        <input
          type="number"
          aria-label="Cursor size"
          min="0.25"
          max="4"
          step="0.25"
          defaultValue={settings.size}
          onChange={(event) => {
            const size = event.currentTarget.valueAsNumber;
            if (Number.isFinite(size) && size >= 0.25 && size <= 4)
              onChange({ ...cursor, settings: { ...settings, size } });
          }}
          onBlur={(event) => {
            event.currentTarget.value = String(settings.size);
          }}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={settings.hidden}
          onChange={(event) =>
            onChange({ ...cursor, settings: { ...settings, hidden: event.currentTarget.checked } })
          }
        />
        Hide cursor
      </label>
      <CursorBehavior
        settings={settings}
        onChange={(next) => onChange({ ...cursor, settings: next })}
      />
    </div>
  );
}

function CursorDetails({
  cursor,
  onChange,
}: {
  cursor?: CursorTrack;
  onChange: (cursor: CursorTrack | undefined) => void;
}) {
  return (
    <>
      <span data-testid="cursor-status" aria-live="polite" aria-atomic="true">
        {cursor
          ? `${countLabel(cursor.recording.samples.length, 'sample')} · ${countLabel(cursor.recording.assets.length, 'cursor asset')}`
          : 'No cursor sidecar'}
      </span>
      {cursor && (
        <>
          <div
            className="cursor-offset"
            title="Positive delays the cursor. Negative advances it. Source time stays unchanged."
          >
            <Stepper
              label="Offset"
              name="Cursor time offset (ms)"
              unit="millisecond"
              step={1}
              largeStep={10}
              value={cursor.offsetMs}
              onValueChange={(offsetMs) => {
                if (Math.abs(offsetMs) <= Number.MAX_SAFE_INTEGER)
                  onChange({ ...cursor, offsetMs });
              }}
            />
          </div>
          <button className="text-button" onClick={() => onChange(undefined)}>
            Remove cursor sidecar
          </button>
          <CursorAppearance cursor={cursor} onChange={onChange} />
        </>
      )}
    </>
  );
}

/** Local sidecar attachment for the selected video source, shared with Storybook. */
export function CursorControls({
  asset,
  onChange,
}: {
  asset?: Asset;
  onChange: (cursor: CursorTrack | undefined) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ kind: 'idle' });
  if (asset?.kind !== 'video') return null;
  const cursor = asset.cursor;
  const attach = async (file: File) => {
    setState({ kind: 'reading' });
    try {
      if (file.size > 64 * 1024 * 1024) throw new Error('Sidecars must be smaller than 64 MB.');
      const recording = parseCursor(JSON.parse(await file.text()));
      await validateCursorImages({ recording });
      onChange({ recording, offsetMs: 0 });
      setState({ kind: 'idle' });
    } catch (error) {
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Invalid sidecar.',
      });
    }
  };
  return (
    <section className="cursor-controls" aria-label="Source cursor data">
      <div className="cursor-summary">
        <strong title={asset.name}>Cursor · {asset.name}</strong>
      </div>
      <CursorDetails key={state.kind} cursor={cursor} onChange={onChange} />
      <button
        className="text-button"
        disabled={state.kind === 'reading'}
        aria-busy={state.kind === 'reading'}
        onClick={() => input.current?.click()}
      >
        Attach sidecar
      </button>
      <input
        ref={input}
        type="file"
        hidden
        accept=".json,application/json"
        aria-label="Attach cursor sidecar"
        disabled={state.kind === 'reading'}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void attach(file);
        }}
      />
      <p className="cursor-note">OpenScreen v2 · Full-display capture · Local only.</p>
      {state.kind === 'error' && (
        <p role="alert" className="cursor-error">
          Could not attach cursor. {state.message}
        </p>
      )}
    </section>
  );
}
