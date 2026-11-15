export type Track = 'screen' | 'camera' | 'voice' | 'music';
export type Clip = {
  id: string;
  assetId: string;
  track: Track;
  start: number;
  duration: number;
  offset: number;
};
export type Zoom = {
  id: string;
  start: number;
  duration: number;
  scale: number;
  x: number;
  y: number;
};
export const FPS = 30;

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
      { ...clip, duration: elapsed },
      {
        ...clip,
        id: rightId,
        start: frame,
        duration: clip.duration - elapsed,
        offset: clip.offset + elapsed,
      },
    ];
  });
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

/** Evaluate the eased zoom scale at an absolute composition frame. */
export function zoomAt(zooms: Zoom[], frame: number): number {
  const zoom = zooms.find((z) => frame >= z.start && frame < z.start + z.duration);
  if (!zoom) return 1;
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
  const zoom = zooms.find((z) => frame >= z.start && frame < z.start + z.duration);
  const scale = zoomAt(zooms, frame);
  if (!zoom || scale === 1) return { scale: 1, x: 0, y: 0 };
  const weight = (scale - 1) / (zoom.scale - 1);
  return { scale, x: (50 - zoom.x) * scale * weight, y: (50 - zoom.y) * scale * weight };
}
