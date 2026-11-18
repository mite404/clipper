// Shared by the transcription client and its worker, so neither imports the other.

/** The one place that names the transcription model and its pinned files (ADR-31). */
export const WHISPER = {
  model: 'onnx-community/whisper-tiny.en',
  /** Written into each transcript, so a later model can tell which one made it. */
  label: 'whisper-tiny.en@794207f',
} as const;
/** Whisper's input rate. */
export const SAMPLE_RATE = 16000;
/** Audio per worker step, so progress moves and Cancel lands between steps. */
export const BLOCK_SECONDS = 150;

export type TranscriptSegment = { start: number; end: number; text: string };
/** What the worker sends: a step's progress in source seconds, its chunks, or its failure. */
export type WorkerMessage =
  | { type: 'loaded' }
  | { type: 'progress'; seconds: number }
  | { type: 'done'; chunks: TranscriptSegment[] }
  | { type: 'error'; message: string };

// ponytail: a fixed -60 dBFS floor only stops Whisper's hallucinations on near-digital silence;
// CLIP-33 owns measuring a quiet-clip threshold for real room tone.
const QUIET_RMS = 0.001;

/** Whether a span of 16 kHz samples, in seconds, is louder than near-digital silence. */
export function audible(samples: Float32Array, start: number, end: number): boolean {
  const span = samples.subarray(Math.floor(start * SAMPLE_RATE), Math.ceil(end * SAMPLE_RATE));
  let sum = 0;
  for (const sample of span) sum += sample * sample;
  return span.length > 0 && Math.sqrt(sum / span.length) > QUIET_RMS;
}
