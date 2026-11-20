import { AudioToggles, type TrackToggles } from './Timeline';
import { GAIN_LIMITS, gainDb, type Track, type TrackDef } from './timeline-model';

/**
 * The audio mixer the transport's rightmost button swaps in for the timeline: one row per audio
 * track with the lane's mute and solo toggles and a gain fader on the same 0.5 dB grid the clip
 * gain uses. A fader drag edits live and commits one undo step on release, through the scrub
 * gesture callbacks; the toggles save with the project, outside undo, like the lane headers.
 * A locked lane's fader is disabled, like the clip gain's drag: the drag rides the scrub gesture,
 * which bypasses the lock change() enforces, so the guard belongs at the control.
 * @param onGain Takes each fader position in dB during a drag, and through history otherwise.
 */
export function Mixer({
  tracks,
  toggles,
  locked,
  onToggleTrack,
  onGain,
  onScrubStart,
  onScrubEnd,
}: {
  tracks: TrackDef[];
  toggles: TrackToggles;
  locked: Track[];
  onToggleTrack: (list: keyof TrackToggles, track: Track) => void;
  onGain: (track: Track, db: number) => void;
  onScrubStart: () => void;
  onScrubEnd: (canceled: boolean) => void;
}) {
  return (
    <div className="mixer" role="region" aria-label="Audio mixer" data-testid="mixer">
      {tracks
        .filter((track): track is Extract<TrackDef, { kind: 'audio' }> => track.kind === 'audio')
        .map((track) => {
          const db = gainDb(track.gain); // → dB on the fader grid
          const isLocked = locked.includes(track.id);
          return (
            <div className="mixer-row" key={track.id} data-testid={`mixer-${track.id}`}>
              <span className="mixer-label">{track.label}</span>
              <AudioToggles track={track} tracks={toggles} onToggleTrack={onToggleTrack} />
              <label className="mixer-gain">
                <input
                  aria-label={`${track.label} gain`}
                  type="range"
                  min={GAIN_LIMITS.min}
                  max={GAIN_LIMITS.max}
                  step={GAIN_LIMITS.step}
                  value={db}
                  aria-valuetext={`${db.toFixed(1)} dB`}
                  disabled={isLocked}
                  onPointerDown={isLocked ? undefined : onScrubStart}
                  onChange={
                    isLocked ? undefined : (event) => onGain(track.id, Number(event.target.value))
                  }
                  onPointerUp={isLocked ? undefined : () => onScrubEnd(false)}
                />
                <output>{db.toFixed(1)} dB</output>
              </label>
            </div>
          );
        })}
    </div>
  );
}
