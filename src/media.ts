import { ALL_FORMATS, AudioBufferSink, BlobSource, CanvasSink, Input } from 'mediabunny';
import { FPS } from './timeline';

export type Asset = {
  id: string;
  name: string;
  kind: 'video' | 'audio';
  url: string;
  duration: number;
  width: number;
  height: number;
  peaks: number[];
  hasAudio: boolean;
  thumbnail: string;
};

/** Read metadata and decoded waveform locally. No media is uploaded.
 * @throws When the container or media codec cannot be decoded by this browser.
 */
export async function readMedia(
  file: Blob,
  name: string,
  id: string = crypto.randomUUID(),
): Promise<Asset> {
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
    const peaks = Array.from({ length: Math.max(1, Math.ceil(durationSeconds * 30)) }, () => 0);
    if (audio) {
      if (!(await audio.canDecode()))
        throw new Error('The audio codec is not supported in this browser.');
      for await (const { buffer, timestamp } of new AudioBufferSink(audio).buffers()) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const samples = buffer.getChannelData(channel);
          for (let i = 0; i < samples.length; i += 32) {
            const bin = Math.floor((timestamp + i / buffer.sampleRate) * 30);
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
      duration: Math.max(1, Math.floor(durationSeconds * FPS)),
      width: video ? await video.getDisplayWidth() : 0,
      height: video ? await video.getDisplayHeight() : 0,
      peaks,
      hasAudio: Boolean(audio),
      thumbnail,
    };
  } finally {
    input.dispose();
  }
}

/** Load the attributed, same-origin demo files through the same processing path as user imports. */
export async function loadDemo(): Promise<Asset[]> {
  return Promise.all(
    [
      ['landscape.mp4', 'Flower study', 'landscape'],
      ['portrait.mp4', 'A conversation', 'portrait'],
      ['voice.wav', 'Voiceover', 'voice'],
      ['music.wav', 'Ambient bed', 'music'],
    ].map(async ([file, name, id]) => {
      const response = await fetch(`/media/${file}`);
      if (!response.ok) throw new Error(`Could not load demo ${file}. Import local media instead.`);
      return readMedia(await response.blob(), name, id);
    }),
  );
}
