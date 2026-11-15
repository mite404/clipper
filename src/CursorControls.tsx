import { useRef, useState } from 'react';
import type { Asset } from './media';
import {
  DEFAULT_CURSOR_SETTINGS,
  parseCursor,
  validateCursorImages,
  type CursorTrack,
} from './cursor';

type ImportState = { kind: 'idle' } | { kind: 'reading' } | { kind: 'error'; message: string };

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()} ${singular}${count === 1 ? '' : 's'}`;
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
