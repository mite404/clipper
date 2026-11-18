import {
  Camera,
  ChevronDown,
  ChevronUp,
  Film,
  Image,
  Lock,
  LockOpen,
  Mic,
  Music2,
  Square,
  SquareCheckBig,
  Volume2,
  VolumeX,
  ZoomIn,
} from 'lucide-react';
import {
  createElement,
  memo,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import type { Asset } from './media';
import { moveZoom } from './zoom-generation';
import {
  FPS,
  moveTrack,
  placeMedia,
  rulerMarks,
  snapFrame,
  trackNumber,
  trimBounds,
  trimClip,
  type Clip,
  type TrimBounds,
  type DropTarget,
  type NewTrack,
  type Track,
  type TrackDef,
  type Zoom,
} from './timeline-model';
import { ASSET_DRAG, IconButton, Waveform, clock } from './components';

/** Per-track toggle lists a project saves. */
export type TrackToggles = Record<'muted' | 'locked' | 'selected', Track[]>;
/** What the track headers need: the edit's ordered tracks, their saved toggles and their actions. */
export type TrackHeaders = {
  /** Rows and V/A numbers follow the registry. */
  registry: TrackDef[];
  /** Saved per-track toggles: muted audio, locked lanes, and Split's selected tracks. */
  tracks: TrackToggles;
  onToggleTrack: (list: keyof TrackToggles, track: Track) => void;
  onMoveTrack: (id: Track, step: 1 | -1) => void;
};

// Header icons by role; audio keeps the voiceover microphone and the music note it always had.
const ICONS = { background: Image, screen: Film, camera: Camera };
const icon = (track: TrackDef) =>
  track.kind === 'visual' ? ICONS[track.role] : track.id === 'voice' ? Mic : Music2;

// Rows list visual tracks frontmost first, then audio tracks in order.
const visualRows = (tracks: TrackDef[]) => tracks.filter((t) => t.kind === 'visual').reverse();
const audioRows = (tracks: TrackDef[]) => tracks.filter((t) => t.kind === 'audio');
// Creation rows: a masked screen in front of the visual tracks, a background beneath them, audio
// after the audio tracks.
export const CREATE: Record<NewTrack, string> = {
  screen: 'New screen track · Masked',
  background: 'New V1 background · Full frame',
  audio: 'New audio track',
};

/** A pool drag in progress: the source as placement needs it, and where a release goes. */
export type PoolDrag = {
  media: { assetId: string; audio: boolean; duration: number };
  /** A pool item released on a lane or creation row, at the frame under the pointer. */
  onDrop: (assetId: string, target: DropTarget, frame: number) => void;
};

// Name, number, toggles and order controls of one track. Up means toward the top of the list,
// which is toward the front for visual tracks. Memoized: playback re-renders the timeline every
// few frames, and each header's tooltipped buttons cost more script than the rest of a row.
const TrackHeader = memo(function TrackHeader({
  track,
  registry,
  tracks,
  onToggleTrack,
  onMoveTrack,
}: {
  track: TrackDef;
  registry: TrackDef[];
  tracks: TrackToggles;
  onToggleTrack: (list: keyof TrackToggles, track: Track) => void;
  onMoveTrack: (id: Track, step: 1 | -1) => void;
}) {
  const { id, label } = track;
  const up = UP[track.kind];
  const muted = tracks.muted.includes(id);
  // A move that reaches the end disables its own button, so focus goes to the other one.
  const toggles = useRef<HTMLSpanElement>(null);
  // Directions to refocus after a move, the pressed one first.
  const moved = useRef<string[]>([]);
  useLayoutEffect(() => {
    const enabled = moved.current
      .map((d) => toggles.current!.querySelector<HTMLElement>(`[data-move="${d}"]:enabled`))
      .find(Boolean);
    moved.current = [];
    enabled?.focus();
  }, [registry]);
  return (
    <div className="track-label">
      <span className="track-code">{trackNumber(registry, id)}</span>
      {createElement(icon(track), { size: 14 })}
      <span>{label}</span>
      <span className="track-toggles" ref={toggles}>
        {TOGGLES.map(({ list, name, icons }) => {
          const pressed = tracks[list].includes(id);
          const Shown = icons[Number(pressed)];
          return (
            <IconButton
              key={list}
              label={name(label)}
              aria-pressed={pressed}
              onClick={() => onToggleTrack(list, id)}
            >
              <Shown size={13} />
            </IconButton>
          );
        })}
        {track.kind === 'audio' && (
          <IconButton
            label={`${muted ? 'Unmute' : 'Mute'} ${label}`}
            onClick={() => onToggleTrack('muted', id)}
          >
            {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </IconButton>
        )}
        {MOVES.map(({ direction, sign, Icon }) => {
          const step = (sign * up) as 1 | -1;
          return (
            <IconButton
              key={direction}
              label={`Move ${label} ${direction}`}
              data-move={direction}
              disabled={moveTrack(registry, id, step) === registry}
              onClick={() => {
                moved.current = direction === 'up' ? ['up', 'down'] : ['down', 'up'];
                onMoveTrack(id, step);
              }}
            >
              <Icon size={13} />
            </IconButton>
          );
        })}
      </span>
    </div>
  );
});

// What a lane says while a pool item is over it: why it would refuse, or where it would land.
function dropHint(
  result: ReturnType<typeof placeMedia>,
  target: DropTarget,
  locked: boolean,
  at: number,
) {
  if ('refused' in result)
    return {
      state: result.reason === 'kind' ? 'incompatible' : result.reason,
      text: result.refused,
    };
  if (locked) return { state: 'locked', text: 'Locked' };
  return { state: 'ok', text: placeText(result, target, at) };
}

// A creation row names the track it would make, since a video on the audio row makes a screen.
function placeText(result: { tracks: TrackDef[]; clip: Clip }, target: DropTarget, at: number) {
  const where = `at ${(at / FPS).toFixed(1)} s`;
  if (!('create' in target)) return `Place ${where}`;
  const made = result.tracks.find((t) => t.id === result.clip.track)!;
  return `New ${made.kind === 'audio' ? 'audio' : made.role} track ${where}`;
}

// A lane or creation row that takes pool drops. While a pool item is over it, it says why it
// would refuse or where the item would land; each zone owns its hint, so leaving one lane never
// clears the next one's.
function DropZone({
  drop,
  target,
  registry,
  clips,
  locked,
  duration,
  children,
  ...rest
}: {
  drop?: PoolDrag;
  target: DropTarget;
  registry: TrackDef[];
  clips: Clip[];
  locked: Track[];
  duration: number;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const [hint, setHint] = useState<{ state: string; text: string }>();
  // A hint outlives an Escape or outside drop that never left the zone, so only a drag shows it.
  const shown = drop && hint;
  const over = (event: DragEvent<HTMLDivElement>) => {
    if (!drop || !event.dataTransfer.types.includes(ASSET_DRAG)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    const at = dropFrame(event, duration);
    const refuse = 'track' in target && locked.includes(target.track);
    const next = dropHint(placeMedia(registry, clips, drop.media, target, at), target, refuse, at);
    setHint((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  };
  return (
    <div
      {...rest}
      data-drop={shown ? shown.state : undefined}
      onDragEnter={over}
      onDragOver={over}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHint(undefined);
      }}
      onDrop={(event) => {
        const assetId = event.dataTransfer.getData(ASSET_DRAG);
        if (!drop || !assetId) return;
        event.preventDefault();
        setHint(undefined);
        drop.onDrop(assetId, target, dropFrame(event, duration));
      }}
    >
      {children}
      {shown && <span className="drop-hint">{shown.text}</span>}
    </div>
  );
}

// The frame under the pointer in a lane, never before the start.
function dropFrame(event: DragEvent<HTMLElement>, duration: number): number {
  const rect = event.currentTarget.getBoundingClientRect();
  return Math.max(0, Math.floor(((event.clientX - rect.left) / rect.width) * duration));
}

// Razor snapping reaches this far on screen, to any clip edge on any track.
const SNAP_PIXELS = 8;
// Up is toward the front for visual tracks and toward the end of the list for audio ones.
const UP = { visual: 1, audio: -1 } as const;
// Order buttons, top to bottom; a visual track's up is a step toward the front.
const MOVES = [
  { direction: 'up', sign: 1, Icon: ChevronUp },
  { direction: 'down', sign: -1, Icon: ChevronDown },
] as const;
// Header toggles draw an off icon and an on icon, so an unpressed one never looks pressed.
const TOGGLES = [
  {
    list: 'selected',
    name: (label: string) => `Select ${label} track`,
    icons: [Square, SquareCheckBig],
  },
  { list: 'locked', name: (label: string) => `Lock ${label}`, icons: [LockOpen, Lock] },
] as const;

// The frame Razor would cut at under the pointer, snapped to clip edges. Hover and click share it,
// so the playhead a hover leaves is the frame the click cuts.
function razorAt(event: MouseEvent<HTMLElement>, targets: number[], duration: number): number {
  const lane = event.currentTarget.parentElement!.getBoundingClientRect(); // → lane box in px
  const at = Math.round(((event.clientX - lane.left) / lane.width) * duration); // → frame
  return snapFrame(at, targets, (SNAP_PIXELS / lane.width) * duration);
}

// The frame a still Razor click cuts at; null for a keyboard press or a pointer drag, which
// select the clip as the Selection tool does.
function razorFrame(
  event: MouseEvent<HTMLElement>,
  pressX: number,
  targets: number[],
  duration: number,
): number | null {
  if (!event.detail || Math.abs(event.clientX - pressX) > SNAP_PIXELS / 2) return null;
  return razorAt(event, targets, duration);
}

// A pen or mouse hover over a cuttable frame of a clip reports that frame; touch, a clip edge and a
// gap report nothing.
function reportHoverCut(
  onHover: (frame: number) => void,
  event: PointerEvent<HTMLElement>,
  clip: Clip,
  targets: number[],
  duration: number,
): void {
  if (event.pointerType === 'touch') return;
  const at = razorAt(event, targets, duration); // → frame
  // Strictly inside the clip: at an edge a click is no cut.
  if (Math.min(at - clip.start, clip.start + clip.duration - at) > 0) onHover(at);
}

// The pointer-move handler of a clip. A locked lane takes no cut, so it does not move the playhead.
function hoverCut(
  onHover: ((frame: number) => void) | undefined,
  locked: boolean,
  clip: Clip,
  targets: number[],
  duration: number,
): (event: PointerEvent<HTMLElement>) => void {
  return (event) => {
    if (onHover && !locked) reportHoverCut(onHover, event, clip, targets, duration);
  };
}

// Report a trim only when it moved the edge: a plain click on a grip, or an arrow key into a limit,
// leaves the clip as it was and adds no undo step.
function commitTrim(
  onTrim: ((clip: Clip) => void) | undefined,
  clip: Clip,
  edge: 'left' | 'right',
  delta: number,
  bounds: TrimBounds,
): void {
  const next = trimClip(clip, edge, delta, bounds); // → Clip
  if (next.start !== clip.start || next.duration !== clip.duration) onTrim?.(next);
}

function useTimelineScale(seconds: number) {
  const viewport = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, label: 152 });
  const [chosenScale, setScale] = useState(40);
  const minScale = dimensions.width ? (dimensions.width - dimensions.label) / seconds : 20;
  const maxScale = minScale * 32;
  const scale = Math.max(minScale, Math.min(maxScale, chosenScale));
  if (scale !== chosenScale) setScale(scale);
  useLayoutEffect(() => {
    const scroll = viewport.current!;
    const heading = label.current!;
    const measure = () => {
      const style = getComputedStyle(scroll);
      const width =
        scroll.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const label = heading.getBoundingClientRect().width;
      setDimensions({ width, label });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    observer.observe(heading);
    return () => observer.disconnect();
  }, []);
  return {
    viewport,
    label,
    minScale,
    maxScale,
    scale,
    setScale,
    width: dimensions.label + seconds * scale,
  };
}

// Pixels a press may travel and still be a click that only selects.
const DRAG_THRESHOLD = 4;
const ARROWS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

// Frames an arrow key moves a zoom: one, or ten with Shift. Any other key, or an arrow with Alt,
// Ctrl or Meta held, gives zero and is left to the editor's shortcuts.
const arrowStep = (event: {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}) =>
  (ARROWS[event.key] ?? 0) *
  (event.shiftKey ? 10 : 1) *
  Number(![event.altKey, event.ctrlKey, event.metaKey].some(Boolean));

// One zoom region: a click selects it, and a drag past the threshold or an arrow key moves it.
function ZoomBlock({
  zoom,
  zooms,
  duration,
  selected,
  onSelect,
  onMove,
}: {
  zoom: Zoom;
  zooms: Zoom[];
  duration: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove?: (id: string, start: number) => void;
}) {
  // Where the press began and the lane width it maps over; null when no press is held.
  const press = useRef<{ x: number; width: number } | null>(null);
  // The previewed start once a drag passes the threshold, already kept in its free gap.
  const [preview, setPreview] = useState<number>();
  const cancel = () => {
    press.current = null;
    setPreview(undefined);
  };
  return (
    <button
      aria-label="Select zoom"
      className={`zoom-block ${selected ? 'selected' : ''}`}
      style={{
        left: `${((preview ?? zoom.start) / duration) * 100}%`,
        width: `${(zoom.duration / duration) * 100}%`,
        cursor: preview === undefined ? 'grab' : 'grabbing',
        touchAction: 'none',
      }}
      onClick={() => onSelect(zoom.id)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') return cancel();
        const step = arrowStep(event);
        if (!step) return;
        event.preventDefault();
        event.stopPropagation();
        onMove?.(zoom.id, zoom.start + step);
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        // Safari does not focus a clicked button, and Escape needs the block focused.
        event.currentTarget.focus({ preventScroll: true });
        const lane = event.currentTarget.parentElement!.getBoundingClientRect();
        press.current = { x: event.clientX, width: lane.width };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const held = press.current;
        if (!held) return;
        const dx = event.clientX - held.x;
        if (preview === undefined && Math.abs(dx) < DRAG_THRESHOLD) return;
        const wanted = zoom.start + (dx / held.width) * duration; // → frame
        const kept = moveZoom(zooms, zoom.id, wanted, duration); // → gap-clamped zooms
        setPreview(kept.find((z) => z.id === zoom.id)!.start);
      }}
      onPointerUp={() => {
        const moved = preview;
        cancel();
        if (moved !== undefined) onMove?.(zoom.id, moved);
      }}
      onLostPointerCapture={cancel}
    >
      <ZoomIn size={12} />
      <span>{zoom.scale.toFixed(1)}× zoom</span>
    </button>
  );
}

// The zoom row's lane: one block per zoom, or a hint while there are none.
function ZoomLane({
  zooms,
  duration,
  selected,
  onSelect,
  onMove,
}: {
  zooms: Zoom[];
  duration: number;
  selected: string;
  onSelect: (id: string) => void;
  onMove?: (id: string, start: number) => void;
}) {
  return (
    <div className="zoom-lane timeline-lane">
      {zooms.map((zoom) => (
        <ZoomBlock
          key={zoom.id}
          zoom={zoom}
          zooms={zooms}
          duration={duration}
          selected={selected === zoom.id}
          onSelect={onSelect}
          onMove={onMove}
        />
      ))}
      {!zooms.length && <span className="lane-hint">Add a zoom to bring the details closer</span>}
    </div>
  );
}

/** Multitrack timeline with a frame-accurate ruler and waveform playback highlighting. */
export function Timeline({
  clips,
  assets,
  zooms,
  frame,
  duration,
  selected,
  onSelect,
  onSeek,
  headers,
  onTrim,
  onRazor,
  onRazorHover,
  drop,
  onMoveZoom,
}: {
  clips: Clip[];
  assets: Asset[];
  zooms: Zoom[];
  frame: number;
  duration: number;
  selected: string;
  onSelect: (id: string) => void;
  onSeek: (frame: number) => void;
  headers: TrackHeaders;
  onTrim?: (clip: Clip) => void;
  /** Set while the Razor tool is active: clicks cut a clip at the clicked frame instead of
   * selecting it. */
  onRazor?: (clipId: string, frame: number) => void;
  /** Set with `onRazor`: the pointer is over a cuttable frame, which the playhead follows. */
  onRazorHover?: (frame: number) => void;
  /** The pool drag in progress, so lanes can say whether they would take it. */
  drop?: PoolDrag;
  /** Move a zoom to a timeline frame; the editor keeps it in its free gap. */
  onMoveZoom?: (id: string, start: number) => void;
}) {
  const { registry, tracks, onToggleTrack, onMoveTrack } = headers;
  const seconds = duration / FPS;
  const { viewport, label, minScale, maxScale, scale, setScale, width } = useTimelineScale(seconds);
  // A drag names its clip by ID and trims the clip as it is now, so a split, undo or delete made
  // while a grip is held is never overwritten by a copy taken at pointerdown.
  const [drag, setDrag] = useState<{
    clipId: string;
    edge: 'left' | 'right';
    x: number;
    width: number;
    delta: number;
  }>();
  // Where the pointer last went down: a Razor drag is not a click, so it never cuts.
  const pressX = useRef(0);
  const snapTargets = clips.flatMap((c) => [c.start, c.start + c.duration]);
  const zone = { drop, registry, clips, locked: tracks.locked, duration };
  const createRow = (kind: NewTrack) => (
    <div className="track-row create-row" key={`create-${kind}`}>
      <div className="track-label">
        <span title={CREATE[kind]}>{CREATE[kind]}</span>
      </div>
      <DropZone
        {...zone}
        target={{ create: kind }}
        className="timeline-lane create-lane"
        data-testid={`create-${kind}`}
        aria-label={`${CREATE[kind]}: drop a media pool item here`}
      >
        Drop to create
      </DropZone>
    </div>
  );
  const laneRow = (track: TrackDef) => {
    const { id } = track;
    const audio = track.kind === 'audio';
    return (
      <div className={`track-row track-${id}`} key={id}>
        <TrackHeader
          track={track}
          registry={registry}
          tracks={tracks}
          onToggleTrack={onToggleTrack}
          onMoveTrack={onMoveTrack}
        />
        <DropZone
          {...zone}
          target={{ track: id }}
          className="timeline-lane"
          data-tool={onRazor ? 'razor' : 'select'}
          data-locked={tracks.locked.includes(id)}
          data-testid={`track-${id}`}
          onDoubleClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            onSeek(
              Math.min(
                duration - 1,
                Math.max(0, Math.round(((event.clientX - rect.left) / rect.width) * duration)),
              ),
            );
          }}
        >
          {clips
            .filter((c) => c.track === id)
            .map((originalClip) => {
              const asset = assets.find((a) => a.id === originalClip.assetId);
              // A still has no source length to run out of; asset.duration is in frames.
              const bounds = trimBounds(clips, originalClip, asset?.duration); // → TrimBounds
              const clip =
                drag?.clipId === originalClip.id
                  ? trimClip(originalClip, drag.edge, drag.delta, bounds)
                  : originalClip;
              return (
                <button
                  key={clip.id}
                  className={`timeline-clip ${selected === clip.id ? 'selected' : ''}`}
                  aria-label={`${asset?.name ?? 'Missing media'} at ${(clip.start / FPS).toFixed(1)} seconds`}
                  aria-pressed={selected === clip.id}
                  onPointerDown={(event) => (pressX.current = event.clientX)}
                  onPointerMove={hoverCut(
                    onRazorHover,
                    tracks.locked.includes(id),
                    clip,
                    snapTargets,
                    duration,
                  )}
                  onClick={(event) => {
                    const at = onRazor
                      ? razorFrame(event, pressX.current, snapTargets, duration)
                      : null;
                    if (at === null) onSelect(clip.id);
                    else onRazor?.(clip.id, at);
                  }}
                  style={{
                    left: `${(clip.start / duration) * 100}%`,
                    width: `${(clip.duration / duration) * 100}%`,
                  }}
                >
                  <span className="clip-title">
                    {audio ? <Music2 size={12} /> : <Film size={12} />}
                    {asset?.name ?? 'Missing media'}
                  </span>
                  {audio ? (
                    <Waveform
                      peaks={asset?.peaks ?? []}
                      offset={clip.offset}
                      duration={clip.duration}
                      progress={(frame - clip.start) / clip.duration}
                    />
                  ) : (
                    <div className="filmstrip">
                      {Array.from(
                        {
                          length: Math.min(12, Math.max(1, Math.ceil(clip.duration / FPS / 2))),
                        },
                        (_, i) => (
                          <img key={i} src={asset?.thumbnail} alt="" />
                        ),
                      )}
                    </div>
                  )}
                  {!tracks.locked.includes(id) &&
                    (['left', 'right'] as const).map((edge) => (
                      <span
                        key={edge}
                        inert={!!onRazor}
                        className={`clip-grip ${edge}`}
                        role="slider"
                        tabIndex={0}
                        aria-label={`Trim ${edge} edge`}
                        aria-valuemin={0}
                        aria-valuemax={clip.start + clip.duration}
                        aria-valuenow={edge === 'left' ? clip.start : clip.start + clip.duration}
                        onKeyDown={(event) => {
                          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                          event.preventDefault();
                          event.stopPropagation();
                          commitTrim(
                            onTrim,
                            clip,
                            edge,
                            (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1),
                            bounds,
                          );
                        }}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          event.currentTarget.setPointerCapture(event.pointerId);
                          const lane = event.currentTarget.closest('.timeline-lane');
                          if (lane)
                            setDrag({
                              clipId: clip.id,
                              edge,
                              x: event.clientX,
                              width: lane.getBoundingClientRect().width,
                              delta: 0,
                            });
                          onSelect(clip.id);
                        }}
                        onPointerMove={(event) => {
                          if (drag)
                            setDrag({
                              ...drag,
                              delta: ((event.clientX - drag.x) / drag.width) * duration,
                            });
                        }}
                        onPointerUp={(event) => {
                          if (!drag) return;
                          setDrag(undefined);
                          // Pointer capture means this grip is the one the drag started on.
                          commitTrim(
                            onTrim,
                            originalClip,
                            drag.edge,
                            ((event.clientX - drag.x) / drag.width) * duration,
                            bounds,
                          );
                        }}
                        onPointerCancel={() => setDrag(undefined)}
                      />
                    ))}
                </button>
              );
            })}
        </DropZone>
      </div>
    );
  };
  return (
    <>
      <label className="timeline-scale">
        Timeline scale
        <input
          aria-label="Timeline scale"
          type="range"
          min={minScale}
          max={maxScale}
          step="any"
          value={scale}
          disabled={!clips.length}
          aria-valuetext={`${(scale / minScale).toFixed(1)} times fit`}
          onChange={(event) => setScale(Number(event.target.value))}
        />
        <output>{Number(scale.toFixed(2))} px/s</output>
      </label>
      <div
        className="timeline-scroll"
        ref={viewport}
        data-testid="timeline-scroll"
        tabIndex={0}
        role="region"
        aria-label="Scrollable timeline"
        onKeyDown={(event) => {
          if (
            event.target === event.currentTarget &&
            [
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'ArrowDown',
              'Home',
              'End',
              'PageUp',
              'PageDown',
            ].includes(event.key)
          )
            event.stopPropagation();
        }}
      >
        <div className="timeline-grid" style={{ width, minWidth: '100%' }}>
          <div className="ruler-label" ref={label}>
            <span>TRACKS</span>
            <span>30 FPS</span>
          </div>
          <div className="ruler">
            {rulerMarks(duration, scale).map((mark) => (
              <span
                key={mark}
                data-end={mark === duration || undefined}
                style={{ left: `${(mark / duration) * 100}%` }}
              >
                {clock(mark)}
              </span>
            ))}
            <div
              className="ruler-playhead"
              aria-hidden="true"
              style={{ left: `${(frame / duration) * 100}%` }}
            />
            <input
              aria-label="Timeline playhead"
              type="range"
              min="0"
              max={duration - 1}
              value={frame}
              // The native thumb's center travels from frame zero to the last frame, not duration.
              style={{ width: `calc(${((duration - 1) / duration) * 100}% + 12px)` }}
              onChange={(event) => onSeek(Number(event.target.value))}
            />
          </div>
          <div className="track-label zoom-label">
            <ZoomIn size={14} />
            <span>Zooms</span>
          </div>
          <ZoomLane
            zooms={zooms}
            duration={duration}
            selected={selected}
            onSelect={onSelect}
            onMove={onMoveZoom}
          />
          {createRow('screen')}
          {visualRows(registry).map(laneRow)}
          {createRow('background')}
          {audioRows(registry).map(laneRow)}
          {createRow('audio')}
          <div className="playhead-area">
            <div className="playhead" style={{ left: `${(frame / duration) * 100}%` }} />
          </div>
          <div className="timeline-end">
            {seconds.toFixed(1)} seconds · Stereo · Local workspace
          </div>
        </div>
      </div>
    </>
  );
}
