import type { Layout } from './stage';
import { openMedia, type Asset } from './media';
import {
  DEFAULT_TRACKS,
  FPS,
  ZOOM_LIMITS,
  zoomsOverlap,
  type Clip,
  type Track,
  type TrackDef,
  type Zoom,
} from './timeline-model';
import { parseCursorTrack, type CursorTrack } from './cursor';

// No clip or zoom may end later than this: 24 hours of timeline.
const MAX_FRAMES = 24 * 60 * 60 * FPS;

/** The undoable edit. `tracks` is the ordered registry every clip's `track` resolves through. */
export type Edit = { clips: Clip[]; zooms: Zoom[]; layout: Layout; tracks: TrackDef[] };

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

function trackDef(value: unknown, i: number): TrackDef {
  const item = object(value, `tracks[${i}]`);
  const id = string(item.id, `tracks[${i}].id`);
  const label = string(item.label, `tracks[${i}].label`);
  if (item.kind === 'audio')
    return { id, label, kind: 'audio', gain: number(item.gain, `tracks[${i}].gain`, 0, 16) };
  if (item.kind !== 'visual') throw new Error(`tracks[${i}].kind must be visual or audio.`);
  if (item.role !== 'background' && item.role !== 'screen' && item.role !== 'camera')
    throw new Error(`tracks[${i}].role must be background, screen or camera.`);
  return { id, label, kind: 'visual', role: item.role };
}

// Version 4 carries the registry; older files imply the four default tracks.
function registry(root: Record<string, unknown>): TrackDef[] {
  if (root.version !== 4) {
    if (root.tracks !== undefined) throw new Error('A track registry requires version 4.');
    return structuredClone(DEFAULT_TRACKS);
  }
  const tracks = array(root.tracks, 'tracks').map(trackDef);
  unique(
    tracks.map((t) => t.id),
    'track',
  );
  return tracks;
}

