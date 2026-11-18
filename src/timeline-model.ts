/** A track's stable ID. Its kind, role and gain come from the edit's track registry. */
export type Track = string;
/** Where a visual track paints: the full stage beneath everything, or one of the two masks. */
export type VisualRole = 'background' | 'screen' | 'camera';
/** One registry entry. Visual tracks are listed back to front, audio tracks in A order. */
export type TrackDef =
  | { id: Track; label: string; kind: 'visual'; role: VisualRole }
  | { id: Track; label: string; kind: 'audio'; gain: number };
export type Clip = {
  id: string;
  assetId: string;
  track: Track;
  start: number;
  duration: number;
  offset: number;
  originId?: string;
};
export type Zoom = {
  id: string;
  start: number;
  duration: number;
  scale: number;
  x: number;
  y: number;
  follow?: 'focused' | 'smooth';
  instant?: boolean;
  /** How the ramp eases; without one it eases on the Smooth curve. */
  curve?: ZoomCurve;
};
/** A ramp's cubic-bezier control points `[x1, y1, x2, y2]`, each 0..1, like CSS `cubic-bezier()`. */
export type ZoomCurve = [number, number, number, number];
/** The Inspector's named ramp curves. Smooth is exactly the smoothstep every zoom had before. */
export const ZOOM_CURVES = {
  Smooth: [1 / 3, 0, 2 / 3, 1],
  'Ease in': [0.42, 0, 1, 1],
  'Ease out': [0, 0, 0.58, 1],
  'S-curve': [0.65, 0, 0.35, 1],
  'Fast then settle': [0.16, 1, 0.3, 1],
} satisfies Record<string, ZoomCurve>;
export const FPS = 30;
/** No clip or zoom may end later than this: 24 hours of timeline. */
export const MAX_FRAMES = 24 * 60 * 60 * FPS;

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

/** A named point on the timeline, listed in order and never two at one frame. */
export type Chapter = { frame: number; title: string };
export const MAX_CHAPTER_TITLE = 200;
/** The selection ID of the chapter at a frame, in the namespace clips and zooms share. */
export const chapterId = (chapter: Chapter) => `chapter-${chapter.frame}`;
/**
 * The chapters with one added at `frame`, in order. Titled "Chapter N", N the first count past the
 * number of chapters that no other chapter already carries. Null when one already sits there.
 */
export function addChapter(chapters: Chapter[], frame: number): Chapter[] | null {
  if (chapters.some((chapter) => chapter.frame === frame)) return null;
  let n = chapters.length + 1;
  while (chapters.some((chapter) => chapter.title === `Chapter ${n}`)) n++;
  return [...chapters, { frame, title: `Chapter ${n}` }].sort((a, b) => a.frame - b.frame);
}

/** The chapters without the one at `frame`. */
export function removeChapter(chapters: Chapter[], frame: number): Chapter[] {
  return chapters.filter((chapter) => chapter.frame !== frame);
}

/** The chapters with the title at `frame` replaced by `title`, trimmed and cut to 200 characters. */
export function retitleChapter(chapters: Chapter[], frame: number, title: string): Chapter[] {
  return chapters.map((chapter) =>
    chapter.frame === frame
      ? { ...chapter, title: title.trim().slice(0, MAX_CHAPTER_TITLE) }
      : chapter,
  );
}

/** The chapters a sequence of `duration` frames shows: those past its end stay in the file. */
export function shownChapters(chapters: Chapter[], duration: number): Chapter[] {
  return chapters.filter((chapter) => chapter.frame < duration);
}

/**
 * The shown chapters as a YouTube-style list, one `mm:ss Title` per line. The first chapter must
 * start at 00:00 there, so a list that does not begins with `00:00 Start`. Empty without chapters.
 */
export function chapterList(chapters: Chapter[], duration: number): string {
  const shown = shownChapters(chapters, duration);
  if (!shown.length) return '';
  const lines = shown.map((chapter) => `${clock(chapter.frame)} ${chapter.title}`);
  return (shown[0].frame === 0 ? lines : [`${clock(0)} Start`, ...lines]).join('\n');
}

