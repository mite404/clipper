import { ALL_FORMATS, AudioBufferSink, BlobSource, Input } from 'mediabunny';
import { SAMPLE_RATE, WHISPER, type TranscriptSegment, type WorkerMessage } from './whisper';

/** Speech in a source, in source seconds, shared by every timeline use of that source. */
export type Transcript = { model: string; segments: TranscriptSegment[] };
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** Whisper chunks → trimmed, ordered segments that never overlap or pass the source's end. */
export function segmentsFrom(chunks: TranscriptSegment[], duration: number): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  for (const chunk of [...chunks].sort((a, b) => a.start - b.start)) {
    const start = Math.max(chunk.start, segments.at(-1)?.end ?? 0);
    const end = Math.min(chunk.end, duration);
    const text = chunk.text.trim();
    if (text && end > start) segments.push({ start, end, text });
  }
  return segments;
}

/** Decode a source's first audio track to 16 kHz mono, the input Whisper expects. */
async function decodeSpeech(blob: Blob): Promise<Float32Array> {
  const input = new Input({ source: new BlobSource(blob), formats: ALL_FORMATS });
  const track = await input.getPrimaryAudioTrack();
  if (!track) throw new Error('This media has no audio track.');
  const seconds = await input.computeDuration(); // → source seconds
  const mixer = new OfflineAudioContext(
    1,
    Math.max(1, Math.ceil(seconds * SAMPLE_RATE)),
    SAMPLE_RATE,
  );
  for await (const { buffer, timestamp } of new AudioBufferSink(track).buffers()) {
    const node = mixer.createBufferSource();
    node.buffer = buffer;
    node.connect(mixer.destination);
    node.start(Math.max(0, timestamp));
  }
  return (await mixer.startRendering()).getChannelData(0);
}

/**
 * Transcribe a source's speech in a worker; the audio never leaves the browser.
 * @param onProgress a status label and the share done, from 0 to 1
 * @throws the signal's reason when cancelled, or an Error when decoding or the model fails
 */
export async function transcribe(
  blob: Blob,
  onProgress: (label: string, ratio: number) => void,
  signal: AbortSignal,
): Promise<Transcript> {
  const samples = await decodeSpeech(blob); // → 16 kHz mono
  signal.throwIfAborted();
  const total = samples.length / SAMPLE_RATE;
  onProgress('Loading transcription model', 0);
  const chunks = await transcribeSamples(samples, signal, (seconds) =>
    onProgress(`Transcribing ${clock(seconds)} of ${clock(total)}`, seconds / total),
  );
  return { model: WHISPER.label, segments: segmentsFrom(chunks, total) };
}

/**
 * Transcribe 16 kHz mono samples in a fresh Whisper worker, which the samples move into.
 * @param onProgress source seconds done, as each step finishes
 * @throws the signal's reason when cancelled, or an Error when the model fails
 */
export async function transcribeSamples(
  samples: Float32Array,
  signal: AbortSignal,
  onProgress: (seconds: number) => void = () => {},
): Promise<TranscriptSegment[]> {
  const worker = new Worker(new URL('./transcribe.worker.ts', import.meta.url), { type: 'module' });
  try {
    return await new Promise<TranscriptSegment[]>((resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      worker.onerror = (event) => reject(new Error(event.message || 'The model failed to start.'));
      worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
        if (data.type === 'error') reject(new Error(data.message));
        else if (data.type === 'done') resolve(data.chunks);
        else onProgress(data.type === 'progress' ? data.seconds : 0);
      };
      worker.postMessage(samples, [samples.buffer]);
    });
  } finally {
    worker.terminate();
  }
}
