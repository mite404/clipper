import type { Asset } from './media';
import type { CursorSample } from './cursor';
import { FPS, ZOOM_LIMITS, zoomsOverlap, type Clip, type Zoom } from './timeline';
import { coverRect, cropPosition, maskRect, type Layout } from './stage';

type Activity = { start: number; end: number; x: number; y: number };
const LEAD_FRAMES = 12;

function presses(samples: CursorSample[]): CursorSample[] {
  const result: CursorSample[] = [];
  let held: CursorSample | undefined;
  for (const sample of samples) {
    if (sample.interactionType === 'mouseup') held = undefined;
    if (sample.interactionType !== 'click') continue;
    // Engineering default for duplicate OpenScreen downs: only a release starts a new press.
    if (held) continue;
    result.push(sample);
    held = sample;
  }
  return result;
}

function clickActivity(samples: CursorSample[]): CursorSample[] {
  const lastRelease = samples.reduce(
    (last, sample) => (sample.interactionType === 'mouseup' ? sample.timeMs : last),
    -1,
  );
  const end = samples.at(-1)?.timeMs ?? 0;
  // Engineering heuristic, not a capture guarantee: a terminal unpaired click may be Stop.
  // Only omit clicks in the final 250 ms without any later release; retain interior activity.
  return presses(samples).filter(
    (sample) => sample.timeMs <= lastRelease || sample.timeMs < end - 250,
  );
}

function activity(clip: Clip, asset: Asset, hold: number): Activity[] {
  const cursor = asset.cursor;
  if (!cursor) return [];
  const shots: Activity[] = [];
  for (const sample of clickActivity(cursor.recording.samples)) {
    if (sample.visible === false) continue;
    const frame = Math.round(((sample.timeMs + cursor.offsetMs) * FPS) / 1000);
    if (frame < clip.offset || frame >= clip.offset + clip.duration) continue;
    const start = Math.max(clip.offset, frame - LEAD_FRAMES);
    const end = Math.min(clip.offset + clip.duration, frame + hold);
    const previous = shots.at(-1);
    if (previous && start <= previous.end) previous.end = Math.max(previous.end, end);
    else shots.push({ start, end, x: sample.cx, y: sample.cy });
  }
  return shots;
}

function focus(source: NonNullable<Zoom['source']>, asset: Asset, layout: Layout) {
  const mask = maskRect('screen', layout);
  const cover = coverRect(mask, asset, cropPosition('screen', layout));
  return {
    x: Math.max(0, Math.min(100, ((cover.x + source.x * cover.width) / mask.width) * 100)),
    y: Math.max(0, Math.min(100, ((cover.y + source.y * cover.height) / mask.height) * 100)),
  };
}

function sourcePieces(zoom: Zoom, clips: Clip[], assets: Asset[], layout: Layout): Zoom[] {
  const source = zoom.source;
  const asset = assets.find((item) => item.id === source?.assetId);
  if (!source || !asset) return [];
  const pieces: Zoom[] = [];
  const matching = clips.filter(
    (clip) =>
      clip.track === 'screen' &&
      clip.assetId === source.assetId &&
      (clip.originId ?? clip.id) === source.clipId,
  );
  for (const clip of matching) {
    const start = Math.max(source.start, clip.offset);
    const end = Math.min(source.start + zoom.duration, clip.offset + clip.duration);
    if (end - start < ZOOM_LIMITS.minFrames) continue;
    pieces.push({
      ...zoom,
      id: pieces.length ? `${zoom.id}/${clip.id}` : zoom.id,
      start: clip.start + start - clip.offset,
      duration: end - start,
      ...focus(source, asset, layout),
      source: { ...source, start },
    });
  }
  return pieces;
}

function nonOverlapping(manual: Zoom[], generated: Zoom[], clips: Clip[]): Zoom[] {
  const result = [...manual];
  const ids = new Set([...clips.map((clip) => clip.id), ...manual.map((zoom) => zoom.id)]);
  for (const zoom of generated.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id))) {
    let id = zoom.id;
    for (let suffix = 2; ids.has(id); suffix++) id = `${zoom.id}.${suffix}`;
    const candidate = { ...zoom, id };
    if (zoomsOverlap(result, candidate)) continue;
    result.push(candidate);
    ids.add(id);
  }
  return result;
}

/** Generate editable shots from click activity without replacing manual zooms. */
export function generateZooms(
  clips: Clip[],
  assets: Asset[],
  layout: Layout,
  existing: Zoom[],
  scale = 1.8,
  holdFrames = 90,
): Zoom[] {
  const manual = existing.filter((zoom) => !zoom.source);
  const generated = clips.flatMap((clip) => {
    const asset = assets.find((item) => item.id === clip.assetId);
    if (clip.track !== 'screen' || !asset) return [];
    return activity(clip, asset, Math.max(ZOOM_LIMITS.minFrames, Math.round(holdFrames))).map(
      (shot): Zoom => ({
        id: `auto-${clip.id}-${shot.start}`,
        start: clip.start + shot.start - clip.offset,
        duration: shot.end - shot.start,
        scale: Math.max(ZOOM_LIMITS.minScale, Math.min(ZOOM_LIMITS.maxScale, scale)),
        x: 50,
        y: 50,
        follow: 'focused',
        source: {
          assetId: asset.id,
          clipId: clip.originId ?? clip.id,
          start: shot.start,
          x: shot.x,
          y: shot.y,
        },
      }),
    );
  });
  return resolveZooms([...manual, ...generated], clips, assets, layout);
}

/** Resolve source-anchored shots once per edit, retaining manual timeline zooms. */
export function resolveZooms(
  zooms: Zoom[],
  clips: Clip[],
  assets: Asset[],
  layout: Layout,
): Zoom[] {
  return nonOverlapping(
    zooms.filter((zoom) => !zoom.source),
    zooms.flatMap((zoom) => sourcePieces(zoom, clips, assets, layout)),
    clips,
  );
}