// Music's linear amplitude in playback and export.
const MUSIC_GAIN = 0.22;
/** The four lanes every project had before the registry, and every version 2 or 3 file opens with. */
export const DEFAULT_TRACKS: TrackDef[] = [
  { id: 'screen', label: 'Screen recording', kind: 'visual', role: 'screen' },
  { id: 'camera', label: 'Talking head', kind: 'visual', role: 'camera' },
  { id: 'voice', label: 'Voiceover', kind: 'audio', gain: 1 },
  { id: 'music', label: 'Music', kind: 'audio', gain: MUSIC_GAIN },
];
/** What a creation target makes: a full-frame background, a masked screen, or an audio track. */
export type NewTrack = 'background' | 'screen' | 'audio';
const NEW_LABELS = { background: 'Background', screen: 'Screen', audio: 'Audio' };
const NEW_SUFFIX = { background: ' · Full frame', screen: ' · Masked', audio: '' };
/** Limits every zoom obeys, whether drawn in the inspector, opened from a file or generated. */
export const ZOOM_LIMITS = { minFrames: 6, minScale: 1, maxScale: 3 };

/** Whether a clip or zoom is live at a timeline frame. */
export function covers(span: { start: number; duration: number }, frame: number): boolean {
  return frame >= span.start && frame < span.start + span.duration;
}

/** Source frame a clip shows at a timeline frame; unchanged by splits and left trims. */
export function sourceFrame(clip: Clip, frame: number): number {
  return clip.offset + frame - clip.start;
}

/** Split at a timeline frame, preserving the original source offsets. */
export function splitClip(clips: Clip[], id: string, frame: number): Clip[] {
  // A ripple insert moves clips, so an earlier split may already own `${id}-${frame}`.
  const taken = new Set(clips.map((clip) => clip.id));
  let rightId = `${id}-${frame}`;
  for (let n = 2; taken.has(rightId); n++) rightId = `${id}-${frame}.${n}`;
  return clips.flatMap((clip) => {
    if (clip.id !== id || frame <= clip.start || frame >= clip.start + clip.duration) return [clip];
    const elapsed = frame - clip.start;
    return [
      { ...clip, originId: clip.originId ?? clip.id, duration: elapsed },
      {
        ...clip,
        originId: clip.originId ?? clip.id,
        id: rightId,
        start: frame,
        duration: clip.duration - elapsed,
        offset: clip.offset + elapsed,
      },
    ];
  });
}

/**
 * Cut every clip `target` accepts that strictly crosses a frame, as one new clip list. Returns the
 * same list when nothing crosses, so a boundary or gap is no edit.
 */
export function splitWhere(clips: Clip[], frame: number, target: (clip: Clip) => boolean): Clip[] {
  return clips
    .filter((c) => target(c) && c.start < frame && frame < c.start + c.duration)
    .reduce((next, c) => splitClip(next, c.id, frame), clips);
}

/** First locked track whose clips differ between two clip lists, regardless of their order. */
export function lockedChange(before: Clip[], after: Clip[], locked: Track[]): Track | undefined {
  const lane = (clips: Clip[], track: Track) =>
    JSON.stringify(clips.filter((c) => c.track === track).sort((a, b) => a.id.localeCompare(b.id)));
  return locked.find((track) => lane(before, track) !== lane(after, track));
}

/** The nearest target within `radius` frames, the first listed one on a tie, else the frame. */
export function snapFrame(frame: number, targets: number[], radius: number): number {
  const near = targets.filter((t) => Math.abs(t - frame) <= radius);
  return near.reduce(
    (best, t) => (Math.abs(t - frame) < Math.abs(best - frame) ? t : best),
    near[0] ?? frame,
  );
}