function unique(ids: string[], field: string) {
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${field} IDs.`);
}

function range(start: number, duration: number, field: string) {
  if (start + duration > MAX_FRAMES) throw new Error(`${field} range exceeds 24 hours.`);
}

function zoomSource(value: unknown, clips: Clip[], duration: number): NonNullable<Zoom['source']> {
  const source = object(value, 'Zoom source anchor');
  const assetId = string(source.assetId, 'source.assetId');
  const clipId = string(source.clipId, 'source.clipId');
  const start = frame(source.start, 'source.start');
  range(start, duration, 'Zoom source');
  if (
    !clips.some(
      (clip) =>
        clip.track === 'screen' &&
        clip.assetId === assetId &&
        (clip.originId ?? clip.id) === clipId,
    )
  )
    throw new Error('Zoom source anchor has no screen clip.');
  return {
    assetId,
    clipId,
    start,
    x: number(source.x, 'source.x', 0, 1),
    y: number(source.y, 'source.y', 0, 1),
  };
}

function imageKind(kind: unknown, data: string, version: unknown): { kind?: 'image' } {
  const image = /^data:image\/(png|jpeg);base64,/.test(data);
  if (!image && kind === undefined) return {};
  if (typeof version !== 'number' || version < 3 || !image || kind !== 'image')
    throw new Error('Image kind and PNG/JPEG MIME require version 3 or later.');
  return { kind: 'image' };
}

/** Validates the portable envelope, not media codecs or decoded source durations. */
export function parseProject(text: string): {
  edit: Edit;
  media: { id: string; name: string; data: string; kind?: 'image'; cursor?: CursorTrack }[];
  muted: Track[];
  locked: Track[];
  selectedTracks: Track[];
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
  if (root.version !== 2 && root.version !== 3 && root.version !== 4)
    throw new Error('Unsupported project version; expected version 2, 3 or 4.');
  if (root.fps !== FPS) throw new Error(`Unsupported fps; expected ${FPS}.`);
  const tracks = registry(root);
  const track = (value: unknown): Track => {
    if (typeof value !== 'string' || !tracks.some((t) => t.id === value))
      throw new Error(`Unknown track ${String(value)}; every reference must name a listed track.`);
    return value;
  };

  const media = array(root.media, 'media').map((entry, i) => {
    const item = object(entry, `media[${i}]`);
    const id = string(item.id, `media[${i}].id`);
    const name = string(item.name, `media[${i}].name`);
    const data = string(item.data, `media[${i}].data`);
    const kind = imageKind(item.kind, data, root.version);
    const match =
      /^data:(?:image\/(?:png|jpeg)|video\/[a-z0-9.+-]+|audio\/[a-z0-9.+-]+|application\/(?:octet-stream|ogg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
        data,
      );
    if (!match || match[1].length % 4 !== 0)
      throw new Error(`media[${i}].data must be a base64 audio/video or PNG/JPEG data URL.`);
    try {
      if (btoa(atob(match[1])) !== match[1]) throw new Error('Noncanonical base64');
    } catch {
      throw new Error(`media[${i}].data contains invalid base64.`);
    }
    return {
      id,
      name,
      data,
      ...kind,
      ...(item.cursor === undefined ? {} : { cursor: parseCursorTrack(item.cursor) }),
    };
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
    return {
      id,
      assetId,
      track: track(item.track),
      start,
      duration,
      offset,
      ...(item.originId === undefined ? {} : { originId: string(item.originId, 'clip.originId') }),
    };
  });
  unique(
    clips.map((c) => c.id),
    'clip',
  );

  const zooms: Zoom[] = array(root.zooms, 'zooms').map((entry, i) => {
    const item = object(entry, `zooms[${i}]`);
    const id = string(item.id, `zooms[${i}].id`);
    const start = frame(item.start, `zooms[${i}].start`);
    const duration = frame(item.duration, `zooms[${i}].duration`, ZOOM_LIMITS.minFrames);
    range(start, duration, `Zoom ${id}`);
    if (item.follow !== undefined && item.follow !== 'focused' && item.follow !== 'smooth')
      throw new Error('Zoom follow must be focused or smooth.');
    if (item.instant !== undefined && typeof item.instant !== 'boolean')
      throw new Error('Zoom instant must be a boolean.');
    return {
      id,
      start,
      duration,
      scale: number(item.scale, `zooms[${i}].scale`, ZOOM_LIMITS.minScale, ZOOM_LIMITS.maxScale),
      x: number(item.x, `zooms[${i}].x`, 0, 100),
      y: number(item.y, `zooms[${i}].y`, 0, 100),
      ...(item.follow === undefined ? {} : { follow: item.follow }),
      ...(item.instant === undefined ? {} : { instant: item.instant }),
      ...(item.source === undefined ? {} : { source: zoomSource(item.source, clips, duration) }),
    };
  });
  // Selection is one namespace, so a zoom may not reuse a clip's ID either.
  unique([...clips.map((c) => c.id), ...zooms.map((z) => z.id)], 'clip or zoom');
  // ponytail: pairwise scan; sort by start and compare neighbours if files carry thousands of zooms
  if (zooms.some((zoom) => zoomsOverlap(zooms, zoom))) throw new Error('Zooms cannot overlap.');

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
  // Track toggles validate like muted. Files saved before locks and track selection omit them.
  const toggles = (field: 'muted' | 'locked' | 'selectedTracks', fallback?: unknown[]) => {
    const list = array(root[field] === undefined ? fallback : root[field], field).map(track);
    unique(list, `${field} track`);
    return list;
  };
  return {
    edit: { clips, zooms, layout, tracks },
    media,
    muted: toggles('muted'),
    locked: toggles('locked', []),
    selectedTracks: toggles('selectedTracks', []),
  };
}

/** Run after readMedia has decoded every embedded asset, before replacing the open project. */
export function validateSources(edit: Edit, assets: Asset[]): void {
  unique(
    assets.map((asset) => asset.id),
    'media',
  );
  const sources = new Map(assets.map((asset) => [asset.id, asset]));
  for (const asset of assets.filter((item) => item.kind !== 'image'))
    frame(asset.duration, `Media ${asset.name} duration`, 1);
  for (const clip of edit.clips) {
    const asset = sources.get(clip.assetId);
    if (!asset) throw new Error(`Clip ${clip.id} references missing media ${clip.assetId}.`);
    frame(clip.offset, `Clip ${clip.id} offset`);
    frame(clip.duration, `Clip ${clip.id} duration`, 1);
    range(clip.start, clip.duration, `Clip ${clip.id} timeline`);
    if (asset.kind !== 'image' && clip.offset + clip.duration > asset.duration)
      throw new Error(`Clip ${clip.id} source range exceeds ${asset.name}'s decoded duration.`);
    const track = edit.tracks.find((t) => t.id === clip.track);
    if (!track) throw new Error(`Clip ${clip.id} is on unknown track ${clip.track}.`);
    if (track.kind === 'visual' && asset.kind === 'audio')
      throw new Error(`Clip ${clip.id} on ${track.label} requires video or image media.`);
    if (track.kind === 'audio' && !asset.hasAudio)
      throw new Error(`Clip ${clip.id} on ${track.label} requires an audio stream.`);
  }
}

// The version a file needs and its edit fields. Only a registry other than the default four
// tracks is written, as version 4, so older builds still open every other project.
function fileEdit(edit: Edit, media: { kind?: 'image' }[]) {
  const { tracks, ...rest } = edit;
  if (JSON.stringify(tracks) !== JSON.stringify(DEFAULT_TRACKS))
    return { version: 4, tracks: { tracks }, ...rest };
  return { version: media.some((item) => item.kind === 'image') ? 3 : 2, tracks: {}, ...rest };
}

