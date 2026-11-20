import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { toast } from '@ui-sdk/react/toast';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Clapperboard,
  CornerUpLeft,
  Copy,
  Crop,
  FolderOpen,
  Maximize2,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelBottomClose,
  PanelBottomOpen,
  Rows2,
  Pause,
  Play,
  Plus,
  Scissors,
  SkipBack,
  Slice,
  Trash2,
  ZoomIn,
  Sparkles,
} from 'lucide-react';
import { Composition } from './Composition';
import {
  Choice,
  IconButton,
  MediaLibrary,
  TranscriptPanel,
  Waveform,
  type TranscriptProps,
} from './components';
import {
  type Asset,
  DEFAULT_STILL_FRAMES,
  loadDemo,
  readBackgroundImage,
  readMedia,
  unreadableNamesake,
} from './media';
import { CREATE, Timeline } from './Timeline';
import { ClipEditContext } from './clip-primitive';
import { transcribe, type Transcript } from './transcribe';
import {
  DEFAULT_TRACKS,
  FPS,
  OUTPUT_FPS,
  type Clip,
  type DropTarget,
  type NewTrack,
  type OutputFps,
  type Chapter,
  type Track,
  type TrackDef,
  type Zoom,
  insertClip,
  lockedChange,
  moveTrack,
  clipPiece,
  overwrite,
  placeMedia,
  splitClip,
  splitWhere,
  addChapter,
  chapterId,
  chapterList,
  clipAt,
  clock,
  editPoint,
  removeChapter,
  retitleChapter,
  setGain,
  setSizing,
  scaleFromText,
  initialSizing,
  backgroundImage,
  isReferenced,
  removeBackgroundImage,
  setBackgroundImage,
  SCALE_LIMITS,
  shownChapters,
  timecode,
  trackNumber,
  trimTo,
  ZOOM_LIMITS,
  zoomsOverlap,
} from './timeline-model';
import { BackdropControls } from './BackdropControls';
import { BackgroundImageControl } from './BackgroundImage';
import { classifyChange, type Gesture } from './history';
import { PREVIEW_DIVISORS, savePreviewQuality, savedPreviewQuality } from './preview-quality';
import type { StepRange } from '@ui-sdk/core/number';
import { scrub } from './scrub';
import {
  librarySizeWarning,
  serializeProject,
  parseProject,
  validateSources,
  type Edit,
} from './project';
import { ChapterControls } from './ChapterControls';
import { ClipGain } from './ClipGain';
import { CursorControls } from './CursorControls';
import { ZoomMotionControls } from './ZoomMotionControls';
import { moveZoom, resizeZoom, resolveZooms } from './zoom-generation';
import { screenTracks } from './cursor-render';
import { CORNERS, maskRect, STAGE, type Layout } from './stage';
import { useMediaDrawer } from './useMediaDrawer';
import { PanelResizeHandle, usePanelLayout } from './PanelResizeHandle';
import { AgentPanel } from './AgentPanel';
import { timelineLines } from './agent';
import { mixAt, playSlices, stopSlices } from './scrub-audio';
import './styles.css';

const assistantToggle = () => document.querySelector<HTMLElement>('.assistant-toggle');

// Cmd+K cuts every unlocked track on a Mac; Alt+K does elsewhere, leaving Ctrl+K to the browser.
const MAC = /Mac|iP(hone|ad|od)/.test(navigator.platform);

// A focused slider keeps its movement keys and ignores deletion; everything else is a shortcut.
const SLIDER_KEYS = [
  'delete',
  'backspace',
  'arrowleft',
  'arrowright',
  'arrowup',
  'arrowdown',
  'home',
  'end',
  'pageup',
  'pagedown',
];
// Saved track toggles compared as sets: their order carries no meaning.
const toggleTrack = (tracks: Track[], track: Track) =>
  tracks.includes(track) ? tracks.filter((t) => t !== track) : [...tracks, track];
const sameTracks = (a: Track[], b: Track[]) => [...a].sort().join() === [...b].sort().join();

export const INITIAL_EDIT: Edit = {
  clips: [
    { id: 's1', assetId: 'landscape', track: 'screen', start: 0, duration: 180, offset: 0 },
    { id: 's2', assetId: 'landscape', track: 'screen', start: 180, duration: 180, offset: 210 },
    { id: 'c1', assetId: 'portrait', track: 'camera', start: 0, duration: 360, offset: 0 },
    { id: 'a1', assetId: 'voice', track: 'voice', start: 0, duration: 360, offset: 0 },
    { id: 'a2', assetId: 'music', track: 'music', start: 0, duration: 360, offset: 0 },
  ],
  zooms: [],
  // The camera crop sits high, so a tall source cropped into the PiP inset keeps the face. Side by
  // side's tall mask shows such a source's full height, so the anchor changes nothing there.
  layout: { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 15 },
  tracks: DEFAULT_TRACKS,
};

// The status line for one import: the count of files read, then every failure by name.
// A picked file once read: the asset to add, or to put in place of `replaces`.
type Imported = { imported: Asset; replaces: Asset | null };

const importSummary = (added: number, relinked: string[], notes: (string | null)[]) =>
  [
    added ? `Imported ${added} local file${added === 1 ? '' : 's'}. Nothing uploaded.` : null,
    relinked.length ? `Relinked ${relinked.join(', ')}: its clips use the new file.` : null,
    ...notes,
  ]
    .filter(Boolean)
    .join(' ');

// (library, import) → the library with the import added, or swapped in for the asset it replaces
const placeAsset = (library: Asset[], { imported, replaces }: Imported): Asset[] =>
  replaces
    ? library.map((item) => (item.id === replaces.id ? imported : item))
    : [...library, imported];

// A file named like a source that can no longer be read replaces it and keeps its id, so the clips
// cut from it work again. It is refused when those clips would not fit the new file.
async function importOne(file: File, library: Asset[], edit: Edit): Promise<Imported> {
  const replaces = (await unreadableNamesake(library, file.name)) ?? null;
  if (!replaces) return { imported: await readMedia(file, file.name), replaces };
  const imported = await readMedia(file, file.name, replaces.id, replaces.cursor);
  try {
    validateSources(edit, placeAsset(library, { imported, replaces }));
  } catch (error) {
    URL.revokeObjectURL(imported.url);
    throw error;
  }
  return { imported, replaces };
}

// A still owns timeline time, not a decoded source range. Match the portable 24-hour ceiling.
function stillFrames(value: string): number | null {
  const frames = Math.round(Number(value) * FPS);
  return frames >= 1 && frames <= 24 * 3600 * FPS ? frames : null;
}

// An unchanged value is not a commit: it reports nothing and records no step.
const commitIfChanged = (
  length: number,
  frames: number,
  onCommit: (frames: number) => string | null,
) => (length === frames ? null : onCommit(length));

function StillDuration({
  frames,
  max = 86400 * FPS,
  label,
  onCommit,
}: {
  frames: number;
  max?: number;
  label: string;
  onCommit: (frames: number) => string | null;
}) {
  const [draft, setDraft] = useState(String(Number((frames / FPS).toFixed(3))));
  const [previous, setPrevious] = useState(frames);
  const [error, setError] = useState<string | null>(null);
  if (previous !== frames) {
    setPrevious(frames);
    setDraft(String(Number((frames / FPS).toFixed(3))));
    setError(null);
  }
  return (
    <div className="source-range">
      <label>
        Duration{' '}
        <input
          aria-label={label}
          type="number"
          min={1 / FPS}
          max={max / FPS}
          step={1 / FPS}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          onBlur={() => {
            const length = stillFrames(draft);
            const failure =
              length === null || length > max
                ? 'Still duration must be at least one frame and fit within the 24-hour timeline.'
                : commitIfChanged(length, frames, onCommit);
            setError(failure);
            setDraft(String(Number(((failure ? frames : length!) / FPS).toFixed(3))));
          }}
        />{' '}
        seconds
      </label>
      {error && (
        <span className="source-error" role="status">
          {error}
        </span>
      )}
    </div>
  );
}

function sourceRangeEnd(asset?: Asset): number {
  if (!asset) return 0;
  return asset.kind === 'image' ? DEFAULT_STILL_FRAMES : asset.duration;
}

// Tracks a source can be inserted onto: stills and audio keep to their kind, video goes anywhere.
// Display order: visual tracks front to back, then audio, the way the timeline lists them.
function sourceTracks(tracks: TrackDef[], kind?: Asset['kind']): TrackDef[] {
  const fits = tracks.filter(
    (t) => kind === 'video' || (t.kind === 'audio') === (kind === 'audio'),
  );
  return [
    ...fits.filter((t) => t.kind === 'visual').reverse(),
    ...fits.filter((t) => t.kind === 'audio'),
  ];
}

// A pointer on the mouse target → its percent of the screen mask, clamped to the mask.
const maskPoint = (event: ReactPointerEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const percent = (value: number) => Math.max(0, Math.min(100, Math.round(value * 100)));
  return {
    x: percent((event.clientX - rect.left) / rect.width),
    y: percent((event.clientY - rect.top) / rect.height),
  };
};
const role = (track: TrackDef) => (track.kind === 'audio' ? 'audio' : track.role);
const labelOf = (tracks: TrackDef[], id: Track) => tracks.find((t) => t.id === id)?.label ?? id;

// The insertion target a newly chosen source starts on: the first audio track for audio, else
// the lowest screen, and a full-frame background only when it is the sole visual track.
function defaultTrack(tracks: TrackDef[], kind?: Asset['kind']): Track {
  const preference = kind === 'audio' ? ['audio'] : ['screen', 'camera', 'background'];
  return preference.map((want) => tracks.find((t) => role(t) === want)).find(Boolean)?.id ?? '';
}

function resizeStill(edit: Edit, clip: Clip, duration: number): Edit {
  const next = edit.clips.find(
    (c) => c.track === clip.track && c.start > clip.start && c.start < clip.start + duration,
  );
  if (next)
    throw new Error('Still duration would overlap the following clip. No clips were changed.');
  return { ...edit, clips: edit.clips.map((c) => (c.id === clip.id ? { ...c, duration } : c)) };
}

// What placement needs of a source: whole video and audio ranges, a still's default duration.
const placed = (asset: Asset) => ({
  assetId: asset.id,
  audio: asset.kind === 'audio',
  duration: sourceRangeEnd(asset),
});

// Where a source can go: its compatible tracks, then the tracks it could create.
function placeOptions(audio: boolean, tracks: TrackDef[]) {
  const creates: NewTrack[] = audio ? ['audio'] : ['screen', 'background'];
  return [
    ...sourceTracks(tracks, audio ? 'audio' : 'image').map((t) => ({
      value: t.id,
      label: `${trackNumber(tracks, t.id)} · ${t.label}`,
    })),
    ...creates.map((kind) => ({ value: `new:${kind}`, label: CREATE[kind] })),
  ];
}

/** Keyboard placement of the selected pool source: the same command as a drop. */
function PlaceOnTimeline({
  asset,
  tracks,
  onPlace,
}: {
  asset?: Asset;
  tracks: TrackDef[];
  onPlace: (target: DropTarget, seconds: number | null) => void;
}) {
  const [choice, setChoice] = useState('');
  const [seconds, setSeconds] = useState('');
  if (!asset) return null;
  const options = placeOptions(asset.kind === 'audio', tracks);
  // Same default target as Insert onto track, then the first option.
  const value =
    [choice, defaultTrack(tracks, asset.kind)].find((v) => options.some((o) => o.value === v)) ??
    options[0].value;
  return (
    <form
      className="place-control"
      onSubmit={(event) => {
        event.preventDefault();
        onPlace(
          value.startsWith('new:') ? { create: value.slice(4) as NewTrack } : { track: value },
          seconds === '' ? null : Number(seconds),
        );
      }}
    >
      <Choice label="Place onto" value={value} options={options} onChange={setChoice} />
      <input
        aria-label="Place at seconds"
        type="number"
        min={0}
        step="any"
        placeholder="Playhead"
        value={seconds}
        onChange={(e) => setSeconds(e.target.value)}
      />
      <button type="submit">Place on timeline</button>
    </form>
  );
}