/** Insert on one track and ripple only that track's later material. */
export function insertClip(clips: Clip[], clip: Clip, frame: number): Clip[] {
  const crossing = clips.find(
    (c) => c.track === clip.track && c.start < frame && c.start + c.duration > frame,
  );
  const divided = crossing ? splitClip(clips, crossing.id, frame) : clips;
  return [
    ...divided.map((c) =>
      c.track === clip.track && c.start >= frame ? { ...c, start: c.start + clip.duration } : c,
    ),
    { ...clip, start: frame },
  ];
}

/** Whether a zoom's span collides with another zoom's; a zoom never collides with itself. */
export function zoomsOverlap(
  zooms: Zoom[],
  candidate: Pick<Zoom, 'id' | 'start' | 'duration'>,
): boolean {
  return zooms.some(
    (zoom) =>
      zoom.id !== candidate.id &&
      candidate.start < zoom.start + zoom.duration &&
      candidate.start + candidate.duration > zoom.start,
  );
}

// A cubic-bezier curve's progress at `x`, 0..1; its x(u) only rises, so bisection finds u.
function curveAt([x1, y1, x2, y2]: ZoomCurve, x: number): number {
  if (x <= 0 || x >= 1) return x <= 0 ? 0 : 1;
  const at = (a: number, b: number, u: number) =>
    3 * a * u * (1 - u) ** 2 + 3 * b * u * u * (1 - u) + u ** 3;
  let [lo, hi] = [0, 1];
  for (let i = 0; i < 40; i++)
    [lo, hi] = at(x1, x2, (lo + hi) / 2) < x ? [(lo + hi) / 2, hi] : [lo, (lo + hi) / 2];
  return at(y1, y2, (lo + hi) / 2);
}

/**
 * Evaluate the eased zoom scale at an absolute composition frame. The ramp out is the ramp in
 * played backwards.
 */
export function zoomAt(zooms: Zoom[], frame: number): number {
  const zoom = zooms.find((z) => covers(z, frame));
  if (!zoom) return 1;
  if (zoom.instant) return zoom.scale;
  const ramp = Math.min(24, zoom.duration / 2);
  const t = Math.min(1, (frame - zoom.start) / ramp, (zoom.start + zoom.duration - frame) / ramp);
  // A zoom without a curve keeps the exact smoothstep it always had.
  const eased = zoom.curve ? curveAt(zoom.curve, t) : t * t * (3 - 2 * t);
  return 1 + (zoom.scale - 1) * eased;
}

/** The timeline frames a clip's edges may reach: `start` for its left edge, `end` for its right. */
export type TrimBounds = { start: number; end: number };

/**
 * How far a clip's edges can move: the head or tail of its source, frame 0 and the 24-hour cap. A
 * still has no `sourceFrames`. Neighbours do not stop an edge; the trim overwrites them on release.
 */
export function trimBounds(clip: Clip, sourceFrames?: number): TrimBounds {
  // A still has no source time to run out of, so only a clip with a source length has a head.
  const head = sourceFrames === undefined ? 0 : clip.start - clip.offset; // → frame the source begins
  return {
    start: Math.max(0, head),
    end: Math.min(MAX_FRAMES, head + (sourceFrames ?? Infinity)),
  };
}

/**
 * Put `placed` into `items` and overwrite what it lands on among the items `onLane` accepts: an
 * item it covers goes, one it overlaps loses that part, and one it lands inside splits in two, the
 * right piece under a fresh unique ID. Touching edges are untouched, and a remnant shorter than
 * `minFrames` goes. An item with `placed`'s ID is replaced where it sits; otherwise `placed` is
 * appended. `piece` finishes each remnant from the item it came from, like a clip's source offset.
 */
