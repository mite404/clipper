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
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type HTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { bindDrag, createAutoScroll } from '@ui-sdk/core';
import { stillAt, type Asset } from './media';
import { AgentClip } from './clip-primitive';
import { moveZoom, resizeZoom } from './zoom-generation';
import {
  FPS,
  MAX_FRAMES,
  gainFactor,
  maxTimelineScale,
  moveTrack,
  placeMedia,
  rulerMarks,
  snapFrame,
  chapterId,
  clock,
  timecode,
  trackNumber,
  trimBounds,
  trimClip,
  type Chapter,
  type Clip,
  type TrimBounds,
  type DropTarget,
  type NewTrack,
  type Track,
  type TrackDef,
  type Zoom,
} from './timeline-model';
import { ASSET_DRAG, IconButton, Waveform } from './components';

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
  clips: Clip[],
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
  return { state: 'ok', text: placeText(result, clips, target, at) };
}

// overwrite() keeps every untouched clip as it was and appends the new one, so any other change
// means the placement hit a clip.
const overwrites = (before: Clip[], after: Clip[]) =>
  after.length !== before.length + 1 || before.some((c, i) => c !== after[i]);

// A creation row names the track it would make, since a video on the audio row makes a screen.
function placeText(
  result: { tracks: TrackDef[]; clips: Clip[]; clip: Clip },
  clips: Clip[],
  target: DropTarget,
  at: number,
) {
  const where = `at ${(at / FPS).toFixed(1)} s`;
  if (!('create' in target))
    return `${overwrites(clips, result.clips) ? 'Overwrite' : 'Place'} ${where}`;
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
    const placed = placeMedia(registry, clips, drop.media, target, at); // → placement or refusal
    const next = dropHint(placed, clips, target, refuse, at);
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

// A clip body press: under DRAG_THRESHOLD it stays a click, which selects; past it, the clip
// follows in time and across the lanes `on.lane` finds, and Escape puts it back. A release where it
// started changes nothing, so it adds no undo step.
function dragClip(
  event: PointerEvent<HTMLElement>,
  clip: Clip,
  duration: number,
  on: {
    // False while Razor is armed or the clip's lane is locked: the press only clicks.
    held: boolean;
    lane: (x: number, y: number) => Track | undefined;
    select: () => void;
    preview: (clip?: Clip) => void;
    commit: (clip: Clip) => void;
  },
) {
  if (!on.held || event.button !== 0) return;
  const from = { x: event.clientX, width: event.currentTarget.parentElement!.clientWidth };
  let to = clip; // → Clip where a release would put it
  bindDrag(event.currentTarget, event.nativeEvent, {
    threshold: DRAG_THRESHOLD,
    cancelOnEscape: true,
    onStart: on.select,
    onMove: ({ x, y }) => {
      const at = Math.round(clip.start + ((x - from.x) / from.width) * duration); // → frame
      const start = Math.max(0, Math.min(MAX_FRAMES - clip.duration, at));
      to = { ...clip, start, track: on.lane(x, y) ?? to.track };
      on.preview(to);
    },
    onEnd: (_event, canceled) => {
      on.preview(undefined);
      // bindDrag ends a plain click too; only a drag that moved has a place to commit.
      if (!canceled && to !== clip) on.commit(to);
    },
  });
}

// What a press on a clip body tracks: where the pointer went down, since a Razor drag is not a
// click and never cuts; where a drag would land the clip, which draws there over what it
// overwrites; and a commit through the latest `onTrim` with the clip as it is at release, so a
// split, undo or delete made while the clip is held is never overwritten by a copy taken at the
// press.
function useClipPress(clips: Clip[], onTrim?: (clip: Clip) => void) {
  const pressX = useRef(0);
  const [move, preview] = useState<Clip>();
  const latest = useRef({ clips, onTrim });
  useLayoutEffect(() => {
    latest.current = { clips, onTrim };
  });
  const commit = ({ id, start, track }: Clip) => {
    const now = latest.current.clips.find((c) => c.id === id); // → Clip | undefined
    if (now) latest.current.onTrim?.({ ...now, start, track });
  };
  return { pressX, move, preview, commit };
}

// The clips with a dragged one swapped for where it would land.
const previewed = (clips: Clip[], move?: Clip) => clips.map((c) => (c.id === move?.id ? move : c));

// The unlocked lane of `kind` under a point, if any.
function laneAt(registry: TrackDef[], locked: Track[], x: number, y: number, kind: string) {
  const id = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-track]')?.dataset.track;
  return registry.find((t) => t.id === id && t.kind === kind && !locked.includes(t.id))?.id;
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
  const maxScale = maxTimelineScale(seconds, minScale);
  const scale = Math.max(minScale, Math.min(maxScale, chosenScale));
  if (scale !== chosenScale) setScale(scale);
  // Where the playhead sits in the viewport, in px, which a key step keeps through the new scale.
  const playheadAt = useRef<number | null>(null);
  const playheadX = () =>
    viewport.current!.querySelector('.playhead')!.getBoundingClientRect().left -
    viewport.current!.getBoundingClientRect().left;
  // One keyboard step of the display scale, √2 per step, clamped like the slider. The playhead
  // stays where it is on screen, or moves to the middle of the lanes when it was out of view.
  const zoom = (command: 1 | -1 | 'fit') => {
    // 'fit' is all the way out: one sequence exactly fills the viewport, the scale's own floor.
    const next =
      command === 'fit'
        ? minScale
        : Math.max(minScale, Math.min(maxScale, scale * Math.SQRT2 ** command));
    if (next === scale) return;
    const scroll = viewport.current!;
    const lanes =
      label.current!.getBoundingClientRect().right - scroll.getBoundingClientRect().left;
    const at = playheadX();
    playheadAt.current =
      at >= lanes && at <= scroll.clientWidth ? at : (lanes + scroll.clientWidth) / 2;
    setScale(next);
  };
  useLayoutEffect(() => {
    if (playheadAt.current === null) return;
    viewport.current!.scrollLeft += playheadX() - playheadAt.current;
    playheadAt.current = null;
  }, [scale]);
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
  // The ruler renders only the frames near the viewport, one viewport of margin each side, so a
  // frame-stepped ruler over a long sequence stays a handful of nodes.
  const [scrollLeft, setScrollLeft] = useState(0);
  useEffect(() => {
    const scroll = viewport.current!;
    const follow = () => setScrollLeft(scroll.scrollLeft);
    scroll.addEventListener('scroll', follow, { passive: true });
    return () => scroll.removeEventListener('scroll', follow);
  }, []);
  const visible = {
    from: Math.max(0, ((scrollLeft - dimensions.label - dimensions.width) / scale) * FPS),
    to: Math.min(
      seconds * FPS,
      ((scrollLeft - dimensions.label + 2 * dimensions.width) / scale) * FPS,
    ),
  };
  return {
    viewport,
    label,
    minScale,
    maxScale,
    scale,
    setScale,
    zoom,
    visible,
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

/** What a drag or key press may ask of a zoom: both land on a frame, and overwrite what they cover. */
export type ZoomEdits = {
  move: (id: string, start: number) => void;
  resize: (id: string, edge: 'left' | 'right', frame: number) => void;
};

// The state of an edge-grip drag on one zoom. A press follows the pointer past the threshold,
// previews the span the edge would leave, drawn over the zooms it will overwrite, and commits once
// on release; Escape or a taken-over pointer ends it with no commit.
function useEdgeDrag(
  zoom: Zoom,
  zooms: Zoom[],
  duration: number,
  onResize?: (id: string, edge: 'left' | 'right', frame: number) => void,
) {
  const [sized, setSized] = useState<Span>(); // → previewed span
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);
  const dragEdge = (edge: 'left' | 'right', grip: HTMLElement, down: globalThis.PointerEvent) => {
    const lane = grip.closest('.zoom-lane')!.getBoundingClientRect();
    const from = edge === 'left' ? zoom.start : zoom.start + zoom.duration; // → frame
    let wanted: number | undefined;
    stop.current = bindDrag(grip, down, {
      threshold: DRAG_THRESHOLD,
      cancelOnEscape: true,
      onMove: ({ x }) => {
        wanted = from + ((x - down.clientX) / lane.width) * duration;
        const kept = resizeZoom(zooms, zoom.id, edge, wanted, duration).find(
          (z) => z.id === zoom.id,
        )!;
        setSized({ start: kept.start, duration: kept.duration });
      },
      onEnd: (_event, canceled) => {
        setSized(undefined);
        if (!canceled && wanted !== undefined) onResize?.(zoom.id, edge, wanted);
      },
    });
  };
  return { sized, dragEdge };
}

type Span = { start: number; duration: number };

// The span a zoom is being dragged to: an edge-resize preview wins over a body-move preview.
const dragSpan = (zoom: Zoom, moved?: number, sized?: Span): Span | undefined =>
  sized ?? (moved === undefined ? undefined : { start: moved, duration: zoom.duration });

// A zoom block's inline geometry and cursor. A dragged zoom draws over the zooms it will overwrite.
function zoomStyle(zoom: Zoom, duration: number, span?: Span): CSSProperties {
  const { start, duration: length } = span ?? zoom;
  const style: CSSProperties = {
    left: `${(start / duration) * 100}%`,
    width: `${(length / duration) * 100}%`,
    cursor: 'grab',
    touchAction: 'none',
  };
  return span ? { ...style, cursor: 'grabbing', zIndex: 1 } : style;
}

// One edge grip of a zoom: a press selects it and a drag, or an arrow key (a frame, ten with
// Shift), moves that edge.
function ZoomGrip({
  edge,
  zoom,
  duration,
  dragEdge,
  onSelect,
  onResize,
}: {
  edge: 'left' | 'right';
  zoom: Zoom;
  duration: number;
  onSelect: (id: string) => void;
  dragEdge: (edge: 'left' | 'right', grip: HTMLElement, down: globalThis.PointerEvent) => void;
  onResize?: (id: string, edge: 'left' | 'right', frame: number) => void;
}) {
  const at = edge === 'left' ? zoom.start : zoom.start + zoom.duration; // → frame
  return (
    <span
      className={`zoom-grip ${edge}`}
      role="slider"
      tabIndex={0}
      aria-label={`Resize zoom ${edge} edge`}
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={at}
      onKeyDown={(event) => {
        const step = arrowStep(event);
        if (!step) return;
        event.preventDefault();
        event.stopPropagation();
        onResize?.(zoom.id, edge, at + step);
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        // The grip is its own drag: the body's move must not start under it. A drag swallows the
        // click that would select, so a press selects, as a clip's grip does.
        event.stopPropagation();
        onSelect(zoom.id);
        dragEdge(edge, event.currentTarget, event.nativeEvent);
      }}
    />
  );
}

// Trims the clip with this id, if it still exists, within its current bounds.
function trimById(
  {
    onTrim,
    clips,
    assets,
  }: { onTrim: ((clip: Clip) => void) | undefined; clips: Clip[]; assets: Asset[] },
  clipId: string,
  edge: 'left' | 'right',
  delta: number,
) {
  const clip = clips.find((c) => c.id === clipId);
  if (!clip) return;
  const asset = assets.find((a) => a.id === clip.assetId);
  commitTrim(onTrim, clip, edge, delta, trimBounds(clip, asset?.duration));
}

// Follows one primary-button press on a trim grip in frames, lane-relative so an edge scroll keeps
// the math. It previews each move, auto-scrolls near the viewport edges and commits on release;
// Escape and pointercancel commit nothing.
function followTrim(
  event: PointerEvent<HTMLElement>,
  duration: number,
  on: {
    start: () => void;
    preview: (delta: number) => void;
    clear: () => void;
    commit: (delta: number) => void;
  },
) {
  const lane = event.currentTarget.closest('.timeline-lane');
  if (event.button !== 0 || !lane) return;
  event.preventDefault();
  event.stopPropagation();
  on.start();
  const at = (x: number) => {
    const rect = lane.getBoundingClientRect();
    return ((x - rect.left) / rect.width) * duration;
  };
  const from = at(event.clientX);
  let x = event.clientX;
  const follow = () => on.preview(at(x) - from);
  const scroll = createAutoScroll({ edge: 40, speed: 14, onScroll: follow });
  on.preview(0);
  bindDrag(event.currentTarget, event.nativeEvent, {
    cancelOnEscape: true,
    onMove: (sample) => {
      x = sample.x;
      scroll.update(sample.x, sample.y);
      follow();
    },
    onEnd: (up, canceled) => {
      scroll.stop();
      on.clear();
      if (!canceled) on.commit(at(up.clientX) - from);
    },
  });
}

// One trim grip: arrows nudge its edge a frame, or ten with Shift, and a drag trims it.
function TrimGrip({
  clip,
  edge,
  bounds,
  duration,
  disabled,
  clips,
  assets,
  onTrim,
  onSelect,
  onPreview,
}: {
  clip: Clip;
  edge: 'left' | 'right';
  bounds: TrimBounds;
  duration: number;
  disabled: boolean;
  clips: Clip[];
  assets: Asset[];
  onTrim?: (clip: Clip) => void;
  onSelect: (id: string) => void;
  onPreview: (drag: { clipId: string; edge: 'left' | 'right'; delta: number } | undefined) => void;
}) {
  // A release trims the clip as the newest render has it, so a split, undo or delete made while
  // the grip is held is never overwritten by a copy taken at pointerdown.
  const latest = useRef({ onTrim, clips, assets });
  useLayoutEffect(() => {
    latest.current = { onTrim, clips, assets };
  });
  return (
    <span
      inert={disabled}
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
        const step = (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1);
        commitTrim(onTrim, clip, edge, step, bounds);
      }}
      onPointerDown={(event) =>
        followTrim(event, duration, {
          start: () => onSelect(clip.id),
          preview: (delta) => onPreview({ clipId: clip.id, edge, delta }),
          clear: () => onPreview(undefined),
          commit: (delta) => trimById(latest.current, clip.id, edge, delta),
        })
      }
    />
  );
}

