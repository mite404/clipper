import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  CornerUpLeft,
  Crop,
  Maximize2,
  Pause,
  Play,
  Plus,
  Scissors,
  SkipBack,
  Trash2,
  ZoomIn,
} from 'lucide-react';
import { Composition } from './Composition';
import { IconButton, MediaLibrary, Waveform, timecode } from './components';
import { type Asset, loadDemo, readMedia } from './media';
import { Timeline, TRACKS } from './Timeline';
import {
  FPS,
  type Clip,
  type Track,
  type Zoom,
  covers,
  insertClip,
  sourceFrame,
  splitClip,
  ZOOM_LIMITS,
  zoomsOverlap,
} from './timeline-model';
import { serializeProject, parseProject, validateSources, type Edit } from './project';
import { CursorControls } from './CursorControls';
import { AutoZoomControls } from './AutoZoomControls';
import { ZoomMotionControls } from './ZoomMotionControls';
import { resolveZooms } from './zoom-generation';
import { maskRect, STAGE, type Layout } from './stage';
import './styles.css';

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
const importSummary = (count: number, failures: string[]) =>
  [
    ...(count ? [`Imported ${count} local file${count === 1 ? '' : 's'}. Nothing uploaded.`] : []),
    ...failures,
  ].join(' ');

/** Source preview with explicit in/out points and track-targeted ripple insertion. */
export function SourceMonitor({
  asset,
  onInsert,
}: {
  asset?: Asset;
  onInsert: (track: Track, offset: number, duration: number) => void;
}) {
  const [sourceUrl, setSourceUrl] = useState(() => asset?.url);
  const [track, setTrack] = useState<Track>(asset?.kind === 'audio' ? 'voice' : 'screen');
  const [range, setRange] = useState(() => ({ start: 0, end: asset?.duration ?? 0 }));
  const [preview, setPreview] = useState({ playing: false, time: 0, error: '' });
  const video = useRef<HTMLVideoElement>(null);
  if (asset?.url !== sourceUrl) {
    setSourceUrl(asset?.url);
    setRange({ start: 0, end: asset?.duration ?? 0 });
    setTrack(asset?.kind === 'audio' ? 'voice' : 'screen');
    setPreview({ playing: false, time: 0, error: '' });
  }
  return (
    <section className="source-panel">
      <div className="monitor-title">
        <span>Source</span>
        <span className="muted-text">{asset?.kind === 'audio' ? 'AUDIO' : 'ORIGINAL'}</span>
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
                  if (!video.current) return;
                  if (video.current.paused)
                    void video.current.play().catch(() =>
                      setPreview((p) => ({
                        ...p,
                        error: 'Source playback failed. Try a supported codec.',
                      })),
                    );
                  else video.current.pause();
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
        ) : asset ? (
          <div className="source-audio">
            <Waveform peaks={asset.peaks} />
            <audio src={asset.url} controls />
          </div>
        ) : (
          <span className="empty-preview">Import a video or audio file</span>
        )}
      </div>
      <div className="source-description">
        <span title={asset?.name}>{asset?.name ?? 'No source selected'}</span>
        <span>{asset ? timecode(asset.duration) : '00:00:00'}</span>
      </div>
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
      <div className="source-insert">
        <select
          aria-label="Insert onto track"
          value={track}
          onChange={(e) => {
            const value = TRACKS.find((t) => t.id === e.target.value);
            if (value) setTrack(value.id);
          }}
        >
          {TRACKS.filter(
            (t) => asset?.kind !== 'audio' || t.id === 'voice' || t.id === 'music',
          ).map((t) => (
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
    <aside className="inspector">
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
  const [message, setMessage] = useState('Ready for your next story.');
  const [help, setHelp] = useState(false);
  const [markingZoomId, setMarkingZoomId] = useState<string | null>(null);
  const [exportWidth, setExportWidth] = useState<1920 | 3840>(1920);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const exportAbort = useRef<AbortController | null>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const player = useRef<PlayerRef>(null);
  const assetsRef = useRef<Asset[]>([]);
  const frameRef = useRef(0);
  const duration = Math.max(1, ...edit.clips.map((c) => c.start + c.duration));
  const asset = assets.find((a) => a.id === sourceId);
  const selectedZoom = edit.zooms.find((z) => z.id === selected);
  // Marking belongs to one zoom, so it ends by itself when that zoom is removed, undone or deselected.
  const markingMouse = markingZoomId !== null && selectedZoom?.id === markingZoomId;
  const screenMask = maskRect('screen', edit.layout); // → stage rect the mouse target covers
  const selectedClip = edit.clips.find((c) => c.id === selected);
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
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  const change = useCallback(
    (next: Edit) => {
      setHistory((previous) => [...previous.slice(-49), edit]);
      setEdit({ ...next, zooms: resolveZooms(next.zooms, next.clips, assets, next.layout) });
    },
    [edit, assets],
  );
  // ponytail: history keeps 50 steps, so undoing all of a longer session reads as saved.
  // Add a saved marker to the edit itself if that ever costs someone work.
  const unsaved = history.length > 0 && edit !== savedEdit;
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
  const split = useCallback(() => {
    const next = splitClip(edit.clips, selected, frameRef.current);
    if (next.length === edit.clips.length) {
      setMessage('Place the playhead inside a selected clip to split it.');
      return;
    }
    change({ ...edit, clips: next });
    setMessage('Split clip. Source timing preserved.');
  }, [edit, selected, change]);
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
  useEffect(() => {
    if (speed > 0) {
      player.current?.play();
      return;
    }
    player.current?.pause();
    if (speed === 0) return;
    // Browsers cannot play media backwards. Rewind seeks video silently at 30fps.
    let last = performance.now();
    let remainder = 0;
    let animation: number;
    const tick = (now: number) => {
      remainder += ((now - last) / 1000) * FPS * Math.abs(speed);
      last = now;
      const steps = Math.floor(remainder);
      remainder -= steps;
      if (steps) {
        const target = Math.max(0, frameRef.current - steps);
        frameRef.current = target;
        player.current?.seekTo(target);
        setFrame(target);
        if (!target) {
          setSpeed(0);
          return;
        }
      }
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
  }, [speed]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (help || busy || exportProgress !== null || markingMouse) return;
      if (
        event.target instanceof HTMLElement &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) ||
          event.target.isContentEditable)
      )
        return;
      const key = event.key.toLowerCase();
      if (event.metaKey || event.ctrlKey || event.altKey) {
        // Chords belong to the browser. Undo is the only one the editor takes; there is no redo.
        if (key === 'z' && !event.altKey && !event.shiftKey) {
          event.preventDefault();
          undo();
        }
        return;
      }
      if (['j', 'k', 'l', ' ', 'arrowleft', 'arrowright', 's', 'delete', 'backspace'].includes(key))
        event.preventDefault();
      if (key === 'j') setSpeed((s) => (s < 0 ? Math.max(-4, s * 2) : -1));
      if (key === 'k') setSpeed(0);
      if (key === 'l') {
        if (frameRef.current >= duration - 1) seek(0);
        setSpeed((s) => (s > 0 ? Math.min(4, s * 2) : 1));
      }
      if (key === ' ') setSpeed((s) => (s ? 0 : 1));
      if (key === 'arrowleft') seek(frameRef.current - 1);
      if (key === 'arrowright') seek(frameRef.current + 1);
      if (key === 's') split();
      if (key === 'delete' || key === 'backspace') removeSelected();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [duration, seek, split, removeSelected, undo, help, busy, exportProgress, markingMouse]);

  const addZoom = () => {
    if (duration < ZOOM_LIMITS.minFrames) {
      setMessage('Add at least six frames before creating a zoom.');
      return;
    }
    const start = Math.min(frameRef.current, duration - ZOOM_LIMITS.minFrames);
    const length = Math.min(120, duration - start);
    const zoom = { id: crypto.randomUUID(), start, duration: length, scale: 1.8, x: 50, y: 50 };
    if (zoomsOverlap(edit.zooms, zoom)) {
      setMessage('Zooms cannot overlap. Choose another time or edit the existing zoom.');
      return;
    }
    change({ ...edit, zooms: [...edit.zooms, zoom] });
    setSelected(zoom.id);
    setMessage('Zoom added. Adjust its timing and focus in the inspector.');
  };
  const importFiles = async (files: FileList) => {
    setBusy(true);
    let count = 0;
    const failures: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const imported = await readMedia(file, file.name);
        setAssets((previous) => [...previous, imported]);
        setSourceId(imported.id);
        count++;
      } catch (error) {
        failures.push(
          `Could not import ${file.name}. ${error instanceof Error ? error.message : 'Unsupported file.'}`,
        );
      }
    }
    // One message after the loop, so a success cannot overwrite the failures before them.
    const summary = importSummary(count, failures);
    if (summary) setMessage(summary);
    setBusy(false);
  };
  const insert = useCallback(
    (track: Track, offset: number, length: number) => {
      if (!asset) return;
      if ((track === 'voice' || track === 'music') && !asset.hasAudio) {
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
      change({ ...edit, clips: insertClip(edit.clips, clip, frameRef.current) });
      setSelected(clip.id);
      setMessage(`Inserted ${asset.name} onto ${TRACKS.find((t) => t.id === track)?.label}.`);
    },
    [asset, edit, change],
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
      downloadBlob(
        await serializeProject(edit, assets, muted),
        'developer-walkthrough.clipper.json',
      );
      setSavedEdit(edit);
      setMessage('Portable project saved with source media included. No relinking needed.');
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
      }
      validateSources(project.edit, imported);
      const previous = assets;
      setAssets(imported);
      setEdit({
        ...project.edit,
        zooms: resolveZooms(project.edit.zooms, project.edit.clips, imported, project.edit.layout),
      });
      setMuted(project.muted);
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
  const exportVideo = async () => {
    setSpeed(0);
    setMarkingZoomId(null);
    setExportProgress(0);
    const controller = new AbortController();
    exportAbort.current = controller;
    try {
      const { renderVideo } = await import('./export');
      const blob = await renderVideo({
        ...edit,
        assets,
        muted,
        width: exportWidth,
        onProgress: setExportProgress,
        signal: controller.signal,
      });
      downloadBlob(
        blob,
        `developer-walkthrough-${exportWidth === 1920 ? '1080p' : '4k'}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`,
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
  const volume = Math.max(
    0,
    ...edit.clips
      .filter(
        (c) =>
          (c.track === 'voice' || c.track === 'music') &&
          !muted.includes(c.track) &&
          covers(c, frame),
      )
      .map(
        (c) =>
          (assets.find((a) => a.id === c.assetId)?.peaks[sourceFrame(c, frame)] ?? 0) *
          (c.track === 'music' ? 0.22 : 1),
      ),
  );

  const libraryView = useMemo(
    () => (
      <MediaLibrary
        assets={assets}
        selected={sourceId}
        onSelect={setSourceId}
        onImport={importFiles}
        busy={busy}
      />
    ),
    [assets, sourceId, busy],
  );
  const sourceView = useMemo(
    () => <SourceMonitor asset={asset} onInsert={insert} />,
    [asset, insert],
  );
  const playerView = useMemo(
    () => (
      <Player
        ref={player}
        component={Composition}
        inputProps={compositionProps}
        durationInFrames={duration}
        compositionWidth={STAGE.width}
        compositionHeight={STAGE.height}
        fps={FPS}
        playbackRate={Math.max(1, speed)}
        controls={false}
        clickToPlay={false}
        moveToBeginningWhenEnded={false}
        numberOfSharedAudioTags={8}
        style={{ width: '100%', aspectRatio: '16 / 9' }}
      />
    ),
    [compositionProps, duration, speed],
  );

  return (
    <main className="editor">
      <header className="app-header">
        <span className="brand">
          <span className="brand-mark">
            <Clapperboard size={20} />
          </span>
          clipper<span className="beta">LAB</span>
        </span>
        <div className="project-title">
          <h1>Developer walkthrough</h1>
          <span className="project-tag">LOCAL PROJECT</span>
        </div>
        <div className="header-actions">
          <span className="privacy">
            <span className="status-dot" /> On your device
          </span>
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
          <button
            className="save-button"
            onClick={() => void saveProject()}
            disabled={busy || exportProgress !== null}
          >
            <ArrowDownToLine size={14} /> Save project
          </button>
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
              onClick={() => void exportVideo()}
            >
              Export video
            </button>
          </div>
        </div>
      </header>
      <div className="workspace-bar">
        <span className="workspace-label">
          <span className="workspace-dot" /> EDIT WORKSPACE
        </span>
        <span>Make something worth watching.</span>
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
      <div className="workspace" inert={exportProgress !== null || busy}>
        {libraryView}
        <section className="editing-area">
          <div className="monitors">
            {sourceView}
            <section className="compose-panel">
              <div className="monitor-title">
                <span>
                  Composition <span className="active-pill">LIVE</span>
                </span>
                <span className="muted-text">
                  {STAGE.width} × {STAGE.height} <ChevronDown size={12} />
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
                      borderRadius: edit.layout.radius,
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
          <CursorControls
            key={asset?.id}
            asset={asset}
            onChange={(cursor) =>
              setAssets((previous) =>
                previous.map((source) =>
                  source.id === asset?.id ? { ...source, cursor } : source,
                ),
              )
            }
          />
          <div className="transport">
            <div className="transport-readout">
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
              <span className="playback-state" data-testid="transport-state">
                {speed > 0
                  ? `Playing · ${speed}×`
                  : speed < 0
                    ? `Rewinding · ${-speed}×`
                    : 'Paused'}
              </span>
            </div>
            <div
              className="audio-meter"
              aria-label={`Audio level ${Math.round(volume * 100)} percent`}
            >
              <span>L</span>
              {Array.from({ length: 12 }, (_, i) => (
                <i key={i} style={{ opacity: speed > 0 && volume * 12 > i ? 1 : 0.18 }} />
              ))}
              <span>R</span>
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
              <button
                className="text-button"
                aria-label="Split selected clip"
                onClick={split}
                disabled={!selectedClip}
              >
                <Scissors size={15} /> Split <kbd>S</kbd>
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
                onClick={addZoom}
              >
                <ZoomIn size={15} /> Add zoom
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
            muted={muted}
            onMute={(track) =>
              setMuted((previous) =>
                previous.includes(track)
                  ? previous.filter((t) => t !== track)
                  : [...previous, track],
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
          <AutoZoomControls
            edit={edit}
            assets={assets}
            onChange={(zooms) => change({ ...edit, zooms })}
          />
        </Inspector>
      </div>
      <footer className="app-footer">
        <span role="status">
          <span className="status-dot" /> {message}
        </span>
        <span>
          REMOTION × MEDIABUNNY <span className="footer-version">STEEL THREAD 0.1</span>
        </span>
      </footer>
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
          ['Space', 'Play / pause'],
          ['← / →', 'Step one frame'],
          ['S', 'Split selected clip at playhead'],
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