export function overwrite<T extends { id: string; start: number; duration: number }>(
  items: T[],
  placed: T,
  onLane: (item: T) => boolean,
  minFrames: number,
  piece: (remnant: T, from: T) => T = (remnant) => remnant,
): T[] {
  const end = placed.start + placed.duration;
  const taken = new Set(items.map((item) => item.id));
  // A split's right piece takes `${id}-${frame}`, or the next free `.n` after it.
  const fresh = (id: string) => {
    let next = `${id}-${end}`;
    for (let n = 2; taken.has(next); n++) next = `${id}-${end}.${n}`;
    taken.add(next);
    return next;
  };
  const cut = (item: T): T[] => {
    const itemEnd = item.start + item.duration;
    if (!onLane(item) || item.start >= end || itemEnd <= placed.start) return [item];
    const left = { ...item, duration: placed.start - item.start }; // → T before `placed`
    const right = { ...item, start: end, duration: itemEnd - end }; // → T after `placed`
    const kept = [left, right].filter((p) => p.duration >= minFrames); // → T[] long enough
    if (kept.length === 2) right.id = fresh(item.id);
    return kept.map((p) => piece(p, item));
  };
  const next = items.flatMap((item) => (item.id === placed.id ? [placed] : cut(item)));
  return items.some((item) => item.id === placed.id) ? next : [...next, placed];
}

/**
 * Finish a clip remnant left by `overwrite`: it keeps the source frames it showed, and a split's
 * right piece remembers the clip it came from.
 */
export function clipPiece(piece: Clip, from: Clip): Clip {
  return {
    ...piece,
    offset: from.offset + piece.start - from.start,
    ...(piece.id !== from.id && { originId: from.originId ?? from.id }),
  };
}

/** Move a clip edge by a timeline delta, within `bounds` and leaving at least one frame. */
export function trimClip(
  clip: Clip,
  edge: 'left' | 'right',
  delta: number,
  bounds: TrimBounds,
): Clip {
  const end = clip.start + clip.duration;
  if (edge === 'right')
    return {
      ...clip,
      duration:
        Math.max(clip.start + 1, Math.min(bounds.end, Math.round(end + delta))) - clip.start,
    };
  const start = Math.min(end - 1, Math.max(bounds.start, Math.round(clip.start + delta)));
  return {
    ...clip,
    start,
    offset: Math.max(0, clip.offset + start - clip.start),
    duration: end - start,
  };
}

/**
 * The clip X selects at `frame`: one on a selected track if any lies under the playhead, else the
 * topmost video clip there. Undefined over a gap, and when only audio sits under the playhead.
 */
export function clipAt(
  clips: Clip[],
  tracks: TrackDef[],
  selectedTracks: Track[],
  frame: number,
): Clip | undefined {
  const live = clips.filter((clip) => covers(clip, frame));
  const onTrack = (id: Track) => live.find((clip) => clip.track === id);
  const chosen = tracks.find((t) => selectedTracks.includes(t.id) && onTrack(t.id));
  if (chosen) return onTrack(chosen.id);
  // Visual tracks paint back to front, so the last one with a clip is on top.
  return paintOrder(tracks)
    .map((t) => onTrack(t.id))
    .reverse()
    .find(Boolean);
}

/**
 * The clip with its start (`[`) or end (`]`) moved to `frame`: the clip then begins at the
 * playhead, or ends just before it, as a split there would. Undefined unless `frame` is inside the
 * clip, so a playhead outside it, or on its first frame, changes nothing. An inward trim cannot
 * reach the source or timeline limits, so none is passed.
 */
export function trimTo(clip: Clip, edge: 'left' | 'right', frame: number): Clip | undefined {
  if (frame <= clip.start || frame >= clip.start + clip.duration) return undefined;
  const from = edge === 'left' ? clip.start : clip.start + clip.duration;
  return trimClip(clip, edge, frame - from, { start: 0, end: MAX_FRAMES });
}

/**
 * The edit point `step` away from `frame` (-1 before it, 1 after): a start or end of a clip on an
 * unlocked track, frame 0, or the last frame. Undefined when there is none that way. A locked
 * track's edges are not edit points, though its clips still set the sequence's length.
 */