// One zoom region: a click selects it, and a drag past the threshold or an arrow key moves it.
function ZoomBlock({
  zoom,
  zooms,
  duration,
  selected,
  onSelect,
  onMove,
  onResize,
}: {
  zoom: Zoom;
  zooms: Zoom[];
  duration: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove?: (id: string, start: number) => void;
  onResize?: (id: string, edge: 'left' | 'right', frame: number) => void;
}) {
  // The previewed start once a drag passes the threshold; release overwrites the zooms it covers.
  const [preview, setPreview] = useState<number>();
  // Ends the live drag without committing, for a lost pointer capture.
  const stopDrag = useRef<(() => void) | null>(null);
  const { sized, dragEdge } = useEdgeDrag(zoom, zooms, duration, onResize);
  return (
    <button
      aria-label="Select zoom"
      className={`zoom-block ${selected ? 'selected' : ''}`}
      style={zoomStyle(zoom, duration, dragSpan(zoom, preview, sized))}
      onClick={() => onSelect(zoom.id)}
      onKeyDown={(event) => {
        const step = arrowStep(event);
        if (!step) return;
        event.preventDefault();
        event.stopPropagation();
        onMove?.(zoom.id, zoom.start + step);
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        // Safari does not focus a clicked button; keyboard moves continue from the dragged block.
        event.currentTarget.focus({ preventScroll: true });
        const x = event.clientX;
        const width = event.currentTarget.parentElement!.getBoundingClientRect().width;
        let moved: number | undefined;
        stopDrag.current = bindDrag(event.currentTarget, event.nativeEvent, {
          threshold: DRAG_THRESHOLD,
          cancelOnEscape: true,
          onMove: (sample) => {
            const wanted = zoom.start + ((sample.x - x) / width) * duration; // → frame
            const kept = moveZoom(zooms, zoom.id, wanted, duration); // → zooms with this one moved
            moved = kept.find((z) => z.id === zoom.id)!.start;
            setPreview(moved);
          },
          // A drag swallows its click, so it selects the block itself, as the click did.
          onEnd: (_up, canceled) => {
            stopDrag.current = null;
            setPreview(undefined);
            if (moved === undefined) return;
            if (!canceled) onMove?.(zoom.id, moved);
            onSelect(zoom.id);
          },
        });
      }}
      onLostPointerCapture={() => {
        stopDrag.current?.();
        stopDrag.current = null;
        setPreview(undefined);
      }}
    >
      <ZoomIn size={12} />
      <span>{zoom.scale.toFixed(1)}× zoom</span>
      {(['left', 'right'] as const).map((edge) => (
        <ZoomGrip
          key={edge}
          edge={edge}
          zoom={zoom}
          duration={duration}
          dragEdge={dragEdge}
          onSelect={onSelect}
          onResize={onResize}
        />
      ))}
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
  onResize,
}: {
  zooms: Zoom[];
  duration: number;
  selected: string;
  onSelect: (id: string) => void;
  onMove?: (id: string, start: number) => void;
  onResize?: (id: string, edge: 'left' | 'right', frame: number) => void;
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
          onResize={onResize}
        />
      ))}
      {!zooms.length && <span className="lane-hint">Add a zoom to bring the details closer</span>}
    </div>
  );
}

