import { useState } from 'react';
import { scrub } from './scrub';
import { GAIN_LIMITS, gainFromText } from './timeline-model';

/**
 * The Inspector's gain for the selected audio clip, in dB, as one row: the label, then a compact
 * number field. A value commits on Enter or blur as one undo step, snapped to 0.5 dB and held
 * inside the limits; text that is not a number puts back the clip's gain.
 * @param drag When given, the label scrubs the gain by dragging, through these callbacks.
 * @param label The row's accessible name; the clip row keeps its polished short "Gain" text.
 */
export function ClipGain({
  gain,
  onGain,
  drag,
  label = 'Clip gain',
}: {
  gain: number;
  onGain: (db: number) => void;
  drag?: {
    onScrub: (db: number) => void;
    onStart: () => void;
    onEnd: (canceled: boolean) => void;
  };
  label?: string;
}) {
  const [draft, setDraft] = useState(String(gain));
  const [previous, setPrevious] = useState(gain);
  if (previous !== gain) {
    setPrevious(gain);
    setDraft(String(gain));
  }
  return (
    <div className="inspector-section" role="group" aria-label={label}>
      <label
        className="slider-label"
        {...(drag && scrub({ ...GAIN_LIMITS, value: gain, ...drag }))}
      >
        {label === 'Clip gain' ? 'Gain' : label}
        <span className="gain-field">
          <input
            aria-label={`${label} dB`}
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
          dB
        </span>
      </label>
    </div>
  );
}