export function editPoint(
  clips: Clip[],
  locked: Track[],
  duration: number,
  frame: number,
  step: 1 | -1,
): number | undefined {
  const edges = clips.filter((clip) => !locked.includes(clip.track));
  const points = [0, duration, ...edges.flatMap((clip) => [clip.start, clip.start + clip.duration])]
    .map((point) => Math.min(point, duration - 1)) // the playhead's last stop is the last frame
    .filter((point) => (step > 0 ? point > frame : point < frame));
  return points.length ? (step > 0 ? Math.min(...points) : Math.max(...points)) : undefined;
}

/** Round gaps, in seconds, a ruler mark may sit apart. */
const RULER_STEPS = [
  1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400, 43200, 86400,
];
/** Closest two ruler marks may sit, and most a ruler carries. */
const RULER_GAP_PIXELS = 64;
const RULER_MAX_MARKS = 9;
/**
 * The mark cap counts marks over the whole sequence, so zoomed in it leaves one mark for hundreds of
 * pixels and a viewport can hold none. Past `RULER_SPARSE_PIXELS` between marks the cap is waived and
 * the ruler refines, to the smallest step at least `RULER_REFINED_PIXELS` apart. The refined steps
 * include sub-second ones, in frames that divide a second so every whole second keeps its mark.
 */
const RULER_SPARSE_PIXELS = 320;
const RULER_REFINED_PIXELS = 160;
const RULER_FRAME_STEPS = [1, 2, 3, 5, 10, 15];
/** A last mark nearer the end than this is dropped: its label would overhang the ruler padding. */
const RULER_END_PIXELS = 20;

/**
 * The frames a ruler labels: from frame 0 at the smallest round step that keeps the marks
 * `RULER_GAP_PIXELS` apart and at most `RULER_MAX_MARKS` of them, so no two labels read alike. Zoomed
 * in far enough that the marks would be sparse, the step refines to frames instead.
 * @param duration Sequence length in frames.
 * @param scale Timeline pixels per second.
 */
export function rulerMarks(duration: number, scale: number): number[] {
  const step =
    RULER_STEPS.find(
      (seconds) =>
        seconds * scale >= RULER_GAP_PIXELS && duration / (seconds * FPS) < RULER_MAX_MARKS,
    ) ?? RULER_STEPS.at(-1)!; // → seconds between marks
  const sparse = step * scale > RULER_SPARSE_PIXELS;
  const frames = sparse
    ? [...RULER_FRAME_STEPS, ...RULER_STEPS.map((seconds) => seconds * FPS)].find(
        (candidate) => (candidate / FPS) * scale >= RULER_REFINED_PIXELS,
      )! // → frames between marks; the whole-second step above always qualifies
    : step * FPS;
  const marks = Array.from({ length: Math.floor(duration / frames) + 1 }, (_, i) => i * frames);
  // The wider h:mm:ss labels overhang the ruler padding at fit scale and make the timeline
  // scroll, so a last mark that is not the end and sits close to it is left out.
  return marks.filter(
    (mark, i) => !i || mark === duration || ((duration - mark) / FPS) * scale >= RULER_END_PIXELS,
  );
}

/** Camera translation percentages center a manually marked mouse position during the zoom hold. */
export function zoomCamera(zooms: Zoom[], frame: number): { scale: number; x: number; y: number } {
  const zoom = zooms.find((z) => covers(z, frame));
  const scale = zoomAt(zooms, frame);
  if (!zoom || scale === 1) return { scale: 1, x: 0, y: 0 };
  const weight = (scale - 1) / (zoom.scale - 1);
  return { scale, x: (50 - zoom.x) * scale * weight, y: (50 - zoom.y) * scale * weight };
}

/** Display number: visual tracks count V1 upward from the back, audio tracks A1 downward. */
export function trackNumber(tracks: TrackDef[], id: Track): string {
  const track = tracks.find((t) => t.id === id);
  if (!track) return '';
  const kin = tracks.filter((t) => t.kind === track.kind);
  return `${track.kind === 'visual' ? 'V' : 'A'}${kin.indexOf(track) + 1}`;
}

/**
 * A new unlocked track with a fresh random ID: a background goes beneath every visual track, a
 * masked screen in front of them, and audio after the last audio track.
 */
