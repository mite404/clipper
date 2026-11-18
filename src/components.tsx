import { useMemo, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Film, Image, Music2, Plus, Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui-sdk/react/tooltip';
import type { Asset } from './media';
import type { Transcript } from './transcribe';
import { FPS } from './timeline-model';

const two = (n: number) => String(n).padStart(2, '0');

// Minutes and seconds, then frames when asked. From one hour up the hours lead, unpadded, so a
// reading never carries more than two minute digits and a long sequence cannot be misread.
function format(frame: number, withFrames: boolean): string {
  const seconds = Math.floor(frame / FPS);
  const hours = Math.floor(seconds / 3600);
  const fields = [Math.floor(seconds / 60) % 60, seconds % 60];
  if (withFrames) fields.push(Math.floor(frame) % FPS);
  return [...(hours ? [String(hours)] : []), ...fields.map(two)].join(':');
}

/** A composition frame as mm:ss:ff at 30fps, or h:mm:ss:ff from one hour up. */
export function timecode(frame: number): string {
  return format(frame, true);
}

/** The same frame to the second: mm:ss, or h:mm:ss from one hour up. */
export function clock(frame: number): string {
  return format(frame, false);
}

/** Native icon button with the same label visible on hover and keyboard focus. */
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip type="label" delay={400} disabled={props.disabled}>
      <TooltipTrigger
        type="button"
        className="icon-button"
        aria-label={label}
        {...props}
        title={undefined}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="icon-button-tooltip" sideOffset={8} collisionPadding={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/** Decoded waveform with the played region highlighted by the current timeline position. */
export function Waveform({
  peaks,
  progress = 0,
  offset = 0,
  duration = peaks.length,
}: {
  peaks: number[];
  progress?: number;
  offset?: number;
  duration?: number;
}) {
  const bars = useMemo(() => {
    const maximum = peaks.reduce((max, peak) => Math.max(max, peak), 0.01);
    return Array.from({ length: 120 }, (_, index) => {
      const from = Math.floor(offset + (index / 120) * duration);
      const to = Math.max(from + 1, Math.floor(offset + ((index + 1) / 120) * duration));
      const peak = peaks.slice(from, to).reduce((max, value) => Math.max(max, value), 0);
      const amplitude = Math.max(0.5, (peak / maximum) * 21);
      return `M${index * 4 + 2},${24 - amplitude}v${amplitude * 2}`;
    }).join(' ');
  }, [peaks, offset, duration]);
  return (
    <svg
      data-waveform="true"
      viewBox="0 0 480 48"
      preserveAspectRatio="none"
      aria-label="Decoded audio waveform"
    >
      <path d={bars} fill="none" stroke="currentColor" strokeWidth="2" opacity=".5" />
      <svg width={`${Math.max(0, Math.min(1, progress)) * 100}%`} overflow="hidden">
        <path d={bars} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </svg>
  );
}

/** Drag type of a media-pool item. A drop without it, such as a desktop file, is never placed. */
export const ASSET_DRAG = 'application/x-clipper-asset';

/** Media library with local-file import, source selection and drags onto the timeline. */
export function MediaLibrary({
  assets,
  selected,
  onSelect,
  onImport,
  onDrag,
  busy,
  children,
}: {
  assets: Asset[];
  selected: string;
  onSelect: (id: string) => void;
  onImport: (files: FileList) => void;
  /** The asset being dragged, then null once the drag ends however it ends. */
  onDrag?: (id: string | null) => void;
  busy: boolean;
  /** Controls for the selected source, below the list. */
  children?: ReactNode;
}) {
  return (
    <aside className="library">
      <div className="section-title">
        <span>Project media</span>
        <span className="count">{assets.length}</span>
      </div>
      <label className="import-button">
        <Upload size={15} /> Import media
        <input
          aria-label="Import local media"
          type="file"
          multiple
          accept="video/*,audio/*,.mov,.mp4,.png,.jpg,.jpeg,image/png,image/jpeg"
          disabled={busy}
          onChange={(event) => {
            if (event.target.files) onImport(event.target.files);
            event.target.value = '';
          }}
        />
        <span>↗</span>
      </label>
      <div className="library-note">Files stay on your device</div>
      <div className="asset-list">
        {assets.map((asset, index) => (
          <button
            key={asset.id}
            className={`asset ${selected === asset.id ? 'selected' : ''}`}
            aria-label={`Select ${asset.name}`}
            aria-pressed={selected === asset.id}
            onClick={() => onSelect(asset.id)}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(ASSET_DRAG, asset.id);
              event.dataTransfer.effectAllowed = 'copy';
              onDrag?.(asset.id);
            }}
            onDragEnd={() => onDrag?.(null)}
          >
            <div className={`asset-image asset-image-${asset.kind}`}>
              {asset.kind !== 'audio' ? (
                asset.thumbnail ? (
                  <img src={asset.thumbnail} alt="" />
                ) : (
                  <Film size={28} role="img" aria-label="Video preview unavailable" />
                )
              ) : (
                <Waveform peaks={asset.peaks} />
              )}
              <span className="asset-duration">
                {asset.kind === 'image' ? 'STILL' : clock(asset.duration)}
              </span>
              <span className="asset-number">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="asset-name">
              {
                {
                  image: <Image size={13} />,
                  video: <Film size={13} />,
                  audio: <Music2 size={13} />,
                }[asset.kind]
              }
              <span title={asset.name}>{asset.name}</span>
              <Plus size={13} />
            </div>
            <div className="asset-meta">
              {asset.kind !== 'audio'
                ? `${asset.width} × ${asset.height} · ${{ image: 'Still image', video: 'Video' }[asset.kind]}`
                : 'Audio · decoded waveform'}
            </div>
          </button>
        ))}
      </div>
      {children}
      <div className="library-footer">
        <span className="status-dot" />{' '}
        <span data-testid="media-status">
          {busy
            ? 'Processing media…'
            : `${assets.length} ${assets.length === 1 ? 'asset' : 'assets'} ready`}
        </span>
        <a href="/media/ATTRIBUTION.md" target="_blank" rel="noreferrer">
          Credits ↗
        </a>
      </div>
    </aside>
  );
}

