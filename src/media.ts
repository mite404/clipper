import { ALL_FORMATS, AudioBufferSink, BlobSource, CanvasSink, Input } from 'mediabunny';
import { FPS } from './timeline-model';
import { validateCursorImages, type CursorTrack } from './cursor';
import type { Transcript } from './transcribe';

export type Asset = {
  id: string;
  name: string;
  url: string;
  // Source bytes, so Save can refuse or leave out media before reading any of it.
  size: number;
  width: number;
  height: number;
  // The absolute peak of every channel, one per 1/WAVE_RATE s of source, for the waveform. Decoded
  // media holds a Float32Array; it is rebuilt on Open, never saved.
  peaks: ArrayLike<number>;
  thumbnail: string;
  cursor?: CursorTrack;
  transcript?: Transcript;
} & (
  | { kind: 'video' | 'audio'; duration: number; hasAudio: boolean }
  | { kind: 'image'; duration?: never; hasAudio: false }
);

const DEMO_DEADLINE_MS = 15000;
/**
 * Waveform bins per source second: fixed, so detail stays tied to source time at any zoom, and
 * fine enough (1 ms) that a zoomed-in clip still shows syllables and pitch periods.
 */
export const WAVE_RATE = 1000;
/** Initial timeline duration for a still, not a limit on its source pixels. */
export const DEFAULT_STILL_FRAMES = 5 * FPS;

const ascii = (bytes: Uint8Array, at: number, text: string) =>
  Array.from(text).every((letter, i) => bytes[at + i] === letter.charCodeAt(0));

/**
 * The image type a file's first bytes say it is, never its name: PNG, JPEG, or WebP, which is a RIFF
 * file whose form is WEBP (a WAV is RIFF too). Animated WebP decodes to its first frame.
 */
export function imageMime(head: Uint8Array): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => head[i] === byte)) return 'image/png';
  if (head[0] === 255 && head[1] === 216 && head[2] === 255) return 'image/jpeg';
  return ascii(head, 0, 'RIFF') && ascii(head, 8, 'WEBP') ? 'image/webp' : null;
}

async function readImage(file: Blob, name: string, id: string, mime: string): Promise<Asset> {
  let bitmap: ImageBitmap;
  const source = file.slice(0, file.size, mime);
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    throw new Error(
      'This PNG, JPEG or WebP image is corrupt or cannot be decoded. Try exporting it again.',
    );
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(240, bitmap.width);
    canvas.height = Math.max(1, Math.round((bitmap.height * canvas.width) / bitmap.width));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image preview is unavailable in this browser.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const thumbnail = canvas.toDataURL('image/png');
    return {
      id,
      name,
      kind: 'image',
      url: URL.createObjectURL(source),
      size: file.size,
      width: bitmap.width,
      height: bitmap.height,
      peaks: new Float32Array(0),
      hasAudio: false,
      thumbnail,
    };
  } finally {
    bitmap.close();
  }
}

// A decoded frame as a small JPEG data URL, for an <img>.
function jpeg(source: HTMLCanvasElement | OffscreenCanvas): string {
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  canvas.getContext('2d')?.drawImage(source, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.75);
}

// One frame decoder per source URL, and each decoded still by URL and source frame.
// ponytail: both caches only grow, by one small JPEG per distinct in-point; evict on asset
// removal if long sessions with many trims need it.
const sinks = new Map<string, Promise<{ sink: CanvasSink; first: number } | null>>();
const stills = new Map<string, Promise<string>>();

/**
 * A video source's frame at `frame` (source frames) as an image URL the size of its thumbnail,
 * decoded locally once per source and frame. Falls back to the thumbnail when it cannot decode.
 */
export function stillAt(asset: Asset, frame: number): Promise<string> {
  const key = `${asset.url}#${frame}`;
  let still = stills.get(key);
  if (!still) {
    let sink = sinks.get(asset.url);
    if (!sink) {
      sink = (async () => {
        const blob = await (await fetch(asset.url)).blob();
        const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
        const track = await input.getPrimaryVideoTrack();
        if (!track || !(await track.canDecode())) return null;
        return {
          sink: new CanvasSink(track, { width: 240 }),
          first: await track.getFirstTimestamp(),
        };
      })();
      sinks.set(asset.url, sink);
    }
    still = sink
      .then(async (video) => {
        const sample = await video?.sink.getCanvas(Math.max(video.first, frame / FPS));
        return sample ? jpeg(sample.canvas) : asset.thumbnail;
      })
      .catch(() => asset.thumbnail);
    stills.set(key, still);
  }
  return still;
}

/**
 * Read a picked file as the composition background: a PNG, JPEG or WebP, never video or audio.
 * @throws When the file is not a decodable image of those types.
 */
