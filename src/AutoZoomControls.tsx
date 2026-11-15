import { useState } from 'react';
import type { Asset } from './media';
import type { Edit } from './project';
import { FPS, ZOOM_LIMITS, type Zoom } from './timeline';
import { generateZooms } from './zoom-generation';

/** Deliberate, undoable click-shot generation. Existing manual zooms are never replaced. */
export function AutoZoomControls({
  edit,
  assets,
  onChange,
}: {
  edit: Edit;
  assets: Asset[];
  onChange: (zooms: Zoom[]) => void;
}) {
  const [scale, setScale] = useState(1.8);
  const [hold, setHold] = useState(3);
  const [message, setMessage] = useState(
    'Generate from recorded clicks, or keep editing manually.',
  );
  const count = edit.zooms.filter((zoom) => zoom.source).length;
  return (
    <section className="cursor-controls" aria-label="Automatic zooms">
      <strong>Click-driven zooms</strong>
      <div className="cursor-appearance">
        <label>
          Amount
          <input
            type="number"
            aria-label="Automatic zoom amount"
            min={ZOOM_LIMITS.minScale}
            max={ZOOM_LIMITS.maxScale}
            step="0.1"
            defaultValue={scale}
            onChange={(event) => {
              const next = event.currentTarget.valueAsNumber;
              if (next >= ZOOM_LIMITS.minScale && next <= ZOOM_LIMITS.maxScale) setScale(next);
            }}
            onBlur={(event) => {
              event.currentTarget.value = String(scale);
            }}
          />
        </label>
        <label>
          Hold (s)
          <input
            type="number"
            aria-label="Automatic zoom hold seconds"
            min="0.2"
            max="10"
            step="0.1"
            defaultValue={hold}
            onChange={(event) => {
              const next = event.currentTarget.valueAsNumber;
              if (next >= ZOOM_LIMITS.minFrames / FPS && next <= 10) setHold(next);
            }}
            onBlur={(event) => {
              event.currentTarget.value = String(hold);
            }}
          />
        </label>
        <button
          className="secondary-button"
          onClick={() => {
            const zooms = generateZooms(
              edit.clips,
              assets,
              edit.layout,
              edit.zooms,
              scale,
              Math.round(hold * FPS),
            );
            onChange(zooms);
            const generated = zooms.filter((zoom) => zoom.source).length;
            setMessage(
              generated
                ? `${generated} automatic shots. Edit any shot to make it manual.`
                : 'No usable clicks. Attach a sidecar, check the source range, or add a manual zoom.',
            );
          }}
        >
          {count ? 'Regenerate zooms' : 'Generate zooms'}
        </button>
        <button
          className="text-button"
          disabled={!count}
          onClick={() => {
            onChange(edit.zooms.filter((zoom) => !zoom.source));
            setMessage('Automatic zooms removed. Manual zooms are unchanged.');
          }}
        >
          Remove automatic zooms
        </button>
      </div>
      <p
        className="cursor-note"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Automatic zoom result"
      >
        {message}
      </p>
    </section>
  );
}
