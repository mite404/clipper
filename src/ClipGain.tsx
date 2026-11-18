import { useState } from 'react';
import { GAIN_LIMITS, gainFromText } from './timeline-model';

/**
 * The Inspector's gain for the selected audio clip, in dB. A value commits on Enter or blur as one
 * undo step, snapped to 0.5 dB and held inside the limits; text that is not a number puts back the
 * clip's gain.
 */
export function ClipGain({ gain, onGain }: { gain: number; onGain: (db: number) => void }) {
  const [draft, setDraft] = useState(String(gain));
  const [previous, setPrevious] = useState(gain);
  if (previous !== gain) {
    setPrevious(gain);
    setDraft(String(gain));
  }
  return (
    <section className="cursor-controls" aria-label="Clip gain">
      <h3>Clip gain</h3>
      <label>
        Gain (dB){' '}
        <input
          aria-label="Clip gain dB"
          type="number"
          min={GAIN_LIMITS.min}
          max={GAIN_LIMITS.max}
          step={GAIN_LIMITS.step}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
          onBlur={() => {
            const db = gainFromText(draft);
            if (db !== undefined && db !== gain) onGain(db);
            setDraft(String(gain)); // a committed change re-syncs the draft through the new gain
          }}
        />
      </label>
    </section>
  );
}