function stillInsertionError(asset: Asset, edit: Edit, assets: Asset[]): string | null {
  if (asset.kind !== 'image') return null;
  try {
    validateSources(edit, assets);
  } catch (error) {
    return String(error);
  }
  return null;
}

type TranscriptionJob = { id: string; label: string; ratio: number; controller: AbortController };

// Why a source cannot be transcribed now, or undefined when it can.
const unavailable = (asset: Asset, running?: string) =>
  !asset.hasAudio
    ? 'This source has no audio track.'
    : running && running !== asset.id
      ? 'Another source is being transcribed.'
      : undefined;

// The footer status plus a toast: a success fades on its own, a failure stays until dismissed.
const announce = (setMessage: (text: string) => void, text: string, failed = false) => {
  setMessage(text);
  if (failed) toast.error(text, { duration: Infinity });
  else toast.success(text);
};
// The status line a finished, cancelled or failed transcription leaves.
const failure = (name: string, aborted: boolean, error: unknown) =>
  aborted
    ? 'Transcription cancelled.'
    : `Could not transcribe ${name}. ${error instanceof Error ? error.message : ''}`;
const success = (name: string, { segments }: Transcript) =>
  segments.length ? `Transcribed ${name}.` : `No speech found in ${name}.`;

// One source's transcript row, given the one transcription that may be running.
const transcriptRow = (
  asset: Asset,
  job: TranscriptionJob | null,
  start: (asset: Asset) => void,
): TranscriptProps => ({
  transcript: asset.transcript,
  job: job?.id === asset.id ? job : undefined,
  unavailable: unavailable(asset, job?.id),
  onTranscribe: () => start(asset),
  onCancel: () => job?.controller.abort(),
});

// One transcription at a time; its result lands on the source asset, as cursor data does.
function useTranscription(
  asset: Asset | undefined,
  setAssets: Dispatch<SetStateAction<Asset[]>>,
  setMessage: (message: string) => void,
): { row?: TranscriptProps; running: boolean; cancel: () => void } {
  const [job, setJob] = useState<TranscriptionJob | null>(null);
  const start = useCallback(
    async (target: Asset) => {
      const controller = new AbortController();
      const report = (label: string, ratio: number) =>
        setJob({ id: target.id, label, ratio, controller });
      report('Preparing audio', 0);
      try {
        const blob = await (await fetch(target.url)).blob();
        const transcript = await transcribe(blob, report, controller.signal);
        setAssets((all) => all.map((a) => (a.id === target.id ? { ...a, transcript } : a)));
        const done = success(target.name, transcript);
        announce(setMessage, done);
      } catch (error) {
        const text = failure(target.name, controller.signal.aborted, error);
        // A cancellation is status only; a failure also raises an error toast.
        if (controller.signal.aborted) setMessage(text);
        else announce(setMessage, text, true);
      } finally {
        setJob(null);
      }
    },
    [setAssets, setMessage],
  );
  const row = useMemo(
    () =>
      asset && asset.kind !== 'image' ? transcriptRow(asset, job, (a) => void start(a)) : undefined,
    [asset, job, start],
  );
  return { row, running: job !== null, cancel: () => job?.controller.abort() };
}

// A frame count as seconds to the millisecond, as the source range shows it.
const seconds = (frames: number) => Number((frames / FPS).toFixed(3));

type SourceRange = { start: number; end: number };

// The In point at a frame: never at or past the Out point.
const markIn = (range: SourceRange, frame: number): SourceRange => ({
  ...range,
  start: Math.max(0, Math.min(range.end - 1, frame)),
});

// The Out point includes the frame it is set on, so the end is the frame after it: the range
// keeps at least one frame and never runs past the source.
const markOut = (range: SourceRange, frame: number, length: number): SourceRange => ({
  ...range,
  end: Math.min(length, Math.max(range.start + 1, frame + 1)),
});

/** The source's mini playback bar: dragging it only seeks, and the In/Out range shows behind it. */
function SourceBar({
  duration,
  range,
  time,
  onTime,
}: {
  duration: number;
  range: SourceRange;
  /** The preview position and how to move it; without them the bar only shows the range. */
  time?: number;
  onTime?: (seconds: number) => void;
}) {
  const last = Math.max(1, duration - 1); // the slider stops a frame short of the end
  const at = (frame: number) => `${Math.min(100, (frame / last) * 100)}%`;
  return (
    <span className="source-bar">
      {onTime && (
        <input
          type="range"
          aria-label="Source preview position"
          min={0}
          max={(duration - 1) / FPS}
          step={1 / FPS}
          value={time}
          onChange={(e) => onTime(Number(e.target.value))}
        />
      )}
      <span
        className="source-bar-range"
        data-testid="source-bar-range"
        style={{ left: at(range.start), right: `calc(100% - ${at(range.end)})` }}
      />
    </span>
  );
}

/** Source preview with explicit in/out points and track-targeted ripple insertion. */
export function SourceMonitor({
  asset,
  tracks,
  onInsert,
  time,
  onTime,
  blocked = false,
  transcript,
}: {
  asset?: Asset;
  /** The preview position in seconds, owned by the caller so the library can move it too. */
  time: number;
  onTime: (seconds: number) => void;
  /** The edit's registry, so the target list follows created and reordered tracks. */
  tracks: TrackDef[];
  onInsert: (track: Track, offset: number, duration: number) => void;
  /** Pause source playback while workspace controls cannot be used. */
  blocked?: boolean;
  /** The source's transcript row; omitted for stills. */
  transcript?: TranscriptProps;
}) {
  const [sourceUrl, setSourceUrl] = useState(() => asset?.url);
  const [choice, setChoice] = useState<Track>(() => defaultTrack(tracks, asset?.kind));
  // A choice the registry no longer has, after an undo or a move, falls back to the default.
  const targets = sourceTracks(tracks, asset?.kind);
  const track = targets.some((t) => t.id === choice) ? choice : defaultTrack(tracks, asset?.kind);
  const [range, setRange] = useState(() => ({ start: 0, end: sourceRangeEnd(asset) }));
  const [preview, setPreview] = useState({ playing: false, error: '' });
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const playRequest = useRef<symbol | null>(null);
  // The last position the media itself reported. A position that differs was moved from outside,
  // by the library or a drag, and reaches the media; playback's own updates never seek it back.
  const reported = useRef(0);
  const played = (seconds: number) => {
    reported.current = seconds;
    onTime(seconds);
  };
  useLayoutEffect(() => {
    const media = video.current ?? audio.current;
    if (!media || time === reported.current) return;
    reported.current = time;
    media.currentTime = time;
  }, [time, asset?.url]);
  useLayoutEffect(() => {
    playRequest.current = null;
    if (!blocked) return;
    video.current?.pause();
    audio.current?.pause();
  }, [blocked, asset?.url]);
  const reportPlaybackFailure = (request: symbol, error: unknown) => {
    if (
      playRequest.current !== request ||
      (error instanceof DOMException && error.name === 'AbortError')
    )
      return;
    setPreview((p) => ({
      ...p,
      error: 'Source playback failed. Try a supported codec.',
    }));
  };
  if (asset?.url !== sourceUrl) {
    setSourceUrl(asset?.url);
    setRange({ start: 0, end: sourceRangeEnd(asset) });
    setChoice(defaultTrack(tracks, asset?.kind));
    setPreview({ playing: false, error: '' });
  }
  return (
    <section className="source-panel">
      <div className="monitor-title">
        <span>Source</span>
        {asset?.kind === 'audio' && <span className="muted-text">AUDIO</span>}
      </div>
      <div className="source-preview">
        {asset?.kind === 'video' ? (
          <>
            <video
              ref={video}
              key={asset.id}
              src={asset.url}
              poster={asset.thumbnail}
              preload="auto"
              onPlay={() => setPreview((p) => ({ ...p, playing: true }))}
              onPause={() => setPreview((p) => ({ ...p, playing: false }))}
              onTimeUpdate={(e) => played(e.currentTarget.currentTime)}
            />
            <div className="source-controls">
              <IconButton
                label={preview.playing ? 'Pause source' : 'Play source'}
                onClick={() => {
                  const current = video.current;
                  if (!current || blocked) return;
                  if (current.paused) {
                    const request = Symbol();
                    playRequest.current = request;
                    setPreview((p) => ({ ...p, error: '' }));
                    void current
                      .play()
                      .catch((error: unknown) => reportPlaybackFailure(request, error));
                  } else {
                    playRequest.current = null;
                    current.pause();
                  }
                }}
              >
                {preview.playing ? <Pause size={13} /> : <Play size={13} />}
              </IconButton>
              <SourceBar duration={asset.duration} time={time} range={range} onTime={onTime} />
              <span data-testid="source-position">{clock(Math.round(time * FPS))}</span>
            </div>
            {preview.error && (
              <span className="source-error" role="status">
                {preview.error}
              </span>
            )}
          </>
        ) : asset?.kind === 'image' ? (
          <img src={asset.url} alt={asset.name} />
        ) : asset ? (
          <div className="source-audio">
            <Waveform peaks={asset.peaks} />
            <audio
              ref={audio}
              src={asset.url}
              controls
              onTimeUpdate={(e) => played(e.currentTarget.currentTime)}
            />
            <SourceBar duration={asset.duration} range={range} />
            <span className="source-position" data-testid="source-position">
              {clock(Math.round(time * FPS))}
            </span>
          </div>
        ) : (
          <span className="empty-preview">Import video, audio or a PNG, JPEG or WebP image</span>
        )}
      </div>
      <div className="source-description">
        <span title={asset?.name}>{asset?.name ?? 'No source selected'}</span>
        <span>
          {asset?.kind === 'image' ? 'Still image' : asset ? timecode(asset.duration) : '00:00:00'}
        </span>
      </div>
      {asset?.kind === 'image' ? (
        <StillDuration
          key={asset.url}
          frames={range.end}
          label="Still duration seconds"
          onCommit={(duration) => {
            setRange({ start: 0, end: duration });
            return null;
          }}
        />
      ) : (
        <div className="source-range source-marks">
          <button
            type="button"
            className="text-button"
            disabled={!asset}
            onClick={() => setRange(markIn(range, Math.round(time * FPS)))}
          >
            Set in
          </button>
          <output aria-label="Source in" aria-live="off">
            {seconds(range.start)} s
          </output>
          <button
            type="button"
            className="text-button"
            disabled={!asset}
            onClick={() => setRange(markOut(range, Math.round(time * FPS), asset?.duration ?? 0))}
          >
            Set out
          </button>
          <output aria-label="Source out" aria-live="off">
            {seconds(range.end)} s
          </output>
        </div>
      )}
      <div className="source-insert">
        <Choice
          label="Insert onto track"
          value={track}
          // No default fits, so name the gap instead of showing a track Insert would not use.
          options={[
            ...(track
              ? []
              : [{ value: '', label: `No ${asset?.kind === 'audio' ? 'audio' : 'video'} track` }]),
            ...targets.map((t) => ({
              value: t.id,
              label: `${trackNumber(tracks, t.id)} · ${t.label}`,
            })),
          ]}
          onChange={setChoice}
        />
        <IconButton
          label="Insert source at playhead"
          disabled={!asset || !track || range.end <= range.start}
          onClick={() => onInsert(track, range.start, range.end - range.start)}
        >
          <Plus size={15} />
        </IconButton>
      </div>
      {transcript && <TranscriptPanel {...transcript} onSeek={onTime} />}
    </section>
  );
}

// Runs the clip key `key` names, once per press and not with Shift; false when it is not one.
function runClipKey(keys: Map<string, () => void>, event: KeyboardEvent, key: string): boolean {
  const run = keys.get(key);
  if (!run || event.repeat || event.shiftKey) return false;
  event.preventDefault();
  run();
  return true;
}

// Up steps back to the previous edit point and Down on to the next; Shift keeps its own meaning.
function editStep(event: KeyboardEvent, key: string): 1 | -1 | undefined {
  if (event.shiftKey) return undefined;
  return key === 'arrowup' ? -1 : key === 'arrowdown' ? 1 : undefined;
}

