import { useRef, useState } from 'react';
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

const BEHAVIOR_FLAGS = [
  ['removeShakes', 'Remove small shakes'],
  ['stabilizeShapes', 'Stabilize recorded shapes'],
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
    <>
      <fieldset className="cursor-group">
        <legend>Motion</legend>
        <label>
          Movement
          <select
            aria-label="Cursor motion"
            value={settings.mode}
            onChange={(event) =>
              onChange({
                ...settings,
                mode: event.currentTarget.value === 'raw' ? 'raw' : 'smooth',
              })
            }
          >
            <option value="smooth">Smooth</option>
            <option value="raw">Raw</option>
          </select>
        </label>
        <label>
          Animation
          <select
            aria-label="Cursor animation style"
            value={settings.animationStyle ?? 'smooth'}
            disabled={settings.mode === 'raw'}
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
        <p className="cursor-note">
          {settings.mode === 'raw'
            ? 'Raw interpolates recorded positions and bypasses animation styles.'
            : 'None steps at recorded sample times. Raw motion still interpolates between them.'}
        </p>
      </fieldset>
      <details className="cursor-behavior">
        <summary>Cleanup</summary>
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
        </div>
        <p className="cursor-note">
          Reduce small movements and brief shape changes. Clicks stay exact.
        </p>
      </details>
      <details className="cursor-behavior">
        <summary>Advanced cursor</summary>
        <div className="cursor-appearance">
          <label>
            <input
              type="checkbox"
              checked={Boolean(settings.rotate)}
              onChange={(event) => onChange({ ...settings, rotate: event.currentTarget.checked })}
            />
            Rotate with movement
          </label>
          <label>
            Per-clip ending
            <select
              aria-label="Cursor ending"
              value={settings.ending ?? 'none'}
              onChange={(event) => {
                const value = event.currentTarget.value;
                onChange({
                  ...settings,
                  ending: value === 'stop' || value === 'loop' ? value : undefined,
                });
              }}
            >
              <option value="none">Recorded ending</option>
              <option value="stop">Stop early</option>
              <option value="loop">Return to start</option>
            </select>
          </label>
        </div>
        <p className="cursor-note">
          Ending effects use the last 0.5 s of each trimmed clip, or half of shorter clips.
        </p>
        <CursorHiddenRanges settings={settings} onChange={onChange} />
      </details>
    </>
  );
}

function CursorAppearance({
  cursor,
  onChange,
}: {
  cursor?: CursorTrack;
  onChange: (cursor: CursorTrack) => void;
}) {
  if (!cursor)
    return (
      <p className="cursor-note">
        Attach cursor data to edit this recording's cursor. Video pixels are unchanged.
      </p>
    );
  const settings = cursor.settings ?? DEFAULT_CURSOR_SETTINGS;
  return (
    <>
      <fieldset className="cursor-group">
        <legend>Appearance &amp; visibility</legend>
        <label>
          Style
          <select
            aria-label="Cursor style"
            value={settings.style ?? 'recorded'}
            onChange={(event) => {
              const style = event.currentTarget.value;
              if (style === 'recorded' || style === 'default' || style === 'touch')
                onChange({ ...cursor, settings: { ...settings, style } });
            }}
          >
            <option value="recorded">Recorded shapes</option>
            <option value="default">First embedded shape</option>
            <option value="touch">Touch</option>
          </select>
        </label>
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
              onChange({
                ...cursor,
                settings: { ...settings, hidden: event.currentTarget.checked },
              })
            }
          />
          Hide cursor
        </label>
        <label>
          <input
            type="checkbox"
            checked={Boolean(settings.hideIdle)}
            onChange={(event) =>
              onChange({
                ...cursor,
                settings: { ...settings, hideIdle: event.currentTarget.checked },
              })
            }
          />
          Hide when idle (1 s)
        </label>
      </fieldset>
      <CursorBehavior
        settings={settings}
        onChange={(next) => onChange({ ...cursor, settings: next })}
      />
    </>
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
          <label className="cursor-offset">
            Offset (ms)
            <input
              type="number"
              aria-label="Cursor time offset (ms)"
              defaultValue={cursor.offsetMs}
              title="Positive delays the cursor. Negative advances it. Source time stays unchanged."
              onChange={(event) => {
                const offsetMs = event.currentTarget.valueAsNumber;
                if (Number.isFinite(offsetMs) && Math.abs(offsetMs) <= Number.MAX_SAFE_INTEGER)
                  onChange({ ...cursor, offsetMs });
              }}
              onBlur={(event) => {
                event.currentTarget.value = String(cursor.offsetMs);
              }}
            />
          </label>
          <button className="text-button" onClick={() => onChange(undefined)}>
            Remove cursor sidecar
          </button>
        </>
      )}
    </>
  );
}

/** Recording-wide cursor settings for the inspected video source, shared with Storybook. */
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
        <p className="cursor-scope">Recording settings · affects all uses</p>
      </div>
      <CursorAppearance cursor={cursor} onChange={onChange} />
      <details className="cursor-behavior" open={!cursor}>
        <summary>Source data</summary>
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
      </details>
      {state.kind === 'error' && (
        <p role="alert" className="cursor-error">
          Could not attach cursor. {state.message}
        </p>
      )}
    </section>
  );
}
