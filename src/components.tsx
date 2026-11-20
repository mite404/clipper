import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import {
  Check,
  ChevronDown,
  Film,
  Image,
  Info,
  LayoutGrid,
  List,
  Music2,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@ui-sdk/react/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui-sdk/react/tooltip';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@ui-sdk/react/popover';
import { WAVE_RATE, stillAt, type Asset } from './media';
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

/**
 * An info button whose toggleable tooltip replaces a visible note (UI-10), following UI-1's
 * tooltip pattern: a press opens or closes it, outside press and Escape close it, and its text is
 * announced on open.
 */
export function InfoNote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip toggleable>
      <TooltipTrigger type="button" className="info-note" aria-label={label}>
        <Info aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent className="icon-button-tooltip" sideOffset={8} collisionPadding={8}>
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

// The agent's avatar with its presence dot; decorative, the chip's name carries the meaning.
function PresenceAvatar() {
  return (
    <span className="presence-avatar" aria-hidden="true">
      <Sparkles size={11} />
      <span className="presence-dot" />
    </span>
  );
}

/**
 * The connected agent's entry point (CLIP-51): a presence chip - avatar, live dot and the
 * agent's name - whose popover shows the session's name card and live tool-call count.
 */
export function PresenceChip({
  name,
  calls,
  onOpenAssistant,
}: {
  name: string;
  calls: number;
  onOpenAssistant: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger type="button" className="text-button assistant-toggle presence-chip">
        <PresenceAvatar />
        <span className="presence-name">{name}</span>
      </PopoverTrigger>
      <PopoverContent className="presence-popover" sideOffset={8} collisionPadding={8}>
        <PopoverTitle className="presence-title">
          <PresenceAvatar />
          {name} (AI)
        </PopoverTitle>
        <p className="presence-calls" aria-live="polite">
          {calls === 1 ? '1 call' : `${calls} calls`}
        </p>
        <PopoverClose type="button" className="text-button" onClick={onOpenAssistant}>
          Open assistant
        </PopoverClose>
      </PopoverContent>
    </Popover>
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
 * @param gain The clip's linear gain; columns scale by it and stop at the lane's edges.
 * @returns The step and an SVG path in column units, mirrored about y = 24.
 */
export function waveShape(
  peaks: ArrayLike<number>,
  from: number,
  to: number,
  pixels: number,
  gain = 1,
) {
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
    Math.min(
      24,
      Math.max(0.5, (loudest((first + i) * step, (first + i + 1) * step) / maximum) * 21 * gain),
    ),
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

/**
 * A ui-sdk select styled like Clipper's fields. Space is left to transport, as on a native select:
 * Enter, a click or typing opens or changes it.
 */
export function Choice<V extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  className = '',
  id,
  describedBy,
  steady,
  align,
}: {
  /** Accessible name of the trigger. */
  label?: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
  disabled?: boolean;
  className?: string;
  /** For an external `<label htmlFor>`. */
  id?: string;
  describedBy?: string;
  /** Size the trigger to its longest option, so changing the value never shifts the row. */
  steady?: boolean;
  /** Which trigger edge the list lines up with; `end` for a trigger that ends its row. */
  align?: 'start' | 'end';
}) {
  // Out of any surrounding <label>, whose activation would reopen the list on an option click,
  // but inside a modal <dialog>, which leaves everything outside it unclickable.
  const [container, setContainer] = useState<Element | null>(null);
  // Stable, so React attaches it once instead of detaching and reattaching it every commit.
  const portalFor = useCallback(
    (trigger: HTMLElement | null) => setContainer(trigger?.closest('dialog') ?? document.body),
    [],
  );
  return (
    <Select
      value={value}
      disabled={disabled}
      items={options}
      modal="pointer"
      container={container}
      onValueChange={(next) => {
        const found = options.find((o) => o.value === next);
        if (found) onChange(found.value);
      }}
    >
      <SelectTrigger
        className={`select ${className}`}
        data-value={value}
        ref={portalFor}
        id={id}
        aria-label={label}
        aria-describedby={describedBy}
        onKeyDown={(event) => {
          if (event.key === ' ') event.preventDefault();
        }}
      >
        {steady ? (
          // Every label shares one grid cell; only the current one shows, the rest only take room.
          <span className="select-steady">
            <SelectValue />
            {options.map((option) => (
              <span key={option.value} aria-hidden="true">
                {option.label}
              </span>
            ))}
          </span>
        ) : (
          <SelectValue />
        )}
        <ChevronDown size={12} aria-hidden="true" />
      </SelectTrigger>
      <SelectContent className="select-menu" sideOffset={4} collisionPadding={8} align={align}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} data-value={option.value}>
            <SelectItemText>{option.label}</SelectItemText>
            <SelectItemIndicator>
              <Check size={12} aria-hidden="true" />
            </SelectItemIndicator>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Decoded waveform with the played region highlighted by the current timeline position. */
export function Waveform({
  peaks,
  progress = 0,
  offset = 0,
  duration,
  gain,
}: {
  peaks: ArrayLike<number>;
  progress?: number;
  /** Source frames before the first drawn one. */
  offset?: number;
  /** Source frames drawn; the whole source by default. */
  duration?: number;
  /** The clip's linear gain, 1 by default. */
  gain?: number;
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
    () => waveShape(peaks, from, to, pixels, gain),
    [peaks, from, to, pixels, gain],
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

// Wheel pixels that make one step. A notch is 100 px on Windows, about 53 on Linux and halved on a
// high-density screen, so the bar sits below all of them; a trackpad's small deltas add up to it.
const NOTCH = 40;

/**
 * A video card's face. The mouse over it, or the wheel, scrubs the card's own position: the face
 * shows the frame there and the playhead line follows. The source preview is never moved; the
 * position is reported so selecting the card can adopt it. A wheel that cannot step (at either
 * end) is left to scroll the panel.
 */
function ScrubFace({
  asset,
  onPosition,
  children,
}: {
  asset: Extract<Asset, { kind: 'video' | 'audio' }>;
  /** Reports the card's own scrub position in seconds as the pointer or wheel moves it. */
  onPosition: (seconds: number) => void;
  children: ReactNode;
}) {
  // The last seekable source frame.
  const last = asset.duration - 1;
  // The card's own scrub position in source frames; nothing until the first hover.
  const [frame, setFrame] = useState<number | null>(null);
  const [still, setStill] = useState<string>();
  const face = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const latest = useRef(onPosition);
  useLayoutEffect(() => {
    latest.current = onPosition;
  });
  const move = useCallback((next: number) => {
    frameRef.current = next;
    setFrame(next);
    latest.current(next / FPS);
  }, []);
  // ponytail: one decode per scrub step with stale results dropped, so a fast scrub lags a frame
  // behind the pointer - prefetch a filmstrip if that ever feels slow.
  useEffect(() => {
    if (frame === null) return;
    let live = true;
    void stillAt(asset, frame).then((url) => {
      if (live) setStill(url);
    });
    return () => {
      live = false;
    };
  }, [asset, frame]);
  useLayoutEffect(() => {
    const element = face.current!;
    let pending = 0; // → wheel pixels not yet enough for a step
    const wheel = (event: WheelEvent) => {
      const current = frameRef.current;
      const direction = event.deltaY < 0 ? 1 : -1; // up is ahead
      const next = Math.min(last, Math.max(0, current + direction * FPS)); // → frames
      if (next === current || event.deltaY === 0) {
        pending = 0; // at an end: the wheel scrolls the panel
        return;
      }
      event.preventDefault();
      pending += event.deltaY * (event.deltaMode === 1 ? NOTCH / 3 : 1);
      if (Math.abs(pending) < NOTCH) return;
      pending = 0;
      move(next);
    };
    // Not React's onWheel, which is passive and cannot hold the panel still.
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [last, move]);
  return (
    <div
      ref={face}
      className="asset-face"
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return;
        const box = event.currentTarget.getBoundingClientRect();
        const share = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
        move(Math.round(share * last));
      }}
    >
      {still ? <img src={still} alt="" /> : children}
      {frame !== null && (
        <span
          className="asset-playhead"
          data-testid="asset-playhead"
          style={{ left: `${last ? Math.min(100, (frame / last) * 100) : 0}%` }}
        />
      )}
    </div>
  );
}

/** An asset's thumbnail, waveform or placeholder with its length and number. */
function AssetImage({
  asset,
  index,
  onPosition,
}: {
  asset: Asset;
  index: number;
  /** A video card reports its own scrub position here, for adoption on select. */
  onPosition?: (seconds: number) => void;
}) {
  const picture =
    asset.kind !== 'audio' ? (
      asset.thumbnail ? (
        <img src={asset.thumbnail} alt="" />
      ) : (
        <Film size={28} role="img" aria-label="Video preview unavailable" />
      )
    ) : (
      <Waveform peaks={asset.peaks} />
    );
  const badges = (
    <>
      <span className="asset-duration">
        {asset.kind === 'image' ? 'STILL' : clock(asset.duration)}
      </span>
      <span className="asset-number">{String(index + 1).padStart(2, '0')}</span>
    </>
  );
  return (
    <div className={`asset-image asset-image-${asset.kind}`}>
      {asset.kind === 'video' ? (
        <ScrubFace asset={asset} onPosition={(seconds) => onPosition?.(seconds)}>
          {picture}
        </ScrubFace>
      ) : (
        picture
      )}
      {badges}
    </div>
  );
}

type LibraryView = 'thumbnails' | 'clips';

// The compact row's first line, right of the icon: resolution and frame speed, when they exist.
const compactSpecs = (asset: Asset) =>
  asset.kind === 'audio'
    ? ''
    : `${asset.width} × ${asset.height}${asset.kind === 'video' && asset.fps ? ` · ${asset.fps} fps` : ''}`;

// The compact row's second line: length, or what a source without one is.
const compactMeta = (asset: Asset) =>
  asset.kind === 'audio'
    ? `Audio · ${clock(asset.duration)}`
    : asset.kind === 'image'
      ? 'Still image'
      : clock(asset.duration);

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
  /** Selects a source; with the card's own scrub position in seconds when it was scrubbed. */
  onSelect: (id: string, seconds?: number) => void;
  onImport: (files: FileList) => void;
  /** The asset being dragged, then null once the drag ends however it ends. */
  onDrag?: (id: string | null) => void;
  busy: boolean;
  /** Controls for the selected source, below the list. */
  children?: ReactNode;
}) {
  const [view, setView] = useState<LibraryView>('thumbnails');
  // Each card's own scrub position, kept so a select can adopt it. Never the source preview's.
  const positions = useRef(new Map<string, number>());
  return (
    <aside className="library">
      <div className="section-title">
        <span>Project media</span>
        <span className="library-view" role="group" aria-label="Media view">
          {(
            [
              ['thumbnails', 'Thumbnail view', LayoutGrid],
              ['clips', 'Clip view', List],
            ] as const
          ).map(([value, label, Icon]) => (
            <IconButton
              key={value}
              label={label}
              aria-pressed={view === value}
              onClick={() => setView(value)}
            >
              <Icon size={13} />
            </IconButton>
          ))}
          <span className="count">{assets.length}</span>
        </span>
      </div>
      <label className="import-button">
        <Upload size={15} /> Import media
        <input
          aria-label="Import local media"
          type="file"
          multiple
          accept="video/*,audio/*,.mov,.mp4,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
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
            className={`asset ${view === 'clips' ? 'compact' : ''} ${selected === asset.id ? 'selected' : ''}`}
            aria-label={`Select ${asset.name}`}
            aria-pressed={selected === asset.id}
            onClick={() => onSelect(asset.id, positions.current.get(asset.id))}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(ASSET_DRAG, asset.id);
              event.dataTransfer.effectAllowed = 'copy';
              onDrag?.(asset.id);
            }}
            onDragEnd={() => onDrag?.(null)}
          >
            {view === 'thumbnails' && (
              <AssetImage
                asset={asset}
                index={index}
                onPosition={(seconds) => positions.current.set(asset.id, seconds)}
              />
            )}
            <div className="asset-name">
              {
                {
                  image: <Image size={13} />,
                  video: <Film size={13} />,
                  audio: <Music2 size={13} />,
                }[asset.kind]
              }
              {view === 'clips' && compactSpecs(asset) && (
                <span className="asset-specs">{compactSpecs(asset)}</span>
              )}
              <span title={asset.name}>{asset.name}</span>
              <Plus size={13} />
            </div>
            <div className="asset-meta">
              {view === 'clips'
                ? compactMeta(asset)
                : asset.kind !== 'audio'
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
