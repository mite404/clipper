export type CursorSample = Record<string, unknown> & {
  timeMs: number;
  cx: number;
  cy: number;
  assetId?: string | null;
  visible?: boolean;
  cursorType?: string | null;
  interactionType?: string | null;
};

export type CursorAsset = Record<string, unknown> & {
  id: string;
  platform: string;
  imageDataUrl: string;
  width: number;
  height: number;
  hotspotX: number;
  hotspotY: number;
  scaleFactor?: number;
};

export type CursorRecording = Record<string, unknown> & {
  version: 2;
  provider: 'native';
  samples: CursorSample[];
  assets: CursorAsset[];
};

export type CursorSettings = {
  mode: 'raw' | 'smooth';
  size: number;
  hidden: boolean;
  hideIdle?: boolean;
  removeShakes?: boolean;
  style?: 'recorded' | 'default' | 'touch';
  ending?: 'stop' | 'loop';
};

export const DEFAULT_CURSOR_SETTINGS: CursorSettings = { mode: 'smooth', size: 1, hidden: false };

export type CursorTrack = {
  recording: CursorRecording;
  // Positive values delay the cursor relative to the source video's clock.
  offsetMs: number;
  settings?: CursorSettings;
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Cursor data must contain objects.');
  return value as Record<string, unknown>;
}

function finite(value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error(`Cursor number must be between ${min} and ${max}.`);
  return value;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Missing cursor text field.');
  return value;
}

function optionalText(value: unknown): string | null | undefined {
  return value == null ? value : text(value);
}

function entries(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Cursor samples and assets must be arrays.');
  return value;
}

function dimension(value: unknown): number {
  const size = finite(value, 1, 4096);
  if (!Number.isInteger(size)) throw new Error('Cursor dimensions must be integers.');
  return size;
}

function pngDimensions(bytes: string, width: number, height: number): void {
  if (bytes.length < 24) throw new Error('Truncated cursor PNG.');
  const header = Uint8Array.from(bytes.slice(0, 24), (character) => character.charCodeAt(0));
  const view = new DataView(header.buffer);
  if (view.getUint32(16) !== width || view.getUint32(20) !== height)
    throw new Error('Cursor PNG dimensions do not match the sidecar.');
}

function png(value: unknown, width: number, height: number): string {
  const url = text(value);
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(url);
  if (!match || url.length > 8 * 1024 * 1024) throw new Error('Cursor assets must be local PNGs.');
  const bytes = atob(match[1]);
  if (btoa(bytes) !== match[1] || !bytes.startsWith('\x89PNG\r\n\x1a\n'))
    throw new Error('Invalid cursor PNG.');
  pngDimensions(bytes, width, height);
  return url;
}

function parseAsset(value: unknown): CursorAsset {
  const asset = object(value);
  const width = dimension(asset.width);
  const height = dimension(asset.height);
  return {
    ...asset,
    id: text(asset.id),
    platform: text(asset.platform),
    imageDataUrl: png(asset.imageDataUrl, width, height),
    width,
    height,
    hotspotX: finite(asset.hotspotX, 0, width),
    hotspotY: finite(asset.hotspotY, 0, height),
    ...(asset.scaleFactor === undefined
      ? {}
      : { scaleFactor: finite(asset.scaleFactor, 0.01, 16) }),
  };
}

function parseSample(value: unknown): CursorSample {
  const sample = object(value);
  if (sample.visible !== undefined && typeof sample.visible !== 'boolean')
    throw new Error('Cursor visibility must be boolean.');
  return {
    ...sample,
    timeMs: finite(sample.timeMs, 0),
    cx: finite(sample.cx, 0, 1),
    cy: finite(sample.cy, 0, 1),
    assetId: optionalText(sample.assetId),
    cursorType: optionalText(sample.cursorType),
    interactionType: optionalText(sample.interactionType),
    visible: sample.visible,
  };
}

/** Validates OpenScreen v2 native telemetry without altering source times or extension fields.
 * @throws When telemetry or embedded cursor assets are malformed.
 */
export function parseCursor(value: unknown): CursorRecording {
  const root = object(value);
  if (root.version !== 2 || root.provider !== 'native')
    throw new Error('Expected an OpenScreen v2 native cursor sidecar.');
  const assets = entries(root.assets).map(parseAsset);
  const ids = new Set(assets.map((asset) => asset.id));
  if (ids.size !== assets.length) throw new Error('Duplicate cursor asset IDs.');
  const samples = entries(root.samples).map(parseSample);
  let previous = 0;
  for (const sample of samples) {
    if (sample.timeMs < previous) throw new Error('Cursor samples must be sorted by source time.');
    if (sample.assetId && !ids.has(sample.assetId)) throw new Error('Missing cursor asset.');
    previous = sample.timeMs;
  }
  return { ...root, version: 2, provider: 'native', samples, assets };
}

function parseFlags(settings: Record<string, unknown>) {
  const flags: Pick<CursorSettings, 'hideIdle' | 'removeShakes'> = {};
  for (const key of ['hideIdle', 'removeShakes'] as const) {
    const value = settings[key];
    if (value === undefined) continue;
    if (typeof value !== 'boolean') throw new Error(`Cursor ${key} must be boolean.`);
    flags[key] = value;
  }
  return flags;
}

function optionalChoice<T extends string>(value: unknown, options: T[]): T | undefined {
  if (value === undefined) return undefined;
  const choice = options.find((option) => option === value);
  if (choice === undefined) throw new Error('Invalid cursor setting.');
  return choice;
}

function parseSettings(value: unknown): CursorSettings {
  const settings = object(value);
  if (settings.mode !== 'raw' && settings.mode !== 'smooth')
    throw new Error('Cursor motion must be raw or smooth.');
  if (typeof settings.hidden !== 'boolean') throw new Error('Cursor visibility must be boolean.');
  return {
    mode: settings.mode,
    size: finite(settings.size, 0.25, 4),
    hidden: settings.hidden,
    style: optionalChoice(settings.style, ['recorded', 'default', 'touch']),
    ending: optionalChoice(settings.ending, ['stop', 'loop']),
    ...parseFlags(settings),
  };
}

/** Validates persisted source telemetry and its clock adjustment.
 * @throws When the recording or time offset is malformed.
 */
export function parseCursorTrack(value: unknown): CursorTrack {
  const track = object(value);
  return {
    recording: parseCursor(track.recording),
    offsetMs: finite(track.offsetMs, -Number.MAX_SAFE_INTEGER),
    ...(track.settings === undefined ? {} : { settings: parseSettings(track.settings) }),
  };
}

/** Decode embedded PNGs locally before accepting a sidecar or opening a project.
 * @throws When a bitmap is corrupt or differs from its declared dimensions.
 */
export async function validateCursorImages(cursor?: Pick<CursorTrack, 'recording'>): Promise<void> {
  if (!cursor) return;
  for (const asset of cursor.recording.assets) {
    const image = new Image();
    image.src = asset.imageDataUrl;
    await image.decode();
    if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height)
      throw new Error('Cursor PNG dimensions do not match the sidecar.');
  }
}