// An output rate as the Output FPS control and the export summary name it.
const fpsName = (fps: OutputFps) => (fps === 'auto' ? 'Auto' : `${fps} fps`);

// The composition layouts by stored mode; Side by side is stored as no mode.
const LAYOUTS = {
  side: { name: 'Side by side', detail: 'Landscape + portrait' },
  pip: { name: 'Picture in picture', detail: 'Camera inset over the screen' },
};

// What a clip's fit is called, and what its scale is a percent of.
const FITS = { contain: 'Fit', cover: 'Fill' };

// The selected visual clip's fit and scale. The slider is one gesture through change's grouping;
// the percent field commits on Enter or blur, and text that is not a number puts the scale back.
function ClipSize({
  clip,
  onSize,
}: {
  clip: Clip;
  onSize: (sizing: Pick<Clip, 'fit' | 'scale'>) => void;
}) {
  const percent = Math.round((clip.scale ?? 1) * 100);
  const [draft, setDraft] = useState(String(percent));
  const [previous, setPrevious] = useState(percent);
  if (previous !== percent) {
    setPrevious(percent);
    setDraft(String(percent));
  }
  const fit = clip.fit ?? 'cover';
  return (
    <div className="inspector-section" role="group" aria-label="Clip size">
      <h3>Clip size</h3>
      <label className="slider-label">
        Sizing
        <Choice
          label="Clip fit"
          value={fit}
          options={[
            { value: 'contain', label: FITS.contain },
            { value: 'cover', label: `${FITS.cover} (crop)` },
          ]}
          onChange={(next) => onSize({ fit: next })}
        />
      </label>
      <label className="slider-label">
        Scale{' '}
        <output>
          {percent}% of {FITS[fit]}
        </output>
        <input
          aria-label="Clip scale"
          type="range"
          min={SCALE_LIMITS.min * 100}
          max={SCALE_LIMITS.max * 100}
          value={percent}
          onChange={(e) => onSize({ scale: Number(e.target.value) / 100 })}
        />
      </label>
      <div className="crop-controls">
        <span>Scale (%)</span>
        <input
          aria-label="Clip scale percent"
          type="number"
          min={SCALE_LIMITS.min * 100}
          max={SCALE_LIMITS.max * 100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          onBlur={() => {
            const scale = scaleFromText(draft);
            if (scale !== undefined && Math.round(scale * 100) !== percent) onSize({ scale });
            setDraft(String(percent));
          }}
        />
      </div>
    </div>
  );
}

// The layout choice, and in Side by side the side swap; PiP keeps swapped but never applies it.
function LayoutChoice({
  layout,
  onLayout,
}: {
  layout: Layout;
  onLayout: (layout: Layout) => void;
}) {
  const mode = layout.mode ?? 'side';
  return (
    <>
      <label className="slider-label choice-row">
        Layout
        <Choice
          label="Composition layout"
          steady
          align="end"
          value={mode}
          options={(['side', 'pip'] as const).map((value) => ({
            value,
            label: LAYOUTS[value].name,
          }))}
          onChange={(next) => onLayout({ ...layout, mode: next === 'pip' ? 'pip' : undefined })}
        />
      </label>
      {mode === 'side' && (
        <button
          type="button"
          className="layout-swatch"
          aria-label="Composition: swap sides"
          title="Swap screen and portrait sides"
          onClick={() => onLayout({ ...layout, swapped: !layout.swapped })}
          style={{ flexDirection: layout.swapped ? 'row-reverse' : 'row' }}
        >
          <span />
          <span />
        </button>
      )}
    </>
  );
}

// Bounds of the 0 to 100 percent fields, which a label drag stays inside.
const PERCENT = { min: 0, max: 100, step: 1 };

/** Editing controls for a selected zoom and the two composition masks. */
export function Inspector({
  zoom,
  layout,
  onLayout,
  onZoom,
  onRemoveZoom,
  onAddZoom,
  duration,
  onScrubStart,
  onScrubEnd,
  background,
  children,
}: {
  zoom?: Zoom;
  layout: Layout;
  onLayout: (layout: Layout) => void;
  onZoom: (zoom: Zoom) => void;
  onRemoveZoom: () => void;
  onAddZoom: () => void;
  duration: number;
  /** A label drag starts and ends: its edits apply live and the app records them as one undo step. */
  onScrubStart?: () => void;
  onScrubEnd?: (canceled: boolean) => void;
  /** The background image control, shown under the backdrop colours. */
  background?: ReactNode;
  children?: ReactNode;
}) {
  // Props that make a field's label draggable, from the field's value, bounds and setter.
  const drag = (value: number, range: StepRange, onScrub: (value: number) => void) =>
    scrub({ ...range, value, onScrub, onStart: onScrubStart, onEnd: onScrubEnd });
  return (
    <aside id="inspector-pane" className="inspector">
      <div className="section-title">
        <span>Inspector</span>
        <Crop size={15} />
      </div>
      {children}
      <div className="inspector-heading">
        <span className="mini-icon">
          <Clapperboard size={17} />
        </span>
        <div>
          <strong>{LAYOUTS[layout.mode ?? 'side'].name}</strong>
          <small>{LAYOUTS[layout.mode ?? 'side'].detail}</small>
        </div>
        <Check size={14} />
      </div>
      <div className="inspector-section">
        <h3>
          Composition <span>16:9</span>
        </h3>
        <LayoutChoice layout={layout} onLayout={onLayout} />
        <label
          className="slider-label"
          {...drag(layout.radius, { min: 0, max: 60, step: 1 }, (radius) =>
            onLayout({ ...layout, radius }),
          )}
        >
          Corner radius <output>{layout.radius}px</output>
          <input
            aria-label="Corner radius"
            type="range"
            min="0"
            max="60"
            value={layout.radius}
            onChange={(e) => onLayout({ ...layout, radius: Number(e.target.value) })}
          />
        </label>
        <BackdropControls layout={layout} onLayout={onLayout} />
        {background}
        <h3>Crop & framing</h3>
        {(['screen', 'camera'] as const).map((track) => (
          <div key={track} className="crop-controls">
            <span>{track === 'screen' ? 'Landscape' : 'Talking head'}</span>
            <label
              {...drag(layout[`${track}X`], PERCENT, (value) =>
                onLayout({ ...layout, [`${track}X`]: value }),
              )}
            >
              X
              <input
                aria-label={`${track} horizontal crop`}
                type="number"
                min="0"
                max="100"
                value={layout[`${track}X`]}
                onChange={(e) =>
                  onLayout({
                    ...layout,
                    [`${track}X`]: Math.max(0, Math.min(100, Number(e.target.value))),
                  })
                }
              />
            </label>
            <label
              {...drag(layout[`${track}Y`], PERCENT, (value) =>
                onLayout({ ...layout, [`${track}Y`]: value }),
              )}
            >
              Y
              <input
                aria-label={`${track} vertical crop`}
                type="number"
                min="0"
                max="100"
                value={layout[`${track}Y`]}
                onChange={(e) =>
                  onLayout({
                    ...layout,
                    [`${track}Y`]: Math.max(0, Math.min(100, Number(e.target.value))),
                  })
                }
              />
            </label>
          </div>
        ))}
      </div>
      <div className="inspector-section">
        <h3>
          <span className="zoom-heading">
            <ZoomIn size={14} /> Animated zoom
          </span>
          <span className="tag">SCREEN</span>
        </h3>
        {zoom ? (
          <>
            <p className="inspector-copy">
              Press and drag on the screen video to mark the mouse focus. Editing a generated shot
              makes it manual.
            </p>
            <ZoomMotionControls zoom={zoom} onChange={onZoom} />
            <label
              className="slider-label"
              {...drag(
                zoom.scale,
                { min: ZOOM_LIMITS.minScale, max: ZOOM_LIMITS.maxScale, step: 0.1 },
                (scale) => onZoom({ ...zoom, scale }),
              )}
            >
              Zoom level <output>{zoom.scale.toFixed(1)}×</output>
              <input
                aria-label="Zoom level"
                type="range"
                min={ZOOM_LIMITS.minScale}
                max={ZOOM_LIMITS.maxScale}
                step="0.1"
                value={zoom.scale}
                onChange={(e) => onZoom({ ...zoom, scale: Number(e.target.value) })}
              />
            </label>
            <div className="numeric-pair">
              <label
                {...drag(
                  Number((zoom.start / FPS).toFixed(2)),
                  { min: 0, max: (duration - zoom.duration) / FPS, step: 0.1 },
                  (seconds) => onZoom({ ...zoom, start: Math.round(seconds * FPS) }),
                )}
              >
                Start (s)
                <input
                  aria-label="Zoom start seconds"
                  type="number"
                  min="0"
                  max={(duration - zoom.duration) / FPS}
                  step="0.1"
                  value={Number((zoom.start / FPS).toFixed(2))}
                  onChange={(e) =>
                    onZoom({
                      ...zoom,
                      start: Math.max(
                        0,
                        Math.min(
                          duration - zoom.duration,
                          Math.round(Number(e.target.value) * FPS),
                        ),
                      ),
                    })
                  }
                />
              </label>
              <label
                {...drag(
                  Number((zoom.duration / FPS).toFixed(2)),
                  {
                    min: ZOOM_LIMITS.minFrames / FPS,
                    max: (duration - zoom.start) / FPS,
                    step: 0.1,
                  },
                  (seconds) => onZoom({ ...zoom, duration: Math.round(seconds * FPS) }),
                )}
              >
                Length (s)
                <input
                  aria-label="Zoom duration seconds"
                  type="number"
                  min={ZOOM_LIMITS.minFrames / FPS}
                  max={(duration - zoom.start) / FPS}
                  step="0.1"
                  value={Number((zoom.duration / FPS).toFixed(2))}
                  onChange={(e) =>
                    onZoom({
                      ...zoom,
                      duration: Math.max(
                        ZOOM_LIMITS.minFrames,
                        Math.min(duration - zoom.start, Math.round(Number(e.target.value) * FPS)),
                      ),
                    })
                  }
                />
              </label>
            </div>
            <div className="numeric-pair">
              <label {...drag(zoom.x, PERCENT, (x) => onZoom({ ...zoom, x }))}>
                Focus X (%)
                <input
                  aria-label="Zoom focus X"
                  type="number"
                  min="0"
                  max="100"
                  value={zoom.x}
                  onChange={(e) =>
                    onZoom({ ...zoom, x: Math.max(0, Math.min(100, Number(e.target.value))) })
                  }
                />
              </label>
              <label {...drag(zoom.y, PERCENT, (y) => onZoom({ ...zoom, y }))}>
                Focus Y (%)
                <input
                  aria-label="Zoom focus Y"
                  type="number"
                  min="0"
                  max="100"
                  value={zoom.y}
                  onChange={(e) =>
                    onZoom({ ...zoom, y: Math.max(0, Math.min(100, Number(e.target.value))) })
                  }
                />
              </label>
            </div>
            <button className="text-button danger" onClick={onRemoveZoom}>
              <Trash2 size={13} /> Remove zoom
            </button>
          </>
        ) : (
          <>
            <p className="inspector-copy">
              Guide the eye to what matters. Add a zoom, then choose its timing and focus.
            </p>
            <button className="secondary-button" onClick={onAddZoom}>
              <Plus size={14} /> Add zoom at playhead
            </button>
          </>
        )}
      </div>
      <div className="inspector-tip">
        <span className="tip-marker">i</span>
        <p>Zooms ease in, hold your focus, then return to the full frame.</p>
      </div>
    </aside>
  );
}

// An agent's cut, as the Razor makes it; → the new clips, or null at an edge or a gap.
function agentCut(clips: Clip[], id: string, at: number): Clip[] | null {
  const next = splitClip(clips, id, at);
  return next.length === clips.length ? null : next;
}

// An agent's trim, as [ and ] make it; → the new clips, or null when it would not shorten the clip.
function agentTrim(clips: Clip[], target: Clip, action: 'trimStart' | 'trimEnd', at: number) {
  const next = trimTo(target, action === 'trimStart' ? 'left' : 'right', at);
  return next && overwrite(clips, next, (c) => c.track === next.track, 1, clipPiece);
}

/** @throws when this browser cannot write an image to the clipboard. */
function assertImageClipboard(): void {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined')
    throw new Error('This browser cannot copy images to the clipboard.');
}

/** Local-first video editing workspace. The Remotion player is the single forward playback clock. */
export function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busy, setBusy] = useState(true);
  const [sourceId, setSourceId] = useState('landscape');
  // The source preview's position, kept with the source it belongs to so a new one starts at 0.
  const [sourceSeek, setSourceSeek] = useState({ url: '', time: 0 });
  // The pool item a pointer is dragging, for lanes to preview; drops read the drag's own data.
  const [dragAsset, setDragAsset] = useState<string | null>(null);
  const [edit, setEdit] = useState<Edit>(INITIAL_EDIT);
  const [history, setHistory] = useState<Edit[]>([]);
  const [assistantOpen, setAssistantOpen] = useState(false);
  // The edit the last Save wrote, compared by identity: undoing back to it is saved again.
  const [savedEdit, setSavedEdit] = useState<Edit | null>(null);
  const [selected, setSelected] = useState('s1');
  const [frame, setFrame] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [muted, setMuted] = useState<Track[]>([]);
  // Mutes, locks and Split's track targets are saved with the project but are never undo steps.
  const [locked, setLocked] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  // Saved with the project like the track toggles, outside undo. Resolution is not saved.
  const [outputFps, setOutputFps] = useState<OutputFps>('auto');
  const [savedTracks, setSavedTracks] = useState({ muted, locked, selectedTracks, outputFps });
  // Transcripts live on assets, outside the edit history, so saving records which ones it held.
  const [savedTranscripts, setSavedTranscripts] = useState<Asset['transcript'][]>([]);
  const [tool, setTool] = useState<'select' | 'razor'>('select');
  const [message, setMessage] = useState('Ready for your next story.');
  const [help, setHelp] = useState(false);
  // The mouse focus being dragged on the screen video, committed to its zoom on release.
  const [mark, setMark] = useState<{ id: string; x: number; y: number } | null>(null);
  const [exportWidth, setExportWidth] = useState<1920 | 3840>(1920);
  const [previewQuality, setPreviewQuality] = useState(savedPreviewQuality);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'mov' | 'webm'>('mp4');
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  // A finished render waits for the user's own click to download: Chrome blocks and Safari asks
  // about a download that code starts long after the click that began the render.
  // It stays after Save, since a cancelled save dialog or a download prompt still needs the file.
  const [readyVideo, setReadyVideo] = useState<{
    url: string;
    name: string;
    size: number;
    saved: boolean;
  } | null>(null);
  const saveVideo = useRef<HTMLAnchorElement>(null);
  const exportButton = useRef<HTMLButtonElement>(null);
  const sourceBlocked = busy || exportProgress !== null;
  const {
    mode: mediaMode,
    instant: mediaInstant,
    panel: mediaPanel,
    toggle: mediaToggle,
    onToggle: toggleMedia,
  } = useMediaDrawer(busy || help || exportProgress !== null);
  const {
    workspace: workspacePanel,
    open: timelineOpen,
    compact: compactPanels,
    handle: resizeHandle,
    toggleOpen: toggleTimeline,
    custom: customHeight,
    hasCustom: hasCustomHeight,
    toggleHeight: toggleTimelineHeight,
  } = usePanelLayout(mediaMode === 'pinned', busy || help || exportProgress !== null);
  const [copying, setCopying] = useState(false);
  const exportAbort = useRef<AbortController | null>(null);
  const exportDialog = useRef<HTMLDialogElement>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const player = useRef<PlayerRef>(null);
  const assetsRef = useRef<Asset[]>([]);
  const frameRef = useRef(0);
  const rewinding = useRef(false);
  const duration = Math.max(1, ...edit.clips.map((c) => c.start + c.duration));
  const asset = assets.find((a) => a.id === sourceId);
  const sourceTime = sourceSeek.url === asset?.url ? sourceSeek.time : 0;
  const seekSource = useCallback(
    (time: number) => setSourceSeek({ url: asset?.url ?? '', time }),
    [asset?.url],
  );
  const transcription = useTranscription(asset, setAssets, setMessage);
  const dragging = assets.find((a) => a.id === dragAsset);
  const selectedZoom = edit.zooms.find((z) => z.id === selected);
  const background = backgroundImage(
    edit.tracks,
    edit.clips,
    (id) => assets.find((a) => a.id === id)?.kind === 'image',
  );
  const markingMouse = mark !== null;
  const gainEdit = (db: number): Edit => ({
    ...edit,
    clips: edit.clips.map((c) => (c.id === selected ? setGain(c, db) : c)),
  });
  // A press on the screen video marks the selected zoom, else the one under the playhead.
  const markZoom =
    selectedZoom ?? edit.zooms.find((z) => frame >= z.start && frame < z.start + z.duration);
  const screenMask = maskRect('screen', edit.layout); // → stage rect the mouse target covers
  const selectedClip = edit.clips.find((c) => c.id === selected);
  // Chapters past the end of the sequence stay in the file but are neither drawn nor listed.
  const chapters = shownChapters(edit.chapters ?? [], duration);
  // Gain applies where audio plays: a clip on an audio track whose source has sound.
  const gainable =
    edit.tracks.find((t) => t.id === selectedClip?.track)?.kind === 'audio' &&
    !!assets.find((a) => a.id === selectedClip?.assetId)?.hasAudio;
  const selectedVisual = edit.tracks.find((t) => t.id === selectedClip?.track)?.kind === 'visual';
  const selectedChapter = chapters.find((chapter) => chapterId(chapter) === selected);
  const cursorAsset = selectedClip
    ? screenTracks(edit.tracks).includes(selectedClip.track)
      ? assets.find((source) => source.id === selectedClip.assetId)
      : undefined
    : selectedZoom
      ? undefined
      : asset;
  useEffect(() => {
    if (!markingMouse) return;
    const cancel = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setMark(null);
    };
    window.addEventListener('keydown', cancel);
    return () => window.removeEventListener('keydown', cancel);
  }, [markingMouse]);
  const compositionProps = useMemo(
    () => ({ ...edit, zooms: markingMouse ? [] : edit.zooms, assets, muted }),
    [edit, assets, muted, markingMouse],
  );

  useEffect(() => {
    if (help) helpDialog.current?.showModal();
    else helpDialog.current?.close();
  }, [help]);

  useEffect(() => {
    let cancelled = false;
    loadDemo()
      .then((demo) => {
        if (cancelled) {
          demo.forEach((a) => URL.revokeObjectURL(a.url));
          return;
        }
        setAssets(demo);
        setBusy(false);
      })
      .catch((error) => {
        if (!cancelled) {
          setMessage(`Demo unavailable. ${error.message}`);
          setBusy(false);
          setEdit({ ...INITIAL_EDIT, clips: [] });
        }
      });
    return () => {
      cancelled = true;
      assetsRef.current.forEach((a) => URL.revokeObjectURL(a.url));
    };
  }, []);
  // What an import started now works on, read when it runs: the memoized library holds one
  // importFiles for many edits.
  const editRef = useRef(edit);
  useEffect(() => {
    assetsRef.current = assets;
    editRef.current = edit;
  }, [assets, edit]);

  // Assets the Background image control imported, so only those are released when nothing uses them.
  const backgroundOwned = useRef(new Set<string>());
  // The undo step still open: a drag or a held key folds into it instead of adding steps.
  const gesture = useRef<Gesture | null>(null);
  // Returns false when a lock refused the edit, so callers report nothing else. Locks guard new
  // clip edits only, so zoom and layout edits always succeed: undo, open and demo loading
  // replace the edit without passing through here.
  const change = useCallback(
    (proposed: Edit, discrete = false): boolean => {
      const refused = lockedChange(edit.clips, proposed.clips, locked); // → Track | undefined
      if (refused) {
        setMessage(`${labelOf(edit.tracks, refused)} is locked.`);
        return false;
      }
      const step = classifyChange(edit, proposed, gesture.current, performance.now(), discrete); // → HistoryStep
      if (step.kind === 'none') return true;
      gesture.current = step.gesture;
      if (step.kind === 'push') setHistory((previous) => [...previous.slice(-49), edit]);
      setEdit(proposed);
      return true;
    },
    [edit, locked],
  );
  // A label drag edits live from the edit it started on: no history until it ends, then one step,
  // or the start edit back when it is cancelled. `latest` is the last edit it made.
  const scrubbing = useRef<{ from: Edit; latest: Edit } | null>(null);
  const scrubStart = () => (scrubbing.current = { from: edit, latest: edit });
  const scrubEnd = (canceled: boolean) => {
    const drag = scrubbing.current;
    scrubbing.current = null;
    if (!drag) return;
    if (canceled) return setEdit(drag.from);
    if (classifyChange(drag.from, drag.latest, null, 0).kind === 'none') return;
    gesture.current = null;
    setHistory((previous) => [...previous.slice(-49), drag.from]);
  };
  // Inspector edits go live during a drag and through history otherwise.
  const inspect = (proposed: Edit) => {
    const drag = scrubbing.current;
    if (!drag) return change(proposed);
    drag.latest = proposed;
    setEdit(proposed);
  };
  // The Clip gain label drags like the layout fields, except on a locked lane: a drag edits live,
  // past the lock that change() enforces.
  const gainScrub =
    selectedClip && !locked.includes(selectedClip.track)
      ? { onScrub: (db: number) => inspect(gainEdit(db)), onStart: scrubStart, onEnd: scrubEnd }
      : undefined;
  // ponytail: history keeps 50 steps, so undoing all of a longer session reads as saved.
  // Add a saved marker to the edit itself if that ever costs someone work.
  const unsaved =
    (history.length > 0 && edit !== savedEdit) ||
    !sameTracks(muted, savedTracks.muted) ||
    !sameTracks(locked, savedTracks.locked) ||
    !sameTracks(selectedTracks, savedTracks.selectedTracks) ||
    outputFps !== savedTracks.outputFps ||
    assets.some((a) => a.transcript && !savedTranscripts.includes(a.transcript)) ||
    transcription.running;
  const working = unsaved || exportProgress !== null || (readyVideo !== null && !readyVideo.saved);
  const readyUrl = readyVideo?.url;
  useEffect(() => {
    if (!readyUrl) return;
    saveVideo.current?.focus();
    // Released only on Discard, a new export or unmount, a task later than the bar closing.
    return () => void setTimeout(() => URL.revokeObjectURL(readyUrl), 0);
  }, [readyUrl]);
  useEffect(() => {
    if (!working) return;
    // The browser shows its own "leave site?" prompt; the text cannot be customised.
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [working]);
  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (previous) {
      setEdit(previous);
      setHistory(history.slice(0, -1));
      setMessage('Undid last edit.');
    }
  }, [history]);
  // A paused seek sounds a short slice of the mix, so edit points can be found by ear. Seeks that
  // playback follows at once (L or Play at the end) or that no gesture drives (reopening a
  // project) pass sound: false - a 90 ms chirp there would read as a bug.
  const seek = useCallback(
    (next: number, sound = true) => {
      const target = Math.max(0, Math.min(duration - 1, Math.round(next)));
      setSpeed(0);
      player.current?.pause();
      player.current?.seekTo(target);
      frameRef.current = target;
      setFrame(target);
      if (sound)
        playSlices(
          mixAt(target, editRef.current.clips, editRef.current.tracks, muted, assetsRef.current),
        );
    },
    [duration, muted],
  );
  // Cut every unlocked clip `target` accepts at the playhead as one undo step; none is no step.
  const cutAt = useCallback(
    (target: (clip: Clip) => boolean) => {
      const next = splitWhere(
        edit.clips,
        frameRef.current,
        (c) => !locked.includes(c.track) && target(c),
      );
      if (next === edit.clips) {
        setMessage('No unlocked clip crosses the playhead there. Nothing was split.');
        return;
      }
      const cuts = next.length - edit.clips.length;
      if (change({ ...edit, clips: next }))
        setMessage(`Split ${cuts} clip${cuts === 1 ? '' : 's'}. Source timing preserved.`);
    },
    [edit, locked, change],
  );
  const split = useCallback(
    () => cutAt((c) => c.id === selected || selectedTracks.includes(c.track)),
    [cutAt, selected, selectedTracks],
  );
  const splitAll = useCallback(() => cutAt(() => true), [cutAt]);
  // Hovering a cuttable frame seeks the real playhead there; it is no edit, and playback is not fought.
  const razorHover = useCallback(
    (at: number) => {
      if (speed === 0 && at !== frameRef.current) seek(at);
    },
    [speed, seek],
  );
  const razor = useCallback(
    (id: string, at: number) => {
      const next = splitClip(edit.clips, id, at);
      if (next.length === edit.clips.length) return; // a clip edge or a gap is no cut
      if (!change({ ...edit, clips: next })) return;
      setMessage('Razor cut. Source timing preserved.');
      seek(at); // the playhead stays on the cut frame
    },
    [edit, change, seek],
  );
  // One command for pool drops and keyboard placement. It reads the source and the edit as they
  // are at release, and a lock refuses it through change().
  const place = useCallback(
    (assetId: string, target: DropTarget, at: number) => {
      const source = assets.find((a) => a.id === assetId);
      if (!source) return;
      const result = placeMedia(edit.tracks, edit.clips, placed(source), target, at);
      if ('refused' in result) {
        setMessage(`${result.refused} Nothing was placed.`);
        return;
      }
      if (!change({ ...edit, tracks: result.tracks, clips: result.clips })) return;
      setSelected(result.clip.id);
      setMessage(
        `Placed ${source.name} on ${labelOf(result.tracks, result.clip.track)} at ` +
          `${(result.clip.start / FPS).toFixed(1)} seconds.`,
      );
    },
    [assets, edit, change],
  );
  // A trimmed or moved clip, released: it overwrites what it lands on as one undo step. A key
  // command passes `discrete`, so it never folds into an edit made within the same 800 ms.
  const putClip = useCallback(
    (clip: Clip, discrete = false) => {
      setSpeed(0);
      change(
        {
          ...edit,
          clips: overwrite(edit.clips, clip, (c) => c.track === clip.track, 1, clipPiece),
        },
        discrete,
      );
    },
    [edit, change],
  );
  // Chapters are one undo step per change; none left means the edit carries no list at all.
  const setChapters = useCallback(
    (next: Chapter[]) => change({ ...edit, chapters: next.length ? next : undefined }),
    [edit, change],
  );
  const markChapter = useCallback(() => {
    const at = frameRef.current;
    const next = addChapter(edit.chapters ?? [], at);
    if (!next) return setMessage('A chapter already sits at this frame.');
    if (setChapters(next)) {
      setSelected(chapterId({ frame: at, title: '' }));
      setMessage(`Chapter added at ${timecode(at)}.`);
    }
  }, [edit, setChapters]);
  // X selects the clip under the playhead; [ and ] trim the selected clip's start or end to it.
  const selectUnder = useCallback(() => {
    const clip = clipAt(edit.clips, edit.tracks, selectedTracks, frameRef.current);
    if (clip) setSelected(clip.id);
  }, [edit, selectedTracks]);
  const trimSelected = useCallback(
    (side: 'left' | 'right') => {
      const next = selectedClip && trimTo(selectedClip, side, frameRef.current);
      if (next) putClip(next, true);
    },
    [selectedClip, putClip],
  );
  // An agent's trim or cut (CLIP-49): the [ ] and Razor model functions, one discrete undo step
  // each, so two agent edits in a row never fold into one. False when nothing changed.
  const agentEdit = useCallback(
    (id: string, action: 'trimStart' | 'trimEnd' | 'split', at: number) => {
      const target = edit.clips.find((c) => c.id === id && !locked.includes(c.track));
      if (!target) return false;
      const clips =
        action === 'split'
          ? agentCut(edit.clips, id, at)
          : agentTrim(edit.clips, target, action, at);
      if (!clips) return false;
      setSpeed(0);
      return change({ ...edit, clips }, true);
    },
    [edit, locked, change],
  );
  // Up and Down step the playhead to the previous and next edit point.
  const jumpEdit = useCallback(
    (step: 1 | -1) => {
      const to = editPoint(edit.clips, locked, duration, frameRef.current, step);
      if (to !== undefined) seek(to);
    },
    [edit.clips, locked, duration, seek],
  );
  const copyChapters = useCallback(() => {
    navigator.clipboard.writeText(chapterList(edit.chapters ?? [], duration)).then(
      () => setMessage(`Copied ${chapters.length} chapter${chapters.length === 1 ? '' : 's'}.`),
      () => setMessage('Could not copy chapters. The browser refused clipboard access.'),
    );
  }, [edit, duration, chapters.length]);
  const removeMarked = useCallback(() => {
    if (selectedChapter) setChapters(removeChapter(edit.chapters ?? [], selectedChapter.frame));
  }, [edit, selectedChapter, setChapters]);
  // Releases a background image this control imported once no edit, current or in history, uses it:
  // dropped from the library, its object URL revoked after React has swapped it out. A source the
  // user imported themselves is never in the set, so it stays.
  useEffect(() => {
    const edits = [edit, ...history];
    const gone = assets.filter(
      (a) => backgroundOwned.current.has(a.id) && !isReferenced(a.id, edits),
    );
    if (!gone.length) return;
    gone.forEach((a) => backgroundOwned.current.delete(a.id));
    const ids = new Set(gone.map((a) => a.id));
    setAssets((previous) => previous.filter((a) => !ids.has(a.id)));
    setSourceId((current) =>
      ids.has(current) ? (assets.find((a) => !ids.has(a.id))?.id ?? '') : current,
    );
    setTimeout(() => gone.forEach((a) => URL.revokeObjectURL(a.url)), 0);
  }, [assets, edit, history]);
  // Choose or replace the background image: read the file first, so a corrupt one changes nothing.
  const chooseBackground = async (file: File) => {
    setBusy(true);
    try {
      const imported = await readBackgroundImage(file);
      const next = setBackgroundImage(edit.tracks, edit.clips, background, imported.id, duration);
      if (!change({ ...edit, ...next })) {
        URL.revokeObjectURL(imported.url);
        return;
      }
      backgroundOwned.current.add(imported.id);
      setAssets((previous) => [...previous, imported]);
      setMessage(`Background image ${imported.name} set.`);
    } catch (error) {
      setMessage(
        `Could not use ${file.name}. ${error instanceof Error ? error.message : 'Unsupported file.'}`,
      );
    } finally {
      setBusy(false);
    }
  };
  const removeBackground = () => {
    if (background.kind !== 'image') return;
    const next = { ...edit, clips: removeBackgroundImage(edit.clips, background.clip) };
    if (!change(next)) return;
    setMessage('Background image removed.');
  };
  const removeSelected = useCallback(() => {
    if (selectedZoom) change({ ...edit, zooms: edit.zooms.filter((z) => z.id !== selected) });
    else if (selectedClip) change({ ...edit, clips: edit.clips.filter((c) => c.id !== selected) });
    else removeMarked();
  }, [edit, selected, selectedZoom, selectedClip, change, removeMarked]);

  const hasAssets = assets.length > 0;
  useEffect(() => {
    const ref = player.current;
    if (!ref) return;
    let lastPaint = 0;
    const update = ({ detail }: { detail: { frame: number } }) => {
      // Rewind owns its seek clock; delayed player events must not move it backwards or forwards.
      if (rewinding.current) return;
      frameRef.current = detail.frame;
      const now = performance.now();
      if (!ref.isPlaying() || now - lastPaint >= 100) {
        setFrame(detail.frame);
        lastPaint = now;
      }
    };
    const ended = () => setSpeed(0);
    // Painting is throttled while playing, so a pause shows the frame the player really holds.
    const paused = () => setFrame(frameRef.current);
    ref.addEventListener('frameupdate', update);
    ref.addEventListener('ended', ended);
    ref.addEventListener('pause', paused);
    return () => {
      ref.removeEventListener('frameupdate', update);
      ref.removeEventListener('ended', ended);
      ref.removeEventListener('pause', paused);
    };
  }, [hasAssets]);
  // Flush the last rewind seek before a paused or changed-speed readout can paint.
  useLayoutEffect(() => {
    rewinding.current = speed < 0;
    // Shuttle or rewind owns the transport's sound; no scrub slice may ring over it.
    if (speed !== 0) stopSlices();
    if (speed > 0) {
      player.current?.play();
      return;
    }
    player.current?.pause();
    if (speed === 0) return;
    // Undo can shorten the timeline while the player has already clamped its held media.
    frameRef.current = Math.min(frameRef.current, duration - 1);
    setFrame(frameRef.current);
    // Browsers cannot play media backwards. Rewind seeks video silently at 30fps.
    let last = performance.now();
    let lastPaint = last;
    let remainder = 0;
    let animation: number;
    const tick = (now: number) => {
      // A queued rAF timestamp can precede the layout effect that started this clock.
      remainder += (Math.max(0, now - last) / 1000) * FPS * Math.abs(speed);
      last = now;
      const steps = Math.floor(remainder);
      remainder -= steps;
      if (steps) {
        const target = Math.max(0, frameRef.current - steps);
        frameRef.current = target;
        player.current?.seekTo(target);
        if (now - lastPaint >= 100) {
          setFrame(target);
          lastPaint = now;
        }
        if (!target) {
          setSpeed(0);
          return;
        }
      }
      animation = requestAnimationFrame(tick);
    };
    const visibilitychange = () => {
      if (document.hidden) setSpeed(0);
    };
    document.addEventListener('visibilitychange', visibilitychange);
    animation = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener('visibilitychange', visibilitychange);
      cancelAnimationFrame(animation);
      rewinding.current = false;
      setFrame(frameRef.current);
    };
  }, [speed, duration]);

  const addZoom = useCallback(() => {
    const start = frameRef.current;
    const length = Math.min(4 * FPS, duration - start);
    if (length < ZOOM_LIMITS.minFrames) {
      setMessage('Move the playhead earlier to leave at least 0.2 seconds for a zoom.');
      return;
    }
    const zoom: Zoom = {
      id: crypto.randomUUID(),
      start,
      duration: length,
      scale: 1.8,
      x: 50,
      y: 50,
      follow: 'focused',
    };
    if (zoomsOverlap(edit.zooms, zoom)) {
      setMessage('Zooms cannot overlap. Choose another time or edit the existing zoom.');
      return;
    }
    change({ ...edit, zooms: [...edit.zooms, zoom] });
    setSelected(zoom.id);
    setMessage(
      length < 4 * FPS
        ? `Zoom shortened to ${Number((length / FPS).toFixed(2))} seconds at the sequence end. Adjust it in the inspector.`
        : '4-second zoom added at the playhead. Adjust its timing and focus in the inspector.',
    );
  }, [duration, edit, change]);

  // Delete follows the last panel the user pressed or focused, not document.activeElement, which
  // drops to the body whenever the app removes or disables the focused control.
  const inTimeline = useRef(false);
  const timelineZoom = useRef<((step: 1 | -1) => void) | null>(null);
  useEffect(() => {
    const track = (event: Event) => {
      inTimeline.current =
        event.target instanceof Element && !!event.target.closest('#sequence-pane');
    };
    // A pool drop lands in the timeline, so it hands Delete to the clip it selects.
    const events = ['pointerdown', 'focusin', 'drop'];
    for (const name of events) window.addEventListener(name, track, true);
    return () => {
      for (const name of events) window.removeEventListener(name, track, true);
    };
  }, []);

  useLayoutEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (help || busy || exportProgress !== null || markingMouse || exportDialog.current?.open)
        return;
      // A label drag owns the edit until it ends: a shortcut now would be overwritten by the next
      // move or leave a stray undo step. Escape still cancels it, through bindDrag.
      if (scrubbing.current) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const key = event.key.toLowerCase();
      // Checkboxes and menus keep their own keys but give Space to transport. Enter replaces
      // their Space action: it toggles a checkbox and opens a menu, whose arrow keys still work
      // where showPicker is unavailable. A slider keeps only its movement keys, so a scrubbed
      // playhead still takes every shortcut. Text and number entry keep every key.
      const slider = target instanceof HTMLInputElement && target.type === 'range';
      if (slider && (key === 'enter' || SLIDER_KEYS.includes(key))) return;
      // A file input gives only Space to transport, so it never opens the chooser; Enter and
      // clicks still do.
      const file = target instanceof HTMLInputElement && target.type === 'file';
      if (file && key !== ' ') return;
      // A menu keeps Enter, arrows and typing, and an open list keeps every key; Space still plays.
      if (target?.closest('[data-slot="select-content"]')) return;
      if (target?.closest('[data-slot="select-trigger"]') && key !== ' ') return;
      if (target instanceof HTMLInputElement && !slider && !file && target.type !== 'checkbox')
        return;
      if (target instanceof HTMLSelectElement || target instanceof HTMLInputElement) {
        if (key === 'enter' && target.type !== 'range') {
          event.preventDefault();
          if (target instanceof HTMLSelectElement) {
            try {
              target.showPicker();
            } catch {
              // Arrow keys still change a closed select.
            }
          } else if (!event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey) {
            // One toggle (and one undo step) per press, never per auto-repeat or browser chord.
            target.click();
          }
        }
        if (key !== ' ' && !slider) return;
      } else if (target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      // Physical K, so Option+K's dead key still matches; only the platform's one modifier.
      if (
        event.code === 'KeyK' &&
        !event.shiftKey &&
        !event.ctrlKey &&
        (MAC ? event.metaKey && !event.altKey : event.altKey && !event.metaKey)
      ) {
        event.preventDefault();
        if (!event.repeat) splitAll();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        // Chords belong to the browser. Undo is the only one the editor takes; there is no redo.
        if (key === 'z' && !event.altKey && !event.shiftKey) {
          event.preventDefault();
          undo();
        }
        return;
      }
      if (key === 'b') {
        if (event.repeat || event.shiftKey) return;
        event.preventDefault();
        addZoom();
        return;
      }
      const clipKeys = new Map([
        ['x', selectUnder],
        ['[', () => trimSelected('left')],
        [']', () => trimSelected('right')],
      ]);
      if (runClipKey(clipKeys, event, key)) return;
      // Like Delete, only once the timeline has been pressed or focused: a button elsewhere keeps
      // its panel's native scrolling.
      const step = editStep(event, key);
      if (step && inTimeline.current) {
        event.preventDefault();
        jumpEdit(step);
        return;
      }
      if (key === 'm') {
        if (event.repeat || event.shiftKey) return;
        event.preventDefault();
        markChapter();
        return;
      }
      // Display only: the scale changes how long the timeline looks, never a clip. Matched by the
      // typed character, so the keys follow the user's layout.
      if (key === '-' || key === '=') {
        event.preventDefault();
        timelineZoom.current?.(key === '=' ? 1 : -1);
        return;
      }
      // Deletion belongs to the timeline: after a press or focus anywhere else the keys are left alone.
      const deletion = key === 'delete' || key === 'backspace';
      if (deletion && !inTimeline.current) return;
      if (['j', 'k', 'l', ' ', 'arrowleft', 'arrowright', 'delete', 'backspace'].includes(key))
        event.preventDefault();
      if (key === 'j') setSpeed((s) => (s < 0 ? Math.max(-4, s * 2) : -1));
      if (key === 'k') setSpeed(0);
      if (key === 'l') {
        if (frameRef.current >= duration - 1) seek(0, false);
        setSpeed((s) => (s > 0 ? Math.min(4, s * 2) : 1));
      }
      if (key === ' ' && !event.repeat) setSpeed((s) => (s ? 0 : 1));
      if (key === 'arrowleft') seek(frameRef.current - 1);
      if (key === 'arrowright') seek(frameRef.current + 1);
      if (key === 'c' && !event.shiftKey) setTool('razor');
      if (key === 'v' && !event.shiftKey) setTool('select');
      if (deletion) removeSelected();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [
    duration,
    seek,
    splitAll,
    removeSelected,
    undo,
    help,
    busy,
    exportProgress,
    markingMouse,
    addZoom,
    markChapter,
    selectUnder,
    trimSelected,
    jumpEdit,
  ]);
  const importFiles = async (files: FileList) => {
    setBusy(true);
    const results: Imported[] = [];
    const failures: string[] = [];
    let library = assetsRef.current; // the library as it will be once the state updates below land
    for (const file of Array.from(files)) {
      try {
        const result = await importOne(file, library, editRef.current);
        library = placeAsset(library, result);
        setAssets((previous) => placeAsset(previous, result));
        setSourceId(result.imported.id);
        results.push(result);
      } catch (error) {
        failures.push(
          `Could not import ${file.name}. ${error instanceof Error ? error.message : 'Unsupported file.'}`,
        );
      }
    }
    const relinked = results.flatMap(({ replaces }) => (replaces ? [replaces] : [])); // → Asset[]
    // The old URLs go once React has swapped the new assets in.
    setTimeout(() => relinked.forEach((old) => URL.revokeObjectURL(old.url)), 0);
    // One message after the loop, so a success cannot overwrite the failures before them.
    const summary = importSummary(
      results.length - relinked.length,
      relinked.map((old) => old.name),
      [...failures, librarySizeWarning(library)],
    );
    if (summary) setMessage(summary);
    setBusy(false);
  };
  const insert = useCallback(
    (track: Track, offset: number, length: number) => {
      if (!asset) return;
      if (edit.tracks.some((t) => t.id === track && t.kind === 'audio') && !asset.hasAudio) {
        setMessage('This source has no audio. Choose a video track.');
        return;
      }
      const clip: Clip = {
        id: crypto.randomUUID(),
        assetId: asset.id,
        track,
        start: frameRef.current,
        duration: length,
        offset,
        ...initialSizing(edit.tracks.find((t) => t.id === track)!),
      };
      const next = { ...edit, clips: insertClip(edit.clips, clip, frameRef.current) };
      const failure = stillInsertionError(asset, next, assets);
      if (failure) {
        setMessage(failure);
        return;
      }
      if (!change(next)) return;
      setSelected(clip.id);
      setMessage(`Inserted ${asset.name} onto ${labelOf(edit.tracks, track)}.`);
    },
    [asset, assets, edit, change],
  );
  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const saveProject = async () => {
    setBusy(true);
    setSpeed(0);
    try {
      const tracks = { locked, selectedTracks, outputFps };
      const { file, omitted } = await serializeProject(edit, assets, muted, tracks);
      downloadBlob(file, 'developer-walkthrough.clipper.json');
      setSavedEdit(edit);
      setSavedTracks({ muted, ...tracks });
      setSavedTranscripts(assets.map((a) => a.transcript));
      // The next change starts a new step, so Undo can return to exactly what was saved.
      gesture.current = null;
      const done = omitted.length
        ? `Portable project saved. Left out unused media: ${omitted.join(', ')}. ` +
          'It could not be read or did not fit in the file.'
        : 'Portable project saved with source media included. No relinking needed.';
      announce(setMessage, done);
    } catch (error) {
      const text = `Could not save project. ${error instanceof Error ? error.message : 'Unknown error.'}`;
      announce(setMessage, text, true);
    } finally {
      setBusy(false);
    }
  };
  // Opening replaces the whole edit and its undo history, so unsaved work needs a yes first.
  const mayDiscard = () =>
    !unsaved || window.confirm('Open this project and discard your unsaved edits?');
  const openProject = async (file: File) => {
    // The new project replaces the sources, so a running transcription has nowhere to land.
    transcription.cancel();
    setBusy(true);
    setSpeed(0);
    const imported: Asset[] = [];
    try {
      const project = parseProject(await file.text());
      for (const media of project.media) {
        const response = await fetch(media.data);
        const read = await readMedia(await response.blob(), media.name, media.id, media.cursor);
        imported.push({ ...read, transcript: media.transcript });
        if ((imported[imported.length - 1].kind === 'image') !== (media.kind === 'image'))
          throw new Error(`Image kind does not match embedded media ${media.name}.`);
      }
      validateSources(project.edit, imported);
      const previous = assets;
      setAssets(imported);
      setEdit({
        ...project.edit,
        zooms: resolveZooms(
          project.edit.zooms,
          project.edit.clips,
          imported,
          project.edit.layout,
          project.edit.tracks,
        ),
      });
      setMuted(project.muted);
      setLocked(project.locked);
      setSelectedTracks(project.selectedTracks);
      setOutputFps(project.outputFps);
      setSavedTranscripts(imported.map((a) => a.transcript));
      setSavedTracks({
        muted: project.muted,
        locked: project.locked,
        selectedTracks: project.selectedTracks,
        outputFps: project.outputFps,
      });
      setHistory([]);
      setSelected(project.edit.clips[0]?.id ?? '');
      setSourceId(imported[0]?.id ?? '');
      seek(0, false);
      setTimeout(() => previous.forEach((a) => URL.revokeObjectURL(a.url)), 0);
      const done = 'Project reopened. Embedded media restored locally; no relinking or upload.';
      announce(setMessage, done);
    } catch (error) {
      imported.forEach((a) => URL.revokeObjectURL(a.url));
      const text = `Could not open project. ${error instanceof Error ? error.message : 'Invalid project.'}`;
      announce(setMessage, text, true);
    } finally {
      setBusy(false);
    }
  };
  const exportBasename = `developer-walkthrough-${exportWidth === 1920 ? '1080p' : '4k'}`;
  const exportVideo = async () => {
    setSpeed(0);
    setExportProgress(0);
    setReadyVideo(null);
    const controller = new AbortController();
    exportAbort.current = controller;
    let progress = 0;
    try {
      const { renderVideo } = await import('./export');
      const blob = await renderVideo({
        ...edit,
        assets,
        muted,
        width: exportWidth,
        format: exportFormat,
        fps: outputFps,
        onProgress: (value) => {
          const next = Math.round(value * 100) / 100;
          if (next === progress) return;
          progress = next;
          setExportProgress(next);
        },
        signal: controller.signal,
      });
      setReadyVideo({
        url: URL.createObjectURL(blob),
        name: `${exportBasename}.${blob.type.slice('video/'.length).replace('quicktime', 'mov')}`,
        size: blob.size,
        saved: false,
      });
      const done = `Video exported at ${exportWidth} × ${(exportWidth * 9) / 16}, ${fpsName(outputFps)}. Rendered locally.`;
      announce(setMessage, done);
    } catch (error) {
      if (controller.signal.aborted) setMessage('Export cancelled.');
      else {
        const text = `Export failed. ${error instanceof Error ? error.message : 'Unknown error.'}`;
        announce(setMessage, text, true);
      }
    } finally {
      setExportProgress(null);
      exportAbort.current = null;
    }
  };
  const copyFrame = async () => {
    // Not disabled while copying: a disabled button drops keyboard focus.
    if (copying) return;
    setSpeed(0);
    player.current?.pause();
    // Everything the image needs is captured now, so a later seek or edit cannot change it.
    const snapshot = {
      ...edit,
      assets,
      width: exportWidth,
      frame: Math.min(Math.max(0, frameRef.current), duration - 1),
    };
    setCopying(true);
    try {
      assertImageClipboard();
      // The promise goes straight into the item so the write starts inside the click.
      const png = import('./export').then(({ renderFrameImage }) => renderFrameImage(snapshot));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      const done = `Frame ${snapshot.frame} copied as ${snapshot.width} × ${(snapshot.width * 9) / 16} PNG. Rendered locally.`;
      announce(setMessage, done);
    } catch (error) {
      const text = `Could not copy frame. ${error instanceof Error ? error.message : 'Unknown error.'}`;
      announce(setMessage, text, true);
    } finally {
      setCopying(false);
    }
  };
  // Stable across playback frames, so the memoized track headers skip those renders.
  const trackToggles = useMemo(
    () => ({ muted, locked, selected: selectedTracks }),
    [muted, locked, selectedTracks],
  );
  const toggleTrackIn = useCallback(
    (list: keyof typeof trackToggles, track: Track) =>
      ({ muted: setMuted, locked: setLocked, selected: setSelectedTracks })[list]((previous) =>
        toggleTrack(previous, track),
      ),
    [],
  );
  const moveTrackBy = useCallback(
    (id: Track, step: 1 | -1) => change({ ...edit, tracks: moveTrack(edit.tracks, id, step) }),
    [change, edit],
  );
  const libraryView = useMemo(
    () => (
      <MediaLibrary
        assets={assets}
        selected={sourceId}
        onSelect={(id, seconds) => {
          setSourceId(id);
          setSelected('');
          // A scrubbed card's position is adopted into the source preview on this deliberate
          // click; hovering the pool never moves it.
          const chosen = assets.find((a) => a.id === id);
          if (seconds !== undefined && chosen) setSourceSeek({ url: chosen.url, time: seconds });
        }}
        onImport={importFiles}
        onDrag={setDragAsset}
        busy={busy}
      >
        <PlaceOnTimeline
          asset={asset}
          tracks={edit.tracks}
          onPlace={(target, seconds) =>
            place(sourceId, target, seconds === null ? frameRef.current : seconds * FPS)
          }
        />
      </MediaLibrary>
    ),
    [assets, asset, sourceId, busy, edit.tracks, place],
  );
  const sourceView = useMemo(
    () => (
      <SourceMonitor
        asset={asset}
        tracks={edit.tracks}
        onInsert={insert}
        time={sourceTime}
        onTime={seekSource}
        blocked={sourceBlocked}
        transcript={transcription.row}
      />
    ),
    [asset, edit.tracks, insert, sourceTime, seekSource, sourceBlocked, transcription.row],
  );
  // The preview is laid out at most 1920 wide, and at a fraction of that, then scaled to the pane:
  // a 4K export must not make it a 3840 layout. Copy frame and export always render the full output.
  const previewWidth = Math.min(exportWidth, 1920) / PREVIEW_DIVISORS[previewQuality];
  const playerView = useMemo(
    () => (
      <Player
        ref={player}
        component={Composition}
        inputProps={compositionProps}
        durationInFrames={duration}
        compositionWidth={previewWidth}
        compositionHeight={(previewWidth * 9) / 16}
        fps={FPS}
        playbackRate={Math.max(1, speed)}
        controls={false}
        clickToPlay={false}
        moveToBeginningWhenEnded={false}
        numberOfSharedAudioTags={8}
        style={{ width: '100%', aspectRatio: '16 / 9' }}
      />
    ),
    [compositionProps, duration, speed, previewWidth],
  );

  return (
    <main className="editor">
      <header className="app-header">
        <button
          ref={mediaToggle}
          className="text-button media-toggle"
          aria-label={mediaMode === 'pinned' ? 'Hide media pool pane' : 'Show media pool pane'}
          aria-expanded={mediaMode !== 'closed'}
          aria-controls="media-drawer"
          onClick={toggleMedia}
          onKeyDown={(event) => {
            if (event.key === ' ') event.preventDefault();
          }}
        >
          {mediaMode === 'pinned' ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          Media
        </button>
        <button
          className="save-button"
          onClick={() => void saveProject()}
          disabled={busy || exportProgress !== null}
        >
          <ArrowDownToLine size={14} /> Save project
        </button>
        <label className="save-button project-open">
          <FolderOpen size={14} /> Open project
          <input
            aria-label="Open local project"
            type="file"
            accept=".json,.clipper"
            disabled={busy || exportProgress !== null}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file && mayDiscard()) void openProject(file);
              event.target.value = '';
            }}
          />
        </label>
        <div className="header-actions">
          <button
            className="text-button assistant-toggle"
            aria-expanded={assistantOpen}
            aria-controls="assistant-pane"
            onClick={() => setAssistantOpen((v) => !v)}
          >
            <Sparkles size={14} aria-hidden="true" /> Assistant
          </button>
          <div className="export-controls">
            <Choice
              label="Export resolution"
              value={String(exportWidth)}
              disabled={exportProgress !== null}
              options={[
                { value: '1920', label: '1920 × 1080' },
                { value: '3840', label: '3840 × 2160' },
              ]}
              onChange={(value) => setExportWidth(value === '3840' ? 3840 : 1920)}
            />
            <Choice
              label="Output FPS"
              value={outputFps}
              disabled={exportProgress !== null}
              describedBy={outputFps === 'auto' ? 'output-fps-auto' : undefined}
              options={OUTPUT_FPS.map((value) => ({ value, label: fpsName(value) }))}
              onChange={setOutputFps}
            />
            <button
              className="secondary-button"
              disabled={busy || !edit.clips.length || exportProgress !== null}
              aria-busy={copying}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => void copyFrame()}
            >
              <Copy size={14} /> Copy frame
            </button>
            <button
              ref={exportButton}
              className="secondary-button"
              disabled={busy || !edit.clips.length || exportProgress !== null}
              onClick={() => {
                setSpeed(0);
                exportDialog.current?.showModal();
              }}
            >
              Export video
            </button>
          </div>
        </div>
      </header>
      <div className="workspace-bar">
        <button
          className="text-button"
          onClick={() => {
            setSpeed(0);
            setHelp(!help);
          }}
        >
          <CircleHelp size={14} /> Shortcuts
        </button>
      </div>
      {exportProgress !== null && (
        <div className="export-progress" role="status">
          Rendering locally · {Math.round(exportProgress * 100)}%
          <progress aria-label="Video export progress" max="1" value={exportProgress} />
          <button className="text-button" onClick={() => exportAbort.current?.abort()}>
            Cancel export
          </button>
        </div>
      )}
      {readyVideo && (
        <div className="export-progress export-ready" role="status">
          <Check size={14} className="export-ready-check" />
          <span className="export-ready-label">
            {readyVideo.saved ? 'Saved' : 'Video ready'} · {readyVideo.name} ·{' '}
            {(readyVideo.size / 1e6).toFixed(1)} MB
          </span>
          <a
            ref={saveVideo}
            className={readyVideo.saved ? 'secondary-button' : 'save-button'}
            href={readyVideo.url}
            download={readyVideo.name}
            onClick={() => setReadyVideo({ ...readyVideo, saved: true })}
          >
            <ArrowDownToLine size={14} /> {readyVideo.saved ? 'Save again' : 'Save video'}
          </a>
          <button
            className="text-button"
            aria-label="Discard video"
            onClick={() => {
              setReadyVideo(null);
              exportButton.current?.focus();
            }}
          >
            Discard
          </button>
        </div>
      )}
      <div
        ref={workspacePanel}
        className={`workspace${mediaMode === 'pinned' ? '' : ' media-hidden'}`}
        data-timeline-hidden={!timelineOpen || undefined}
        data-compact={compactPanels || undefined}
        inert={sourceBlocked}
      >
        <div className="media-hot-zone" aria-hidden="true" />
        <div
          ref={mediaPanel}
          id="media-drawer"
          className="media-drawer"
          data-mode={mediaMode}
          data-instant={mediaInstant || undefined}
          inert={mediaMode === 'closed'}
          aria-hidden={mediaMode === 'closed'}
        >
          {libraryView}
        </div>
        <section className="editing-area">
          <div className="monitors">
            {sourceView}
            <section className="compose-panel">
              <div className="monitor-title">
                <span>
                  Composition <span className="active-pill">LIVE</span>
                </span>
              </div>
              <div className="compose-stage" data-testid="compose-monitor">
                {assets.length > 0 ? (
                  playerView
                ) : (
                  <div className="loading-preview">
                    {busy ? 'Preparing your cutting room…' : 'Import media to start composing'}
                  </div>
                )}
                {edit.layout.mode === 'pip' && !markZoom && (
                  // Editor-only corner targets over the live preview; Copy frame and export draw the
                  // composition itself, so these never reach a frame.
                  <div className="pip-corners" role="group" aria-label="Camera corner">
                    {CORNERS.map((corner) => {
                      const slot = maskRect('camera', { ...edit.layout, corner }); // → stage rect
                      const current = (edit.layout.corner ?? 'bottom-right') === corner;
                      return (
                        <button
                          key={corner}
                          type="button"
                          aria-label={`Camera ${corner.replace('-', ' ')}`}
                          aria-pressed={current}
                          style={{
                            left: `${(slot.x / STAGE.width) * 100}%`,
                            top: `${(slot.y / STAGE.height) * 100}%`,
                            width: `${(slot.width / STAGE.width) * 100}%`,
                            height: `${(slot.height / STAGE.height) * 100}%`,
                            borderRadius: `${(edit.layout.radius / slot.width) * 100}% / ${(edit.layout.radius / slot.height) * 100}%`,
                          }}
                          onClick={() => {
                            if (current) return;
                            change({ ...edit, layout: { ...edit.layout, corner } });
                            setMessage(`Camera moved to the ${corner.replace('-', ' ')} corner.`);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                {markZoom && (
                  <div
                    className="mouse-target"
                    data-testid="mouse-target"
                    data-marking={markingMouse || undefined}
                    aria-hidden="true"
                    style={{
                      left: `${(screenMask.x / STAGE.width) * 100}%`,
                      top: `${(screenMask.y / STAGE.height) * 100}%`,
                      width: `${(screenMask.width / STAGE.width) * 100}%`,
                      height: `${(screenMask.height / STAGE.height) * 100}%`,
                      borderRadius: `${(edit.layout.radius / screenMask.width) * 100}% / ${(edit.layout.radius / screenMask.height) * 100}%`,
                    }}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setSpeed(0);
                      setSelected(markZoom.id);
                      setMark({ id: markZoom.id, ...maskPoint(event) });
                      // Each mark is its own undo step, never merged into the previous edit.
                      gesture.current = null;
                    }}
                    onPointerMove={(event) => mark && setMark({ ...mark, ...maskPoint(event) })}
                    onPointerUp={(event) => {
                      if (!mark) return;
                      const { x, y } = maskPoint(event);
                      setMark(null);
                      change({
                        ...edit,
                        zooms: edit.zooms.map((z) => (z.id === mark.id ? { ...z, x, y } : z)),
                      });
                      setMessage(`Mouse focus marked at ${x}%, ${y}%. Preview the zoom hold.`);
                    }}
                    // Cancelled or interrupted gestures leave the focus as it was, with no undo step.
                    onPointerCancel={() => setMark(null)}
                    onLostPointerCapture={() => setMark(null)}
                  >
                    {mark && <span style={{ left: `${mark.x}%`, top: `${mark.y}%` }} />}
                  </div>
                )}
              </div>
              <div className="compose-caption">
                <span>
                  <span className="status-dot" /> {LAYOUTS[edit.layout.mode ?? 'side'].name}
                </span>
                <span>
                  Fit <Maximize2 size={12} />
                </span>
              </div>
            </section>
          </div>
        </section>
        <PanelResizeHandle {...resizeHandle('left')} />
        <PanelResizeHandle {...resizeHandle('right')} />
        <PanelResizeHandle {...resizeHandle('timeline')} />
        <section
          id="sequence-pane"
          className="sequence-area"
          aria-label="Main sequence"
          aria-hidden={!timelineOpen || undefined}
          inert={!timelineOpen}
        >
          <div className="transport">
            <div className="transport-readout">
              <IconButton
                label="Hide timeline"
                aria-controls="sequence-pane"
                aria-expanded={true}
                onClick={toggleTimeline}
              >
                <PanelBottomClose size={16} />
              </IconButton>
              <IconButton
                label={
                  customHeight ? 'Use default timeline height' : 'Restore custom timeline height'
                }
                aria-controls="sequence-pane"
                aria-pressed={customHeight}
                disabled={!hasCustomHeight}
                onClick={toggleTimelineHeight}
              >
                <Rows2 size={16} />
              </IconButton>
              <span data-testid="timecode">{timecode(frame)}</span>
              <span>/ {timecode(duration)}</span>
            </div>
            <div className="transport-buttons">
              <IconButton label="Go to start" onClick={() => seek(0)}>
                <SkipBack size={16} />
              </IconButton>
              <IconButton label="Previous frame" onClick={() => seek(frameRef.current - 1)}>
                <ArrowLeft size={15} />
              </IconButton>
              <button
                className="play-button"
                aria-label={speed ? 'Pause playback' : 'Play composition'}
                onClick={() => {
                  if (frame >= duration - 1) seek(0, false);
                  setSpeed(speed ? 0 : 1);
                }}
              >
                {speed ? (
                  <Pause size={17} fill="currentColor" />
                ) : (
                  <Play size={17} fill="currentColor" />
                )}
              </button>
              <IconButton label="Next frame" onClick={() => seek(frameRef.current + 1)}>
                <ArrowRight size={15} />
              </IconButton>
              <span
                className={speed ? 'playback-state' : 'playback-state idle'}
                data-testid="transport-state"
              >
                {speed > 0
                  ? `Playing · ${speed}×`
                  : speed < 0
                    ? `Rewinding · ${-speed}×`
                    : 'Paused'}
              </span>
            </div>
          </div>
          <div className="timeline-toolbar">
            <div>
              <span className="timeline-name">Main sequence</span>
              <span className="timeline-badge">01</span>
            </div>
            <div className="edit-tools">
              <IconButton label="Undo" disabled={!history.length} onClick={undo}>
                <CornerUpLeft size={15} />
              </IconButton>
              <span className="divider" />
              <span className="tool-toggles" role="group" aria-label="Timeline tool">
                <IconButton
                  label="Selection tool"
                  aria-pressed={tool === 'select'}
                  aria-keyshortcuts="V"
                  onClick={() => setTool('select')}
                >
                  <MousePointer2 size={14} />
                </IconButton>
                <IconButton
                  label="Razor tool"
                  aria-pressed={tool === 'razor'}
                  aria-keyshortcuts="C"
                  onClick={() => setTool('razor')}
                >
                  <Slice size={14} />
                </IconButton>
              </span>
              <button
                className="text-button"
                aria-label="Split selected clip"
                title="Cut the selected clip and selected tracks at the playhead"
                onClick={split}
                disabled={!selectedClip && !selectedTracks.length}
              >
                <Scissors size={15} /> Split
              </button>
              <IconButton
                label="Delete selected clip or zoom"
                disabled={!selectedClip && !selectedZoom && !selectedChapter}
                onClick={removeSelected}
              >
                <Trash2 size={14} />
              </IconButton>
              <span className="divider" />
              <button
                className="text-button zoom-action"
                aria-label="Add zoom at playhead"
                title="Create a 4-second cursor zoom at the playhead (B)"
                onClick={addZoom}
              >
                <ZoomIn size={15} /> Add zoom <kbd>B</kbd>
              </button>
            </div>
          </div>
          <ClipEditContext value={agentEdit}>
            <Timeline
              headers={{
                registry: edit.tracks,
                tracks: trackToggles,
                onToggleTrack: toggleTrackIn,
                onMoveTrack: moveTrackBy,
              }}
              drop={dragging && { media: placed(dragging), onDrop: place }}
              clips={edit.clips}
              assets={assets}
              zooms={edit.zooms}
              frame={frame}
              duration={duration}
              selected={selected}
              onSelect={(id) => {
                setSelected(id);
              }}
              onSeek={seek}
              zoomRef={timelineZoom}
              chapters={chapters}
              onTrim={putClip}
              razor={tool === 'razor' ? { cut: razor, hover: razorHover } : undefined}
              zoomEdits={{
                move: (id, start) =>
                  change({ ...edit, zooms: moveZoom(edit.zooms, id, start, duration) }),
                resize: (id, edge, frame) =>
                  change({ ...edit, zooms: resizeZoom(edit.zooms, id, edge, frame, duration) }),
              }}
            />
          </ClipEditContext>
          <div className="sequence-footer">
            <span>
              <kbd>J</kbd> Rewind <kbd>K</kbd> Pause <kbd>L</kbd> Play / faster
            </span>
            <span>Frame-accurate</span>
          </div>
        </section>
        <Inspector
          zoom={selectedZoom}
          layout={edit.layout}
          duration={duration}
          onLayout={(layout) => inspect({ ...edit, layout })}
          onScrubStart={scrubStart}
          onScrubEnd={scrubEnd}
          background={
            <BackgroundImageControl
              current={background}
              asset={
                background.kind === 'image'
                  ? assets.find((a) => a.id === background.clip.assetId)
                  : undefined
              }
              busy={busy}
              onChoose={(file) => void chooseBackground(file)}
              onRemove={removeBackground}
            />
          }
          onAddZoom={addZoom}
          onRemoveZoom={removeSelected}
          onZoom={(zoom) => {
            if (zoomsOverlap(edit.zooms, zoom)) {
              // The same text again, so a drag against a neighbour announces it once.
              setMessage('Zooms cannot overlap.');
              return;
            }
            inspect({
              ...edit,
              zooms: edit.zooms.map((z) => (z.id === zoom.id ? zoom : z)),
            });
          }}
        >
          {selectedClip && assets.find((a) => a.id === selectedClip.assetId)?.kind === 'image' && (
            <section className="cursor-controls" aria-label="Still image clip">
              <h3>Still image</h3>
              <StillDuration
                key={selectedClip.id}
                frames={selectedClip.duration}
                max={86400 * FPS - selectedClip.start}
                label="Selected still duration seconds"
                onCommit={(duration) => {
                  try {
                    if (!change(resizeStill(edit, selectedClip, duration)))
                      return 'This track is locked. Unlock it to change the duration.';
                  } catch (error) {
                    return error instanceof Error ? error.message : String(error);
                  }
                  setMessage('Still duration updated.');
                  return null;
                }}
              />
            </section>
          )}
          {selectedClip && selectedVisual && (
            <ClipSize
              clip={selectedClip}
              onSize={(sizing) =>
                change({
                  ...edit,
                  clips: edit.clips.map((c) =>
                    c.id === selectedClip.id ? setSizing(c, sizing) : c,
                  ),
                })
              }
            />
          )}
          {selectedClip && gainable && (
            <ClipGain
              gain={selectedClip.gain ?? 0}
              onGain={(db) => change(gainEdit(db))}
              drag={gainScrub}
            />
          )}
          <ChapterControls
            chapters={chapters}
            selected={selectedChapter}
            onRename={(frame, title) =>
              setChapters(retitleChapter(edit.chapters ?? [], frame, title))
            }
            onCopy={copyChapters}
          />
          <CursorControls
            key={cursorAsset?.id}
            asset={cursorAsset}
            onChange={(cursor) =>
              setAssets((previous) =>
                previous.map((source) =>
                  source.id === cursorAsset?.id ? { ...source, cursor } : source,
                ),
              )
            }
          />
          <section className="cursor-controls" aria-label="Zoom creation">
            <button
              className="secondary-button"
              aria-label="Add zoom"
              title="Create a 4-second cursor zoom at the playhead (B)"
              onClick={addZoom}
            >
              Add zoom <kbd>B</kbd>
            </button>
            <p className="cursor-note">
              Create one 4-second zoom at the playhead. No tracking required.
            </p>
          </section>
        </Inspector>
        {/* Inside the workspace: fixed, so out of flow, and not counted as chrome when the
            panes measure the height left for them. */}
        <AgentPanel
          open={assistantOpen}
          onClose={() => {
            setAssistantOpen(false);
            assistantToggle()?.focus();
          }}
          lines={() =>
            timelineLines(edit.clips, assets, (c) => {
              const name = assets.find((a) => a.id === c.assetId)?.name ?? 'Missing media';
              return `${name} at ${(c.start / FPS).toFixed(1)} seconds`;
            })
          }
        />
      </div>
      <footer className="app-footer">
        {!timelineOpen && (
          <IconButton
            label="Show timeline"
            aria-controls="sequence-pane"
            aria-expanded={false}
            onClick={toggleTimeline}
          >
            <PanelBottomOpen size={16} />
          </IconButton>
        )}
        <span role="status">
          <span className="status-dot" /> {message}
        </span>
        <span
          className="preview-quality"
          title="Lays the preview out smaller so it plays lighter. Copy frame and export are unaffected."
        >
          Preview
          <Choice
            label="Preview quality"
            value={previewQuality}
            options={[
              { value: 'full', label: 'Full' },
              { value: 'half', label: 'Half' },
              { value: 'quarter', label: 'Quarter' },
            ]}
            onChange={(quality) => {
              setPreviewQuality(quality);
              savePreviewQuality(quality);
            }}
          />
        </span>
        <span>
          REMOTION × MEDIABUNNY <span className="footer-version">STEEL THREAD 0.1</span>
        </span>
      </footer>
      <dialog ref={exportDialog} aria-labelledby="export-title" className="export-dialog">
        <h2 id="export-title">Export video</h2>
        <p>Rendered on this device. Your media stays local.</p>
        <dl>
          <dt>Resolution</dt>
          <dd>
            {exportWidth} × {(exportWidth * 9) / 16}
          </dd>
          <dt>Frame rate</dt>
          <dd id="output-fps-auto">
            {outputFps === 'auto' ? 'Auto uses project cadence (30 fps)' : fpsName(outputFps)}
          </dd>
        </dl>
        <label htmlFor="export-format">Format</label>
        <Choice
          id="export-format"
          value={exportFormat}
          describedBy="export-format-description"
          options={[
            { value: 'mp4', label: 'MP4 · H.264 / AAC' },
            { value: 'mov', label: 'MOV · H.264 / PCM' },
            { value: 'webm', label: 'WebM · VP9 / Opus' },
          ]}
          onChange={setExportFormat}
        />
        <p id="export-format-description">
          {exportFormat === 'mov'
            ? 'Uncompressed PCM audio adds about 11.5 MB per minute at stereo 48 kHz. Playback support varies by app.'
            : exportFormat === 'mp4'
              ? 'H.264 video with AAC audio. A local encoder is used when native AAC is unavailable. Your browser must support H.264 encoding.'
              : 'VP9 video with Opus audio. Your browser must support these encoders.'}
        </p>
        <p>
          Filename:{' '}
          <strong>
            {exportBasename}.{exportFormat}
          </strong>
          <br />
          The save dialog may hide the extension. The saved file includes it.
        </p>
        <a href="/licenses/mediabunny-aac-encoder.txt" target="_blank" rel="noreferrer">
          Encoder licenses and source
        </a>
        <form method="dialog" className="export-dialog-actions">
          <button className="secondary-button">Cancel</button>
          <button
            className="save-button"
            type="button"
            onClick={() => {
              exportDialog.current?.close();
              void exportVideo();
            }}
          >
            Render video
          </button>
        </form>
      </dialog>
      <dialog
        ref={helpDialog}
        aria-label="Keyboard shortcuts"
        className="help-dialog"
        onCancel={() => setHelp(false)}
      >
        <h2>Stay in the flow.</h2>
        <p>Keyboard shortcuts for the cutting room.</p>
        {[
          ['J', 'Rewind · repeat for 2× / 4× (silent)'],
          ['K', 'Pause'],
          ['L', 'Play · repeat for 2× / 4×'],
          ['Space', 'Play / pause · also from sliders, menus, checkboxes and file buttons'],
          ['Enter', 'Toggle a focused checkbox or open a focused menu'],
          ['← / →', 'Step one frame'],
          ['V / C', 'Selection tool / Razor tool (hover to preview the cut frame, click to cut)'],
          [MAC ? '⌘ K' : 'Alt K', 'Cut every unlocked track at the playhead'],
          ['B', 'Create zoom at playhead (4 seconds)'],
          ['↑ / ↓', 'Playhead to the previous / next edit point · from the timeline'],
          ['X', 'Select the clip under the playhead (the selected track, else the topmost video)'],
          ['[ / ]', "Trim the selected clip's start / end to the playhead · no ripple"],
          ['M', 'Mark a chapter at the playhead · Delete removes the selected one'],
          ['- / =', 'Zoom the timeline out / in · changes the display only, never a clip'],
          ['Delete', 'Remove selected clip or zoom · only from the timeline'],
          ['⌘ / Ctrl Z', 'Undo last edit'],
        ].map(([key, text]) => (
          <div className="shortcut-row" key={key}>
            <kbd>{key}</kbd>
            <span>{text}</span>
          </div>
        ))}
        <button className="save-button" onClick={() => setHelp(false)}>
          Back to editing
        </button>
      </dialog>
    </main>
  );
}