// Source bytes one project file can embed. V8 refuses strings past 536,870,888 characters, and Save
// and Open each hold the whole file as one string; 375 MB is 500 million characters of base64.
// ponytail: the 36 million characters left for the edit and cursor sidecars are not measured.
// REF-22's container removes the ceiling.
const MAX_MEDIA_BYTES = 375_000_000;
const megabytes = (bytes: number) => `${Math.ceil(bytes / 1e6)} MB`;
const totalSize = (assets: Pick<Asset, 'size'>[]) =>
  assets.reduce((sum, asset) => sum + asset.size, 0);

/** What to tell the user once library media no longer fits one project file, else null. */
export function librarySizeWarning(assets: Pick<Asset, 'size'>[]): string | null {
  const total = totalSize(assets); // → bytes
  return total > MAX_MEDIA_BYTES
    ? `Library media totals ${megabytes(total)} and a project file holds ${megabytes(MAX_MEDIA_BYTES)}. ` +
        'Save leaves out unused media first, and refuses if the timeline needs more.'
    : null;
}

// Blob → base64 data URL, built in chunks so no call spreads more than 32768 arguments.
async function dataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 32768)
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  const mime = /^(?:(?:video|audio)\/[a-z0-9.+-]+|image\/(?:png|jpeg))$/.test(blob.type)
    ? blob.type
    : 'application/octet-stream';
  return `data:${mime};base64,${btoa(binary)}`;
}

// Asset → its bytes as a data URL, or null when media no clip uses cannot be read.
async function embed(asset: Asset, required: boolean): Promise<string | null> {
  try {
    return await dataUrl(await (await openMedia(asset)).blob());
  } catch (error) {
    if (required) throw error;
    return null;
  }
}

// Bytes a file has left once the media its clips use is counted. Throws before anything is read.
function spareBytes(assets: Asset[], usedIds: Set<string>): number {
  const usedBytes = totalSize(assets.filter((asset) => usedIds.has(asset.id)));
  if (usedBytes > MAX_MEDIA_BYTES)
    throw new Error(
      `Clips on the timeline use ${megabytes(usedBytes)} of media and a project file holds ` +
        `${megabytes(MAX_MEDIA_BYTES)}. Remove clips of the largest source, or export the video.`,
    );
  return MAX_MEDIA_BYTES - usedBytes;
}

/**
 * Embed local source bytes, never object URLs or browser-specific decoded metadata.
 * Media no clip uses is embedded too while it fits and can be read; the rest is named in `omitted`.
 * An edit without a registry is the four legacy tracks, as export reads it.
 * @throws When the edit is invalid, when the media its clips use exceeds what one file can hold
 * (before any media is read), or when such media can no longer be read.
 */
export async function serializeProject(
  edit: Omit<Edit, 'tracks'> & Partial<Pick<Edit, 'tracks'>>,
  assets: Asset[],
  muted: Track[],
  toggles: { locked: Track[]; selectedTracks: Track[] } = { locked: [], selectedTracks: [] },
): Promise<{ file: Blob; omitted: string[] }> {
  const snapshot: Edit = { tracks: DEFAULT_TRACKS, ...structuredClone(edit) };
  // An undone track creation can leave toggles naming a track the registry no longer has.
  const listed = (ids: Track[]) => ids.filter((id) => snapshot.tracks.some((t) => t.id === id));
  const trackSnapshot = {
    muted: listed(muted),
    locked: listed(toggles.locked),
    selectedTracks: listed(toggles.selectedTracks),
  };
  validateSources(snapshot, assets);
  const usedIds = new Set(snapshot.clips.map((clip) => clip.assetId));
  let spare = spareBytes(assets, usedIds); // bytes left for media no clip uses
  const media: ReturnType<typeof parseProject>['media'] = [];
  const omitted: string[] = [];
  for (const asset of assets) {
    if (!asset.url.startsWith('blob:'))
      throw new Error(`Media ${asset.name} must have a local blob URL.`);
    const used = usedIds.has(asset.id);
    const data = used || asset.size <= spare ? await embed(asset, used) : null; // → data URL | null
    if (data === null) {
      omitted.push(asset.name);
      continue;
    }
    if (!used) spare -= asset.size;
    media.push({
      id: asset.id,
      name: asset.name,
      data,
      ...(asset.kind === 'image' ? { kind: 'image' as const } : {}),
      ...(asset.cursor ? { cursor: asset.cursor } : {}),
    });
  }
  const { version, tracks, ...rest } = fileEdit(snapshot, media);
  const parsed = parseProject(
    JSON.stringify({ version, fps: FPS, ...rest, ...tracks, media, ...trackSnapshot }),
  );
  const { tracks: _parsedTracks, ...parsedEdit } = parsed.edit;
  const file = new Blob(
    [
      JSON.stringify({
        version,
        fps: FPS,
        ...parsedEdit,
        ...(tracks.tracks && { tracks: parsed.edit.tracks }),
        media: parsed.media,
        muted: parsed.muted,
        locked: parsed.locked,
        selectedTracks: parsed.selectedTracks,
      }),
    ],
    { type: 'application/json' },
  );
  return { file, omitted };
}