export function createTrack(tracks: TrackDef[], kind: NewTrack): { tracks: TrackDef[]; id: Track } {
  const id = `${kind}-${crypto.randomUUID().slice(0, 8)}`;
  const count = tracks.filter((t) =>
    kind === 'audio' ? t.kind === 'audio' : t.kind === 'visual' && t.role === kind,
  ).length;
  const label = `${NEW_LABELS[kind]}${count ? ` ${count + 1}` : ''}${NEW_SUFFIX[kind]}`;
  const track: TrackDef =
    kind === 'audio'
      ? { id, label, kind: 'audio', gain: 1 }
      : { id, label, kind: 'visual', role: kind };
  const at = {
    background: 0,
    screen: tracks.map((t) => t.kind).lastIndexOf('visual') + 1,
    audio: tracks.length,
  }[kind];
  return { tracks: [...tracks.slice(0, at), track, ...tracks.slice(at)], id };
}

/**
 * Swap a track with its nearest neighbour of the same kind, toward the front (+1) or back (-1).
 * Returns the same list at either end.
 */
export function moveTrack(tracks: TrackDef[], id: Track, step: 1 | -1): TrackDef[] {
  const from = tracks.findIndex((t) => t.id === id);
  const kin = tracks.map((t, i) => (t.kind === tracks[from]?.kind ? i : -1)).filter((i) => i >= 0);
  const to = kin[kin.indexOf(from) + step];
  if (from < 0 || to === undefined) return tracks;
  const next = [...tracks];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/**
 * Visual tracks in paint order, back to front. Only the lowest screen and camera track paints its
 * role's empty mask, so a masked track stacked above another never hides it.
 */
export function paintOrder(
  tracks: TrackDef[],
): { id: Track; role: VisualRole; placeholder: boolean }[] {
  const visual = tracks.flatMap((t) => (t.kind === 'visual' ? [t] : []));
  return visual.map(({ id, role }) => ({
    id,
    role,
    placeholder: role !== 'background' && visual.find((t) => t.role === role)?.id === id,
  }));
}

/** Where a pool drop or keyboard placement goes: an existing track, or a track it creates. */
export type DropTarget = { track: Track } | { create: NewTrack };

/**
 * Place a whole source at a frame, overwriting what it lands on: an existing track must take the
 * source's kind; a creation target makes a track of the source's kind, so audio always makes audio
 * and video never makes audio. A refusal names the track and the reason.
 */
export function placeMedia(
  tracks: TrackDef[],
  clips: Clip[],
  media: { assetId: string; audio: boolean; duration: number },
  target: DropTarget,
  frame: number,
):
  | { tracks: TrackDef[]; clips: Clip[]; clip: Clip }
  | { refused: string; reason: 'missing' | 'kind' | 'occupied' } {
  const created =
    'create' in target
      ? createTrack(
          tracks,
          media.audio ? 'audio' : target.create === 'audio' ? 'screen' : target.create,
        )
      : { tracks, id: target.track };
  const track = created.tracks.find((t) => t.id === created.id);
  if (!track) return { refused: 'That track no longer exists.', reason: 'missing' };
  if ((track.kind === 'audio') !== media.audio)
    return {
      refused: `${track.label} takes ${media.audio ? 'video or still' : 'audio'} media.`,
      reason: 'kind',
    };
  const clip: Clip = {
    id: crypto.randomUUID(),
    assetId: media.assetId,
    track: track.id,
    start: Math.max(0, Math.round(frame)),
    duration: media.duration,
    offset: 0,
  };
  // Save refuses an edit past the cap, so placement never reports success for one.
  if (clip.start + clip.duration > MAX_FRAMES)
    return { refused: 'That would pass the 24-hour timeline.', reason: 'occupied' };
  const placed = overwrite(clips, clip, (c) => c.track === clip.track, 1, clipPiece);
  return { tracks: created.tracks, clips: placed, clip };
}
