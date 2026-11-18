import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { Film, Image, Music2, Plus, Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui-sdk/react/tooltip';
import { WAVE_RATE, type Asset } from './media';
import type { Transcript } from './transcribe';
import { FPS, clock } from './timeline-model';

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

// Each source's loudest bin, scanned once per peaks array.
const loudestOf = new WeakMap<ArrayLike<number>, number>();

/**
 * The waveform's shape over source bins [from, to): one column per `step` whole bins, each the
 * loudest of its bins against the asset's loudest, joined through column centres. Columns never
 * split a bin: zoomed past the bin rate the line spreads the same bins wider, and below it bins
 * merge by their peak.
 * @param pixels The drawn width in device pixels.
 * @returns The step and an SVG path in column units, mirrored about y = 24.
 */
export function waveShape(peaks: ArrayLike<number>, from: number, to: number, pixels: number) {
  const step = Math.max(1, Math.ceil((to - from) / Math.max(1, pixels)));
  // The loudest of bins [start, end), 0 past the source's end.
  const loudest = (start: number, end: number) => {
    let max = 0;
    for (let i = start; i < Math.min(end, peaks.length); i++) max = Math.max(max, peaks[i]);
    return max;
  };
  // ponytail: one cached scan per source; every clip of it and every resize reuses it.
  let maximum = loudestOf.get(peaks);
  if (maximum === undefined)
    loudestOf.set(peaks, (maximum = Math.max(0.01, loudest(0, peaks.length))));
  const first = Math.floor(from / step);
  const amplitudes = Array.from({ length: Math.ceil(to / step) - first }, (_, i) =>
    Math.max(0.5, (loudest((first + i) * step, (first + i + 1) * step) / maximum) * 21),
  );
  const end = first + amplitudes.length;
  const top = amplitudes.map((a, i) => `L${first + i + 0.5},${24 - a}`).join('');
  const bottom = amplitudes
    .map((a, i) => `L${first + i + 0.5},${24 + a}`)
    .reverse()
    .join('');
  const [head, tail] = [amplitudes[0], amplitudes.at(-1)!];
  return {
    step,
    path: `M${first},${24 - head}${top}L${end},${24 - tail}L${end},${24 + tail}${bottom}L${first},${24 + head}Z`,
  };
}

/** Decoded waveform with the played region highlighted by the current timeline position. */
export function Waveform({
  peaks,
  progress = 0,
  offset = 0,
  duration,
}: {
  peaks: ArrayLike<number>;
  progress?: number;
  /** Source frames before the first drawn one. */
  offset?: number;
  /** Source frames drawn; the whole source by default. */
  duration?: number;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const clip = `wave${useId().replace(/\W/g, '')}`;
  const [pixels, setPixels] = useState(0);
  useLayoutEffect(() => {
    const element = svg.current!;
    const measure = () =>
      setPixels(element.getBoundingClientRect().width * window.devicePixelRatio);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const from = (offset / FPS) * WAVE_RATE; // → bin
  const to = duration === undefined ? peaks.length : from + (duration / FPS) * WAVE_RATE;
  const { step, path } = useMemo(
    () => waveShape(peaks, from, to, pixels),
    [peaks, from, to, pixels],
  );
  const x = from / step; // → column
  const width = (to - from) / step;
  return (
    <svg
      ref={svg}
      data-waveform="true"
      data-bins-per-second={WAVE_RATE / step}
      viewBox={`${x} 0 ${width} 48`}
      preserveAspectRatio="none"
      aria-label="Decoded audio waveform"
    >
      <clipPath id={clip}>
        <rect x={x} width={Math.max(0, Math.min(1, progress)) * width} height="48" />
      </clipPath>
      <path d={path} fill="currentColor" opacity=".5" />
      <path d={path} fill="currentColor" clipPath={`url(#${clip})`} />
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