/** What the Razor tool does; both are absent while it is not armed. */
type Razor = {
  cut?: (clipId: string, frame: number) => void;
  /** The pointer is over a cuttable frame, which the playhead follows. */
  hover?: (frame: number) => void;
};
const NO_RAZOR: Razor = {};

// The chapters as flags on the ruler: a press seeks to one and selects it.
function ChapterFlags({
  chapters = [],
  selected,
  duration,
  onSeek,
  onSelect,
}: {
  chapters?: Chapter[];
  selected: string;
  duration: number;
  onSeek: (frame: number) => void;
  onSelect: (id: string) => void;
}) {
  return chapters.map((chapter) => (
    <button
      key={chapter.frame}
      type="button"
      className="chapter-flag"
      aria-label={`Chapter ${chapter.title} at ${timecode(chapter.frame)}`}
      aria-pressed={selected === chapterId(chapter)}
      title={`${chapter.title} · ${timecode(chapter.frame)}`}
      style={{ left: `${(chapter.frame / duration) * 100}%` }}
      onClick={() => {
        onSeek(chapter.frame);
        onSelect(chapterId(chapter));
      }}
    />
  ));
}

// The source frame at a video region's in-point, at one fixed size under its title band. Until
// that frame decodes it shows the frame it showed before, so a trim never flashes empty.
function ClipStill({ asset, frame }: { asset: Asset; frame: number }) {
  const [decoded, setDecoded] = useState(asset.thumbnail);
  useEffect(() => {
    if (asset.kind !== 'video' || !asset.url) return;
    let live = true;
    void stillAt(asset, frame).then((url) => live && setDecoded(url));
    return () => {
      live = false;
    };
  }, [asset, frame]);
  return (
    <img className="clip-still" src={asset.kind === 'video' ? decoded : asset.thumbnail} alt="" />
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
  razor = NO_RAZOR,
  drop,
  zoomEdits,
  zoomRef,
  chapters,
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
  razor?: Razor;
  /** The pool drag in progress, so lanes can say whether they would take it. */
  drop?: PoolDrag;
  /** Move a zoom, or one of its edges, to a timeline frame; it overwrites the zooms it covers. */
  zoomEdits?: ZoomEdits;
  /** Filled with the keyboard scale step while clips exist, for the editor's `-` and `=` keys. */
  zoomRef?: { current: ((command: 1 | -1 | 'fit') => void) | null };
  /** The chapters inside the sequence, drawn as flags on the ruler. */
  chapters?: Chapter[];
}) {
  const { registry, tracks, onToggleTrack, onMoveTrack } = headers;
  const { cut: onRazor, hover: onRazorHover } = razor;
  const seconds = duration / FPS;
  const { viewport, label, minScale, maxScale, scale, setScale, zoom, visible, width } =
    useTimelineScale(seconds);
  const zoomable = clips.length > 0;
  useLayoutEffect(() => {
    if (!zoomRef) return;
    zoomRef.current = zoomable ? zoom : null;
    return () => {
      zoomRef.current = null;
    };
  });
  // A drag names its clip by ID and trims the clip as it is now, so a split, undo or delete made
  // while a grip is held is never overwritten by a copy taken at pointerdown.
  const [drag, setDrag] = useState<{ clipId: string; edge: 'left' | 'right'; delta: number }>();
  const { pressX, move, preview, commit } = useClipPress(clips, onTrim);
  const shown = previewed(clips, move); // → Clip[] with a dragged clip where it would land
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
          data-track={id}
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
          {shown
            .filter((c) => c.track === id)
            .map((originalClip) => {
              const asset = assets.find((a) => a.id === originalClip.assetId);
              // A still has no source length to run out of; asset.duration is in frames.
              const bounds = trimBounds(originalClip, asset?.duration); // → TrimBounds
              const clip =
                drag?.clipId === originalClip.id
                  ? trimClip(originalClip, drag.edge, drag.delta, bounds)
                  : originalClip;
              return (
                <AgentClip
                  key={clip.id}
                  clipId={clip.id}
                  track={clip.track}
                  start={clip.start}
                  duration={clip.duration}
                  offset={clip.offset}
                  className={`timeline-clip ${selected === clip.id ? 'selected' : ''}`}
                  aria-label={`${asset?.name ?? 'Missing media'} at ${(clip.start / FPS).toFixed(1)} seconds`}
                  aria-pressed={selected === clip.id}
                  onPointerDown={(event) => {
                    pressX.current = event.clientX;
                    dragClip(event, clip, duration, {
                      held: !onRazor && !tracks.locked.includes(id),
                      lane: (x, y) => laneAt(registry, tracks.locked, x, y, track.kind),
                      select: () => onSelect(clip.id),
                      preview,
                      commit,
                    });
                  }}
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
                    <span className="clip-name">{asset?.name ?? 'Missing media'}</span>
                    <span className="clip-length">{clock(clip.duration)}</span>
                  </span>
                  {audio ? (
                    <Waveform
                      peaks={asset?.peaks ?? []}
                      offset={clip.offset}
                      duration={clip.duration}
                      gain={gainFactor(clip.gain)}
                      progress={(frame - clip.start) / clip.duration}
                    />
                  ) : (
                    // A start-trim drag keeps the committed frame; release swaps it once.
                    asset?.thumbnail && <ClipStill asset={asset} frame={originalClip.offset} />
                  )}
                  {!tracks.locked.includes(id) &&
                    (['left', 'right'] as const).map((edge) => (
                      <TrimGrip
                        key={edge}
                        clip={clip}
                        edge={edge}
                        bounds={bounds}
                        duration={duration}
                        disabled={!!onRazor}
                        clips={clips}
                        assets={assets}
                        onTrim={onTrim}
                        onSelect={onSelect}
                        onPreview={setDrag}
                      />
                    ))}
                </AgentClip>
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
          </div>
          <div className="ruler">
            {rulerMarks(duration, scale, visible).map((mark) => (
              <span
                key={mark}
                data-end={mark === duration || undefined}
                style={{ left: `${(mark / duration) * 100}%` }}
              >
                {mark % FPS ? timecode(mark) : clock(mark)}
              </span>
            ))}
            <ChapterFlags
              chapters={chapters}
              selected={selected}
              duration={duration}
              onSeek={onSeek}
              onSelect={onSelect}
            />
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
            onMove={zoomEdits?.move}
            onResize={zoomEdits?.resize}
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
