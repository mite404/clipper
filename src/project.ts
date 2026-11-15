import type { Layout } from './Composition';
import type { Asset } from './media';
import { FPS, type Clip, type Track, type Zoom } from './timeline';

export type Edit = { clips: Clip[]; zooms: Zoom[]; layout: Layout };

function object(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${field} must be an object.`);
  return value as Record<string, unknown>;
}

function array(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${field} must be an array.`);
  return value;
}

function string(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${field} must be a nonempty string.`);
  return value;
}

function number(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error(`${field} must be a finite number between ${min} and ${max}.`);
  return value;
}

function frame(value: unknown, field: string, min = 0): number {
  const result = number(value, field, min, Number.MAX_SAFE_INTEGER);
  if (!Number.isSafeInteger(result)) throw new Error(`${field} must be an integer frame.`);
  return result;
}

function track(value: unknown): Track {
  if (value !== 'screen' && value !== 'camera' && value !== 'voice' && value !== 'music')
    throw new Error('Unknown track. Expected screen, camera, voice, or music.');
  return value;
}

function unique(ids: string[], field: string) {
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${field} IDs.`);
}

function range(start: number, duration: number, field: string) {
  if (!Number.isSafeInteger(start + duration))
    throw new Error(`${field} range exceeds safe frames.`);
}

/** Validates the portable envelope, not media codecs or decoded source durations. */
export function parseProject(text: string): {
  edit: Edit;
  media: { id: string; name: string; data: string }[];
  muted: Track[];
} {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('Project is not valid JSON.');
  }
  const root = object(value, 'Project');
  if (root.version === 1)
    throw new Error(
      'Version 1 edit lists contain metadata only, not portable media. Save a version 2 project.',
    );
  if (root.version !== 2) throw new Error('Unsupported project version; expected version 2.');
  if (root.fps !== FPS) throw new Error(`Unsupported fps; expected ${FPS}.`);

  const media = array(root.media, 'media').map((entry, i) => {
    const item = object(entry, `media[${i}]`);
    const id = string(item.id, `media[${i}].id`);
    const name = string(item.name, `media[${i}].name`);
    const data = string(item.data, `media[${i}].data`);
    const match =
      /^data:(?:video\/[a-z0-9.+-]+|audio\/[a-z0-9.+-]+|application\/(?:octet-stream|ogg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
        data,
      );
    if (!match || match[1].length % 4 !== 0)
      throw new Error(`media[${i}].data must be a base64 audio/video data URL.`);
    try {
      if (btoa(atob(match[1])) !== match[1]) throw new Error('Noncanonical base64');
    } catch {
      throw new Error(`media[${i}].data contains invalid base64.`);
    }
    return { id, name, data };
  });
  unique(
    media.map((m) => m.id),
    'media',
  );
  const mediaIds = new Set(media.map((m) => m.id));

  const clips: Clip[] = array(root.clips, 'clips').map((entry, i) => {
    const item = object(entry, `clips[${i}]`);
    const id = string(item.id, `clips[${i}].id`);
    const assetId = string(item.assetId, `clips[${i}].assetId`);
    if (!mediaIds.has(assetId)) throw new Error(`Clip ${id} references missing media ${assetId}.`);
    const start = frame(item.start, `clips[${i}].start`);
    const duration = frame(item.duration, `clips[${i}].duration`, 1);
    const offset = frame(item.offset, `clips[${i}].offset`);
    range(start, duration, `Clip ${id} timeline`);
    range(offset, duration, `Clip ${id} source`);
    return { id, assetId, track: track(item.track), start, duration, offset };
  });
  unique(
    clips.map((c) => c.id),
    'clip',
  );

  const zooms: Zoom[] = array(root.zooms, 'zooms').map((entry, i) => {
    const item = object(entry, `zooms[${i}]`);
    const id = string(item.id, `zooms[${i}].id`);
    const start = frame(item.start, `zooms[${i}].start`);
    const duration = frame(item.duration, `zooms[${i}].duration`, 1);
    range(start, duration, `Zoom ${id}`);
    return {
      id,
      start,
      duration,
      scale: number(item.scale, `zooms[${i}].scale`, 1, 3),
      x: number(item.x, `zooms[${i}].x`, 0, 100),
      y: number(item.y, `zooms[${i}].y`, 0, 100),
    };
  });
  unique(
    zooms.map((z) => z.id),
    'zoom',
  );

  const settings = object(root.layout, 'layout');
  const layout: Layout = {
    radius: number(settings.radius, 'layout.radius', 0, 60),
    screenX: number(settings.screenX, 'layout.screenX', 0, 100),
    screenY: number(settings.screenY, 'layout.screenY', 0, 100),
    cameraX: number(settings.cameraX, 'layout.cameraX', 0, 100),
    cameraY: number(settings.cameraY, 'layout.cameraY', 0, 100),
  };
  if (settings.swapped !== undefined) {
    if (typeof settings.swapped !== 'boolean') throw new Error('layout.swapped must be boolean.');
    layout.swapped = settings.swapped;
  }
  const muted = array(root.muted, 'muted').map(track);
  unique(muted, 'muted track');
  return { edit: { clips, zooms, layout }, media, muted };
}