export async function readBackgroundImage(file: File): Promise<Asset> {
  const imported = await readMedia(file, file.name);
  if (imported.kind === 'image') return imported;
  URL.revokeObjectURL(imported.url);
  throw new Error('Choose a PNG, JPEG or WebP image.');
}

/** Read metadata and decoded waveform locally. No media is uploaded.
 * @throws When the container or media codec cannot be decoded by this browser.
 */
export async function readMedia(
  file: Blob,
  name: string,
  id: string = crypto.randomUUID(),
  cursor?: CursorTrack,
): Promise<Asset> {
  await validateCursorImages(cursor);
  const mime = imageMime(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  if (mime) return readImage(file, name, id, mime);
  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name))
    throw new Error('Unsupported or corrupt image. Choose a valid PNG, JPEG or WebP file.');
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  try {
    const [durationSeconds, video, audio] = await Promise.all([
      input.computeDuration(),
      input.getPrimaryVideoTrack(),
      input.getPrimaryAudioTrack(),
    ]);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || (!video && !audio)) {
      throw new Error('This file has no playable media.');
    }
    const peaks = new Float32Array(Math.max(1, Math.ceil(durationSeconds * WAVE_RATE)));
    if (audio) {
      if (!(await audio.canDecode()))
        throw new Error('The audio codec is not supported in this browser.');
      for await (const { buffer, timestamp } of new AudioBufferSink(audio).buffers()) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const samples = buffer.getChannelData(channel);
          for (let i = 0; i < samples.length; i++) {
            const bin = Math.floor((timestamp + i / buffer.sampleRate) * WAVE_RATE);
            if (bin >= 0 && bin < peaks.length)
              peaks[bin] = Math.max(peaks[bin], Math.abs(samples[i]));
          }
        }
      }
    }
    if (video && !(await video.canDecode()))
      throw new Error('The video codec is not supported in this browser.');
    let thumbnail = '';
    if (video) {
      const sample = await new CanvasSink(video, { width: 240 }).getCanvas(0);
      if (sample) thumbnail = jpeg(sample.canvas);
    }
    return {
      id,
      name,
      kind: video ? 'video' : 'audio',
      url: URL.createObjectURL(file),
      size: file.size,
      duration: Math.max(1, Math.floor(durationSeconds * FPS)),
      width: video ? await video.getDisplayWidth() : 0,
      height: video ? await video.getDisplayHeight() : 0,
      peaks,
      hasAudio: Boolean(audio),
      thumbnail,
      cursor,
    };
  } finally {
    input.dispose();
  }
}

/**
 * Open the bytes behind a local asset.
 * @throws When the browser can no longer read them: a picked file changed on disk or was removed.
 * An abort through `signal` rethrows the abort itself.
 */
export async function openMedia(
  asset: Pick<Asset, 'name' | 'url'>,
  signal?: AbortSignal,
): Promise<Response> {
  try {
    const response = await fetch(asset.url, { signal });
    if (!response.ok) throw new Error('Could not fetch local media');
    return response;
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(
      `Could not read local media ${asset.name}. Import it again: the file changed on disk.`,
    );
  }
}

/** The library asset a newly picked file repairs: same name, and its bytes can no longer be read. */
export async function unreadableNamesake(
  assets: Asset[],
  name: string,
): Promise<Asset | undefined> {
  for (const asset of assets) {
    if (asset.name !== name) continue;
    // Chromium fails the request itself, so nothing is read from a healthy file.
    const readable = await openMedia(asset).then(
      (response) => (void response.body?.cancel(), true),
      () => false,
    ); // → boolean
    if (!readable) return asset;
  }
  return undefined;
}

/** Load the attributed, same-origin demo files through the same processing path as user imports. */
export async function loadDemo(): Promise<Asset[]> {
  // One deadline for all four downloads, so a stalled connection cannot hold the editor busy.
  const signal = AbortSignal.timeout(DEMO_DEADLINE_MS);
  const settled = await Promise.allSettled(
    [
      ['landscape.mp4', 'Flower study', 'landscape'],
      ['portrait.mp4', 'A conversation', 'portrait'],
      ['voice.wav', 'Voiceover', 'voice'],
      ['music.wav', 'Ambient bed', 'music'],
    ].map(async ([file, name, id]) => {
      let blob: Blob;
      try {
        const response = await fetch(`/media/${file}`, { signal });
        if (!response.ok) throw new Error(response.statusText);
        blob = await response.blob();
      } catch {
        throw new Error(`Could not load demo ${file}. Import local media instead.`);
      }
      return readMedia(blob, name, id);
    }),
  );
  const loaded = settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
  const failure = settled.find((result) => result.status === 'rejected');
  if (failure) {
    // The demo is all or nothing, so the files that did load must not keep their object URLs.
    loaded.forEach((asset) => URL.revokeObjectURL(asset.url));
    throw failure.reason;
  }
  return loaded;
}
