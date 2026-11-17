import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Player, type PlayerRef } from '@remotion/player';
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
} from 'lucide-react';
import { Composition } from './Composition';
import { IconButton, MediaLibrary, Waveform, timecode } from './components';
import { type Asset, DEFAULT_STILL_FRAMES, loadDemo, readMedia, unreadableNamesake } from './media';
import { Timeline, TRACKS } from './Timeline';
import {
  FPS,
  type Clip,
  type Track,
  type Zoom,
  insertClip,
  lockedChange,
  splitClip,
  splitWhere,
  ZOOM_LIMITS,
  zoomsOverlap,
} from './timeline-model';
import { classifyChange, type Gesture } from './history';
import {
  librarySizeWarning,
  serializeProject,
  parseProject,
  validateSources,
  type Edit,
} from './project';
import { CursorControls } from './CursorControls';
import { ZoomMotionControls } from './ZoomMotionControls';
import { resolveZooms } from './zoom-generation';
import { maskRect, STAGE, type Layout } from './stage';
import { useMediaDrawer } from './useMediaDrawer';
import { PanelResizeHandle, usePanelLayout } from './PanelResizeHandle';
import './styles.css';

// Cmd+K cuts every unlocked track on a Mac; Alt+K does elsewhere, leaving Ctrl+K to the browser.
const MAC = /Mac|iP(hone|ad|od)/.test(navigator.platform);

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
  layout: { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
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
                : onCommit(length);
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

function sourceTracks(kind?: Asset['kind']) {
  if (kind === 'image') return TRACKS.filter((t) => ['screen', 'camera'].includes(t.id));
  return TRACKS.filter((t) => kind !== 'audio' || ['voice', 'music'].includes(t.id));
}

function resizeStill(edit: Edit, clip: Clip, duration: number): Edit {
  const next = edit.clips.find(
    (c) => c.track === clip.track && c.start > clip.start && c.start < clip.start + duration,
  );
  if (next)
    throw new Error('Still duration would overlap the following clip. No clips were changed.');
  return { ...edit, clips: edit.clips.map((c) => (c.id === clip.id ? { ...c, duration } : c)) };
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

/** Source preview with explicit in/out points and track-targeted ripple insertion. */
export function SourceMonitor({
  asset,
  onInsert,
  blocked = false,
}: {
  asset?: Asset;
  onInsert: (track: Track, offset: number, duration: number) => void;
  /** Pause source playback while workspace controls cannot be used. */
  blocked?: boolean;
}) {
  const [sourceUrl, setSourceUrl] = useState(() => asset?.url);
  const [track, setTrack] = useState<Track>(asset?.kind === 'audio' ? 'voice' : 'screen');
  const [range, setRange] = useState(() => ({ start: 0, end: sourceRangeEnd(asset) }));
  const [preview, setPreview] = useState({ playing: false, time: 0, error: '' });
  const video = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const playRequest = useRef<symbol | null>(null);
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
    setTrack(asset?.kind === 'audio' ? 'voice' : 'screen');
    setPreview({ playing: false, time: 0, error: '' });
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
              onTimeUpdate={(e) => {
                const time = e.currentTarget.currentTime;
                setPreview((p) => ({ ...p, time }));
              }}
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
              <input
                type="range"
                aria-label="Source preview position"
                min={0}
                max={(asset.duration - 1) / FPS}
                step={1 / FPS}
                value={preview.time}
                onChange={(e) => {
                  const time = Number(e.target.value);
                  setPreview((p) => ({ ...p, time }));
                  if (video.current) video.current.currentTime = time;
                }}
              />
              <span>{timecode(Math.round(preview.time * FPS)).slice(0, 5)}</span>
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
            <audio ref={audio} src={asset.url} controls />
          </div>
        ) : (
          <span className="empty-preview">Import video, audio or a PNG/JPEG image</span>
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
        <div className="source-range">
          <label>
            In{' '}
            <input
              aria-label="Source in seconds"
              type="number"
              min="0"
              max={Math.max(0, (range.end - 1) / FPS)}
              step={1 / FPS}
              value={Number((range.start / FPS).toFixed(3))}
              onChange={(e) => {
                const start = Math.max(
                  0,
                  Math.min(range.end - 1, Math.round(Number(e.target.value) * FPS)),
                );
                setRange({ ...range, start });
                if (video.current) video.current.currentTime = start / FPS;
              }}
            />
          </label>
          <label>
            Out{' '}
            <input
              aria-label="Source out seconds"
              type="number"
              min={(range.start + 1) / FPS}
              max={(asset?.duration ?? 0) / FPS}
              step={1 / FPS}
              value={Number((range.end / FPS).toFixed(3))}
              onChange={(e) =>
                setRange({
                  ...range,
                  end: Math.min(
                    asset?.duration ?? 0,
                    Math.max(range.start + 1, Math.round(Number(e.target.value) * FPS)),
                  ),
                })
              }
            />
          </label>
        </div>
      )}
      <div className="source-insert">
        <select
          aria-label="Insert onto track"
          value={track}
          onChange={(e) => {
            const value = TRACKS.find((t) => t.id === e.target.value);
            if (value) setTrack(value.id);
          }}
        >
          {sourceTracks(asset?.kind).map((t) => (
            <option key={t.id} value={t.id}>
              {t.detail} · {t.label}
            </option>
          ))}
        </select>
        <IconButton
          label="Insert source at playhead"
          disabled={!asset || range.end <= range.start}
          onClick={() => onInsert(track, range.start, range.end - range.start)}
        >
          <Plus size={15} />
        </IconButton>
      </div>
    </section>
  );
}

