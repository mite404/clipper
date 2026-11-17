import { ALL_FORMATS, AudioBufferSink, BlobSource, CanvasSink, Input } from 'mediabunny';
import { FPS } from './timeline-model';
import { validateCursorImages, type CursorTrack } from './cursor';

export type Asset = {
  id: string;
  name: string;
  url: string;
  // Source bytes, so Save can refuse or leave out media before reading any of it.
  size: number;
  width: number;
  height: number;
  peaks: number[];
  thumbnail: string;
  cursor?: CursorTrack;
} & (
  | { kind: 'video' | 'audio'; duration: number; hasAudio: boolean }
  | { kind: 'image'; duration?: never; hasAudio: false }
);

const DEMO_DEADLINE_MS = 15000;
/** Initial timeline duration for a still, not a limit on its source pixels. */
export const DEFAULT_STILL_FRAMES = 5 * FPS;

async function readImage(file: Blob, name: string, id: string, mime: string): Promise<Asset> {
  let bitmap: ImageBitmap;
  const source = file.slice(0, file.size, mime);
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    throw new Error('This PNG/JPEG image is corrupt or cannot be decoded. Try exporting it again.');
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
      peaks: [],
      hasAudio: false,
      thumbnail,
    };
  } finally {
    bitmap.close();
  }
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
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const mime = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)
    ? 'image/png'
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      ? 'image/jpeg'
      : null;
  if (mime) return readImage(file, name, id, mime);
  if (file.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(name))
    throw new Error('Unsupported or corrupt image. Choose a valid PNG or JPEG file.');
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
    const peaks = Array.from({ length: Math.max(1, Math.ceil(durationSeconds * FPS)) }, () => 0);
    if (audio) {
      if (!(await audio.canDecode()))
        throw new Error('The audio codec is not supported in this browser.');
      for await (const { buffer, timestamp } of new AudioBufferSink(audio).buffers()) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const samples = buffer.getChannelData(channel);
          for (let i = 0; i < samples.length; i += 32) {
            const bin = Math.floor((timestamp + i / buffer.sampleRate) * FPS);
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
      if (sample) {
        const canvas = document.createElement('canvas');
        canvas.width = sample.canvas.width;
        canvas.height = sample.canvas.height;
        canvas.getContext('2d')?.drawImage(sample.canvas, 0, 0);
        thumbnail = canvas.toDataURL('image/jpeg', 0.75);
      }
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
