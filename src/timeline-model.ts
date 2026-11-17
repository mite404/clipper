export type Track = 'screen' | 'camera' | 'voice' | 'music';
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
  source?: { assetId: string; clipId: string; start: number; x: number; y: number };
};
export const FPS = 30;
/** Music's linear amplitude in playback and export. */
export const MUSIC_GAIN = 0.22;
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

/** The nearest target within `radius` frames, the earlier target on a tie, else the frame. */
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

/** Shorten a clip edge by a timeline delta, preserving at least one source frame. */
export function trimClip(clip: Clip, edge: 'left' | 'right', delta: number): Clip {
  const removed = Math.min(
    clip.duration - 1,
    Math.max(0, Math.round(edge === 'left' ? delta : -delta)),
  );
  return edge === 'left'
    ? {
        ...clip,
        start: clip.start + removed,
        offset: clip.offset + removed,
        duration: clip.duration - removed,
      }
    : { ...clip, duration: clip.duration - removed };
}

/** Camera translation percentages center a manually marked mouse position during the zoom hold. */
export function zoomCamera(zooms: Zoom[], frame: number): { scale: number; x: number; y: number } {
  const zoom = zooms.find((z) => covers(z, frame));
  const scale = zoomAt(zooms, frame);
  if (!zoom || scale === 1) return { scale: 1, x: 0, y: 0 };
  const weight = (scale - 1) / (zoom.scale - 1);
  return { scale, x: (50 - zoom.x) * scale * weight, y: (50 - zoom.y) * scale * weight };
}