/** Editing controls for a selected zoom and the two composition masks. */
export function Inspector({
  zoom,
  layout,
  onLayout,
  onZoom,
  onRemoveZoom,
  onAddZoom,
  onMarkMouse,
  markingMouse = false,
  duration,
  children,
}: {
  zoom?: Zoom;
  layout: Layout;
  onLayout: (layout: Layout) => void;
  onZoom: (zoom: Zoom) => void;
  onRemoveZoom: () => void;
  onAddZoom: () => void;
  onMarkMouse?: () => void;
  markingMouse?: boolean;
  duration: number;
  children?: ReactNode;
}) {
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
          <strong>Side by side</strong>
          <small>Landscape + portrait</small>
        </div>
        <Check size={14} />
      </div>
      <div className="inspector-section">
        <h3>
          Composition <span>16:9</span>
        </h3>
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
        <label className="slider-label">
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
        <h3>Crop & framing</h3>
        {(['screen', 'camera'] as const).map((track) => (
          <div key={track} className="crop-controls">
            <span>{track === 'screen' ? 'Landscape' : 'Talking head'}</span>
            <label>
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
            <label>
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
            <button
              className="secondary-button"
              onClick={onMarkMouse}
              disabled={!onMarkMouse}
              aria-pressed={markingMouse}
            >
              {markingMouse ? 'Cancel mouse marking' : 'Mark mouse position'}
            </button>
            <p className="inspector-copy">
              Mark focus in the unzoomed frame. Editing a generated shot makes it manual.
            </p>
            <ZoomMotionControls zoom={zoom} onChange={onZoom} />
            <label className="slider-label">
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
              <label>
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
              <label>
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
              <label>
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
              <label>
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
            <div className="ease-curve">
              <svg viewBox="0 0 160 34">
                <path d="M2 30 C30 30 24 4 55 4 H108 C138 4 128 30 158 30" />
              </svg>
              <span>Automatic ease in & out · optional instant</span>
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
  const [edit, setEdit] = useState<Edit>(INITIAL_EDIT);
  const [history, setHistory] = useState<Edit[]>([]);
  // The edit the last Save wrote, compared by identity: undoing back to it is saved again.
  const [savedEdit, setSavedEdit] = useState<Edit | null>(null);
  const [selected, setSelected] = useState('s1');
  const [frame, setFrame] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [muted, setMuted] = useState<Track[]>([]);
  // Locks and Split's track targets are saved with the project but are never undo steps.
  const [locked, setLocked] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [savedTracks, setSavedTracks] = useState({ locked, selectedTracks });
  const [tool, setTool] = useState<'select' | 'razor'>('select');
  const [message, setMessage] = useState('Ready for your next story.');
  const [help, setHelp] = useState(false);
  const [markingZoomId, setMarkingZoomId] = useState<string | null>(null);
  const [exportWidth, setExportWidth] = useState<1920 | 3840>(1920);
  const [exportFormat, setExportFormat] = useState<'mp4' | 'mov' | 'webm'>('mp4');
  const [exportProgress, setExportProgress] = useState<number | null>(null);
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
  const selectedZoom = edit.zooms.find((z) => z.id === selected);
  // Marking belongs to one zoom, so it ends by itself when that zoom is removed, undone or deselected.
  const markingMouse = markingZoomId !== null && selectedZoom?.id === markingZoomId;
  const screenMask = maskRect('screen', edit.layout); // → stage rect the mouse target covers
  const selectedClip = edit.clips.find((c) => c.id === selected);
  const cursorAsset = selectedClip
    ? selectedClip.track === 'screen'
      ? assets.find((source) => source.id === selectedClip.assetId)
      : undefined
    : selectedZoom
      ? undefined
      : asset;
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

  // The undo step still open: a drag or a held key folds into it instead of adding steps.
  const gesture = useRef<Gesture | null>(null);
  // Returns false when a lock refused the edit, so callers report nothing else. Locks guard new
  // clip edits only, so zoom and layout edits always succeed: undo, open and demo loading
  // replace the edit without passing through here.
  const change = useCallback(
    (proposed: Edit): boolean => {
      const refused = lockedChange(edit.clips, proposed.clips, locked); // → Track | undefined
      if (refused) {
        setMessage(`${TRACKS.find((t) => t.id === refused)!.label} is locked.`);
        return false;
      }
      const next = {
        ...proposed,
        zooms: resolveZooms(proposed.zooms, proposed.clips, assets, proposed.layout),
      }; // → Edit
      const step = classifyChange(edit, next, gesture.current, performance.now()); // → HistoryStep
      if (step.kind === 'none') return true;
      gesture.current = step.gesture;
      if (step.kind === 'push') setHistory((previous) => [...previous.slice(-49), edit]);
      setEdit(next);
      return true;
    },
    [edit, assets, locked],
  );
  // ponytail: history keeps 50 steps, so undoing all of a longer session reads as saved.
  // Add a saved marker to the edit itself if that ever costs someone work.
  const unsaved =
    (history.length > 0 && edit !== savedEdit) ||
    !sameTracks(locked, savedTracks.locked) ||
    !sameTracks(selectedTracks, savedTracks.selectedTracks);
  const working = unsaved || exportProgress !== null;
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
  const seek = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(duration - 1, Math.round(next)));
      setSpeed(0);
      player.current?.pause();
      player.current?.seekTo(target);
      frameRef.current = target;
      setFrame(target);
    },
    [duration],
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
  const razor = useCallback(
    (id: string, at: number) => {
      const next = splitClip(edit.clips, id, at);
      if (next.length === edit.clips.length) return; // a clip edge or a gap is no cut
      if (change({ ...edit, clips: next })) setMessage('Razor cut. Source timing preserved.');
    },
    [edit, change],
  );
  const removeSelected = useCallback(() => {
    if (selectedZoom) change({ ...edit, zooms: edit.zooms.filter((z) => z.id !== selected) });
    else if (selectedClip) change({ ...edit, clips: edit.clips.filter((c) => c.id !== selected) });
  }, [edit, selected, selectedZoom, selectedClip, change]);

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

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (help || busy || exportProgress !== null || markingMouse || exportDialog.current?.open)
        return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      const key = event.key.toLowerCase();
      // Sliders, checkboxes and menus keep their own keys but give Space to transport. Enter
      // replaces their Space action: it toggles a checkbox and opens a menu, whose arrow keys
      // still work where showPicker is unavailable. Text and number entry keep every key.
      if (target instanceof HTMLInputElement && !['range', 'checkbox'].includes(target.type))
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
        if (key !== ' ') return;
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
      if (['j', 'k', 'l', ' ', 'arrowleft', 'arrowright', 'delete', 'backspace'].includes(key))
        event.preventDefault();
      if (key === 'j') setSpeed((s) => (s < 0 ? Math.max(-4, s * 2) : -1));
      if (key === 'k') setSpeed(0);
      if (key === 'l') {
        if (frameRef.current >= duration - 1) seek(0);
        setSpeed((s) => (s > 0 ? Math.min(4, s * 2) : 1));
      }
      if (key === ' ' && !event.repeat) setSpeed((s) => (s ? 0 : 1));
      if (key === 'arrowleft') seek(frameRef.current - 1);
      if (key === 'arrowright') seek(frameRef.current + 1);
      if (key === 'c') setTool('razor');
      if (key === 'v') setTool('select');
      if (key === 'delete' || key === 'backspace') removeSelected();
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
      if (['voice', 'music'].includes(track) && !asset.hasAudio) {
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
      };
      const next = { ...edit, clips: insertClip(edit.clips, clip, frameRef.current) };
      const failure = stillInsertionError(asset, next, assets);
      if (failure) {
        setMessage(failure);
        return;
      }
      if (!change(next)) return;
      setSelected(clip.id);
      setMessage(`Inserted ${asset.name} onto ${TRACKS.find((t) => t.id === track)!.label}.`);
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
      const tracks = { locked, selectedTracks };
      const { file, omitted } = await serializeProject(edit, assets, muted, tracks);
      downloadBlob(file, 'developer-walkthrough.clipper.json');
      setSavedEdit(edit);
      setSavedTracks(tracks);
      // The next change starts a new step, so Undo can return to exactly what was saved.
      gesture.current = null;
      setMessage(
        omitted.length
          ? `Portable project saved. Left out unused media: ${omitted.join(', ')}. ` +
              'It could not be read or did not fit in the file.'
          : 'Portable project saved with source media included. No relinking needed.',
      );
    } catch (error) {
      setMessage(
        `Could not save project. ${error instanceof Error ? error.message : 'Unknown error.'}`,
      );
    } finally {
      setBusy(false);
    }
  };
  // Opening replaces the whole edit and its undo history, so unsaved work needs a yes first.
  const mayDiscard = () =>
    !unsaved || window.confirm('Open this project and discard your unsaved edits?');
  const openProject = async (file: File) => {
    setBusy(true);
    setSpeed(0);
    setMarkingZoomId(null);
    const imported: Asset[] = [];
    try {
      const project = parseProject(await file.text());
      for (const media of project.media) {
        const response = await fetch(media.data);
        imported.push(await readMedia(await response.blob(), media.name, media.id, media.cursor));
        if ((imported[imported.length - 1].kind === 'image') !== (media.kind === 'image'))
          throw new Error(`Image kind does not match embedded media ${media.name}.`);
      }
      validateSources(project.edit, imported);
      const previous = assets;
      setAssets(imported);
      setEdit({
        ...project.edit,
        zooms: resolveZooms(project.edit.zooms, project.edit.clips, imported, project.edit.layout),
      });
      setMuted(project.muted);
      setLocked(project.locked);
      setSelectedTracks(project.selectedTracks);
      setSavedTracks({ locked: project.locked, selectedTracks: project.selectedTracks });
      setHistory([]);
      setSelected(project.edit.clips[0]?.id ?? '');
      setSourceId(imported[0]?.id ?? '');
      seek(0);
      setTimeout(() => previous.forEach((a) => URL.revokeObjectURL(a.url)), 0);
      setMessage('Project reopened. Embedded media restored locally; no relinking or upload.');
    } catch (error) {
      imported.forEach((a) => URL.revokeObjectURL(a.url));
      setMessage(
        `Could not open project. ${error instanceof Error ? error.message : 'Invalid project.'}`,
      );
    } finally {
      setBusy(false);
    }
  };
  const exportBasename = `developer-walkthrough-${exportWidth === 1920 ? '1080p' : '4k'}`;
  const exportVideo = async () => {
    setSpeed(0);
    setMarkingZoomId(null);
    setExportProgress(0);
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
        onProgress: (value) => {
          const next = Math.round(value * 100) / 100;
          if (next === progress) return;
          progress = next;
          setExportProgress(next);
        },
        signal: controller.signal,
      });
      downloadBlob(
        blob,
        `${exportBasename}.${blob.type.slice('video/'.length).replace('quicktime', 'mov')}`,
      );
      setMessage(`Video exported at ${exportWidth} × ${(exportWidth * 9) / 16}. Rendered locally.`);
    } catch (error) {
      setMessage(
        controller.signal.aborted
          ? 'Export cancelled.'
          : `Export failed. ${error instanceof Error ? error.message : 'Unknown error.'}`,
      );
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
      setMessage(
        `Frame ${snapshot.frame} copied as ${snapshot.width} × ${(snapshot.width * 9) / 16} PNG. Rendered locally.`,
      );
    } catch (error) {
      setMessage(
        `Could not copy frame. ${error instanceof Error ? error.message : 'Unknown error.'}`,
      );
    } finally {
      setCopying(false);
    }
  };
  const libraryView = useMemo(
    () => (
      <MediaLibrary
        assets={assets}
        selected={sourceId}
        onSelect={(id) => {
          setSourceId(id);
          setSelected('');
          setMarkingZoomId(null);
        }}
        onImport={importFiles}
        busy={busy}
      />
    ),
    [assets, sourceId, busy],
  );
  const sourceView = useMemo(
    () => <SourceMonitor asset={asset} onInsert={insert} blocked={sourceBlocked} />,
    [asset, insert, sourceBlocked],
  );
  const playerView = useMemo(
    () => (
      <Player
        ref={player}
        component={Composition}
        inputProps={compositionProps}
        durationInFrames={duration}
        compositionWidth={exportWidth}
        compositionHeight={(exportWidth * 9) / 16}
        fps={FPS}
        playbackRate={Math.max(1, speed)}
        controls={false}
        clickToPlay={false}
        moveToBeginningWhenEnded={false}
        numberOfSharedAudioTags={8}
        style={{ width: '100%', aspectRatio: '16 / 9' }}
      />
    ),
    [compositionProps, duration, speed, exportWidth],
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
        <div className="header-actions">
          <label className="project-open">
            Open project
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
          <div className="export-controls">
            <select
              aria-label="Export resolution"
              value={exportWidth}
              disabled={exportProgress !== null}
              onChange={(event) => setExportWidth(event.target.value === '3840' ? 3840 : 1920)}
            >
              <option value="1920">1920 × 1080</option>
              <option value="3840">3840 × 2160</option>
            </select>
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
                {markingMouse && selectedZoom && (
                  <button
                    className="mouse-target"
                    aria-label="Set mouse focus on screen"
                    style={{
                      left: `${(screenMask.x / STAGE.width) * 100}%`,
                      top: `${(screenMask.y / STAGE.height) * 100}%`,
                      width: `${(screenMask.width / STAGE.width) * 100}%`,
                      height: `${(screenMask.height / STAGE.height) * 100}%`,
                      borderRadius: `${(edit.layout.radius / screenMask.width) * 100}% / ${(edit.layout.radius / screenMask.height) * 100}%`,
                    }}
                    onClick={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      const x = event.detail
                        ? Math.round(((event.clientX - rect.left) / rect.width) * 100)
                        : selectedZoom.x;
                      const y = event.detail
                        ? Math.round(((event.clientY - rect.top) / rect.height) * 100)
                        : selectedZoom.y;
                      change({
                        ...edit,
                        zooms: edit.zooms.map((z) =>
                          z.id === selectedZoom.id ? { ...z, x, y, source: undefined } : z,
                        ),
                      });
                      setMarkingZoomId(null);
                      setMessage(`Mouse focus marked at ${x}%, ${y}%. Preview the zoom hold.`);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setMarkingZoomId(null);
                        return;
                      }
                      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
                        return;
                      event.preventDefault();
                      const x = Math.max(
                        0,
                        Math.min(
                          100,
                          selectedZoom.x +
                            (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0),
                        ),
                      );
                      const y = Math.max(
                        0,
                        Math.min(
                          100,
                          selectedZoom.y +
                            (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0),
                        ),
                      );
                      change({
                        ...edit,
                        zooms: edit.zooms.map((z) =>
                          z.id === selectedZoom.id ? { ...z, x, y } : z,
                        ),
                      });
                    }}
                  >
                    <span style={{ left: `${selectedZoom.x}%`, top: `${selectedZoom.y}%` }} />
                  </button>
                )}
              </div>
              {markingMouse && (
                <div className="animation-guide">
                  Mark mouse position · Recordings do not contain cursor metadata. Click the mouse
                  in this unzoomed screen frame, or use arrows and Enter.
                </div>
              )}
              <div className="compose-caption">
                <span>
                  <span className="status-dot" /> Side by side
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
                  if (frame >= duration - 1) seek(0);
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
                disabled={!selectedClip && !selectedZoom}
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
            <span className="timeline-toolbar-hint">Double-click a track to seek</span>
          </div>
          <Timeline
            clips={edit.clips}
            assets={assets}
            zooms={edit.zooms}
            frame={frame}
            duration={duration}
            selected={selected}
            onSelect={(id) => {
              setSelected(id);
              setMarkingZoomId(null);
            }}
            onSeek={seek}
            tracks={{ muted, locked, selected: selectedTracks }}
            onToggleTrack={(list, track) =>
              ({ muted: setMuted, locked: setLocked, selected: setSelectedTracks })[list](
                (previous) => toggleTrack(previous, track),
              )
            }
            onZoomSelect={(id) => {
              setSelected(id);
              setMarkingZoomId(null);
            }}
            onTrim={(clip) => {
              setSpeed(0);
              change({ ...edit, clips: edit.clips.map((c) => (c.id === clip.id ? clip : c)) });
            }}
            tool={tool}
            onRazor={razor}
          />
          <div className="sequence-footer">
            <span>
              <kbd>J</kbd> Rewind <kbd>K</kbd> Pause <kbd>L</kbd> Play / faster
            </span>
            <span>Frame-accurate · 30 fps</span>
          </div>
        </section>
        <Inspector
          zoom={selectedZoom}
          layout={edit.layout}
          duration={duration}
          onLayout={(layout) => change({ ...edit, layout })}
          onAddZoom={addZoom}
          onMarkMouse={() => {
            setSpeed(0);
            setMarkingZoomId(markingMouse ? null : (selectedZoom?.id ?? null));
          }}
          markingMouse={markingMouse}
          onRemoveZoom={removeSelected}
          onZoom={(zoom) => {
            if (zoomsOverlap(edit.zooms, zoom)) {
              setMessage('Zooms cannot overlap.');
              return;
            }
            change({
              ...edit,
              zooms: edit.zooms.map((z) => (z.id === zoom.id ? { ...zoom, source: undefined } : z)),
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
            {exportWidth} × {(exportWidth * 9) / 16} · 30 fps
          </dd>
        </dl>
        <label htmlFor="export-format">Format</label>
        <select
          id="export-format"
          value={exportFormat}
          aria-describedby="export-format-description"
          onChange={(event) => {
            const value = event.target.value;
            if (value === 'mp4' || value === 'mov' || value === 'webm') setExportFormat(value);
          }}
        >
          <option value="mp4">MP4 · H.264 / AAC</option>
          <option value="mov">MOV · H.264 / PCM</option>
          <option value="webm">WebM · VP9 / Opus</option>
        </select>
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
          ['Space', 'Play / pause · also from sliders, menus and checkboxes'],
          ['Enter', 'Toggle a focused checkbox or open a focused menu'],
          ['← / →', 'Step one frame'],
          ['V / C', 'Selection tool / Razor tool (click a clip to cut it)'],
          [MAC ? '⌘ K' : 'Alt K', 'Cut every unlocked track at the playhead'],
          ['B', 'Create zoom at playhead (4 seconds)'],
          ['Delete', 'Remove selected clip or zoom'],
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
