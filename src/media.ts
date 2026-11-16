import { ALL_FORMATS, AudioBufferSink, BlobSource, CanvasSink, Input } from 'mediabunny';
import { FPS } from './timeline-model';
import { validateCursorImages, type CursorTrack } from './cursor';

export type Asset = {
  id: string;
  name: string;
  kind: 'video' | 'audio';
  url: string;
  // Source bytes, so Save can refuse or leave out media before reading any of it.
  size: number;
  duration: number;
  width: number;
  height: number;
  peaks: number[];
  hasAudio: boolean;
  thumbnail: string;
  cursor?: CursorTrack;
};

const DEMO_DEADLINE_MS = 15000;

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