/** Run after readMedia has decoded every embedded asset, before replacing the open project. */
export function validateSources(edit: Edit, assets: Asset[]): void {
  unique(
    assets.map((asset) => asset.id),
    'media',
  );
  const sources = new Map(assets.map((asset) => [asset.id, asset]));
  for (const asset of assets) frame(asset.duration, `Media ${asset.name} duration`, 1);
  for (const clip of edit.clips) {
    const asset = sources.get(clip.assetId);
    if (!asset) throw new Error(`Clip ${clip.id} references missing media ${clip.assetId}.`);
    frame(clip.offset, `Clip ${clip.id} offset`);
    frame(clip.duration, `Clip ${clip.id} duration`, 1);
    if (clip.offset + clip.duration > asset.duration)
      throw new Error(`Clip ${clip.id} source range exceeds ${asset.name}'s decoded duration.`);
    if ((clip.track === 'screen' || clip.track === 'camera') && asset.kind !== 'video')
      throw new Error(`Clip ${clip.id} on ${clip.track} requires video media.`);
    if ((clip.track === 'voice' || clip.track === 'music') && !asset.hasAudio)
      throw new Error(`Clip ${clip.id} on ${clip.track} requires an audio stream.`);
  }
}

/** Embed local source bytes, never object URLs or browser-specific decoded metadata. */
export async function serializeProject(edit: Edit, assets: Asset[], muted: Track[]): Promise<Blob> {
  const snapshot = structuredClone(edit);
  const mutedSnapshot = [...muted];
  validateSources(snapshot, assets);
  const media: { id: string; name: string; data: string }[] = [];
  for (const asset of assets) {
    if (!asset.url.startsWith('blob:'))
      throw new Error(`Media ${asset.name} must have a local blob URL.`);
    let blob: Blob;
    try {
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error('Could not fetch local media');
      blob = await response.blob();
    } catch {
      throw new Error(`Could not read local media ${asset.name}. Import it again before saving.`);
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768)
      binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    const mime = /^(?:video|audio)\/[a-z0-9.+-]+$/.test(blob.type)
      ? blob.type
      : 'application/octet-stream';
    media.push({ id: asset.id, name: asset.name, data: `data:${mime};base64,${btoa(binary)}` });
  }
  const parsed = parseProject(
    JSON.stringify({ version: 2, fps: FPS, ...snapshot, media, muted: mutedSnapshot }),
  );
  return new Blob(
    [
      JSON.stringify({
        version: 2,
        fps: FPS,
        ...parsed.edit,
        media: parsed.media,
        muted: parsed.muted,
      }),
    ],
    { type: 'application/json' },
  );
}