/** What a source's transcript row shows and does, apart from seeking its preview. */
export type TranscriptProps = {
  transcript?: Transcript;
  /** The running transcription of this source: its status label and the share done, 0 to 1. */
  job?: { label: string; ratio: number };
  /** Why Transcribe is unavailable, such as no audio track or another run in progress. */
  unavailable?: string;
  onTranscribe: () => void;
  onCancel: () => void;
};

// Transcribe, or Cancel while a transcription of this source runs.
function TranscriptAction({
  transcript,
  job,
  unavailable,
  onTranscribe,
  onCancel,
}: TranscriptProps) {
  if (job)
    return (
      <button className="text-button" onClick={onCancel}>
        Cancel
      </button>
    );
  return (
    <button
      className="text-button"
      disabled={unavailable !== undefined}
      title={unavailable ?? 'Transcribe speech on this device. Audio never leaves it.'}
      onClick={onTranscribe}
    >
      {transcript ? 'Transcribe again' : 'Transcribe'}
    </button>
  );
}

// Progress while running, a note until there is speech, then the timed segments.
function TranscriptBody({
  transcript,
  job,
  note,
  onSeek,
}: Pick<TranscriptProps, 'transcript' | 'job'> & {
  note: string;
  onSeek: (seconds: number) => void;
}) {
  if (job)
    return (
      <div className="transcript-progress">
        <progress aria-label="Transcription progress" value={job.ratio} max={1} />
        <span>{job.label}</span>
      </div>
    );
  if (!transcript) return <p className="transcript-note">{note}</p>;
  if (!transcript.segments.length) return <p className="transcript-note">No speech found.</p>;
  return (
    <ol className="transcript-segments">
      {transcript.segments.map((segment) => (
        <li key={segment.start}>
          <button onClick={() => onSeek(segment.start)}>
            <time>{clock(segment.start * FPS)}</time>
            <span>{segment.text}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/** A source's local transcript: Transcribe, its progress and Cancel, then timed segments. */
export function TranscriptPanel({
  onSeek,
  ...props
}: TranscriptProps & { onSeek: (seconds: number) => void }) {
  return (
    <section className="transcript" aria-label="Transcript">
      <div className="transcript-head">
        <span>Transcript</span>
        <TranscriptAction {...props} />
      </div>
      <TranscriptBody
        {...props}
        note={props.unavailable ?? 'Speech is transcribed on this device.'}
        onSeek={onSeek}
      />
    </section>
  );
}
