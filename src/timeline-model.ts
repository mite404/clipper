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
};
export const FPS = 30;
/** No clip or zoom may end later than this: 24 hours of timeline. */
export const MAX_FRAMES = 24 * 60 * 60 * FPS;
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

/** Evaluate the eased zoom scale at an absolute composition frame. */
export function zoomAt(zooms: Zoom[], frame: number): number {
  const zoom = zooms.find((z) => covers(z, frame));
  if (!zoom) return 1;
  if (zoom.instant) return zoom.scale;
  const ramp = Math.min(24, zoom.duration / 2);
  const t = Math.min(1, (frame - zoom.start) / ramp, (zoom.start + zoom.duration - frame) / ramp);
  const eased = t * t * (3 - 2 * t);
  return 1 + (zoom.scale - 1) * eased;
}

/** The timeline frames a clip's edges may reach: `start` for its left edge, `end` for its right. */
export type TrimBounds = { start: number; end: number };

/**
 * How far a clip's edges can move: no further than the nearest clip edge on its own track, the
 * head or tail of its source, frame 0 and the 24-hour cap. A still has no `sourceFrames`.
 */
export function trimBounds(clips: Clip[], clip: Clip, sourceFrames?: number): TrimBounds {
  const end = clip.start + clip.duration;
  const lane = clips.filter((c) => c.id !== clip.id && c.track === clip.track);
  // A still has no source time to run out of, so only a clip with a source length has a head.
  const head = sourceFrames === undefined ? 0 : clip.start - clip.offset; // → frame the source begins
  return {
    start: Math.max(
      0,
      head,
      ...lane.map((c) => c.start + c.duration).filter((edge) => edge <= clip.start),
    ),
    end: Math.min(
      MAX_FRAMES,
      head + (sourceFrames ?? Infinity),
      ...lane.map((c) => c.start).filter((edge) => edge >= end),
    ),
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

/** Round gaps, in seconds, a ruler mark may sit apart. */
const RULER_STEPS = [
  1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 14400, 43200, 86400,
];
/** Closest two ruler marks may sit, and most a ruler carries. */
const RULER_GAP_PIXELS = 64;
const RULER_MAX_MARKS = 9;

/**
 * The frames a ruler labels: whole seconds from frame 0 at the smallest round step that keeps the
 * marks `RULER_GAP_PIXELS` apart and at most `RULER_MAX_MARKS` of them, so no two labels read alike.
 * @param duration Sequence length in frames.
 * @param scale Timeline pixels per second.
 */
export function rulerMarks(duration: number, scale: number): number[] {
  const step =
    RULER_STEPS.find(
      (seconds) =>
        seconds * scale >= RULER_GAP_PIXELS && duration / (seconds * FPS) < RULER_MAX_MARKS,
    ) ?? RULER_STEPS.at(-1)!; // → seconds between marks
  return Array.from({ length: Math.floor(duration / (step * FPS)) + 1 }, (_, i) => i * step * FPS);
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

/** Add a clip only where its track has no clip overlapping it; touching edges are allowed. */
export function placeClip(clips: Clip[], clip: Clip): Clip[] | null {
  const occupied = clips.some(
    (c) =>
      c.track === clip.track &&
      c.start < clip.start + clip.duration &&
      clip.start < c.start + c.duration,
  );
  return occupied ? null : [...clips, clip];
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
 * Place a whole source at a frame without moving anything: an existing track must take the
 * source's kind and be free there; a creation target makes a track of the source's kind, so audio
 * always makes audio and video never makes audio. A refusal names the track and the reason.
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
  const placed = placeClip(clips, clip);
  if (!placed) return { refused: `${track.label} already has a clip there.`, reason: 'occupied' };
  return { tracks: created.tracks, clips: placed, clip };
}
