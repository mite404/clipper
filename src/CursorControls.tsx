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

const BEHAVIOR_FLAGS = [
  ['hideIdle', 'Hide when idle (1 s)'],
  ['removeShakes', 'Remove small shakes'],
] as const;

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()} ${singular}${count === 1 ? '' : 's'}`;
}

function CursorBehavior({
  settings,
  onChange,
}: {
  settings: CursorSettings;
  onChange: (settings: CursorSettings) => void;
}) {
  return (
    <details className="cursor-behavior">
      <summary>Advanced cursor</summary>
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
          Ending
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
        Small-shake removal holds movements within 0.5% of the source. Clicks stay exact.
      </p>
    </details>
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
      <label>
        Motion
        <select
          aria-label="Cursor motion"
          value={settings.mode}
          onChange={(event) =>
            onChange({
              ...cursor,
              settings: {
                ...settings,
                mode: event.currentTarget.value === 'raw' ? 'raw' : 'smooth',
              },
            })
          }
        >
          <option value="smooth">Smooth</option>
          <option value="raw">Raw</option>
        </select>
      </label>
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
