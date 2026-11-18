// Runs Whisper off the main thread. Model and runtime files come only from Clipper's own origin
// (ADR-31): remote models are off, and the CPU WASM is served from the build, not a CDN.
import { env, pipeline } from '@huggingface/transformers';
import mjs from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url';
import wasm from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import {
  audible,
  BLOCK_SECONDS,
  SAMPLE_RATE,
  WHISPER,
  type TranscriptSegment,
  type WorkerMessage,
} from './whisper';

env.allowRemoteModels = false;
env.allowLocalModels = true;
env.localModelPath = '/models/';
env.backends.onnx.wasm!.wasmPaths = { mjs, wasm };
env.backends.onnx.wasm!.numThreads = 1;

const post = (message: WorkerMessage) => self.postMessage(message);
type Chunk = { text: string; timestamp: [number, number | null] };

// A missing install reads as such; any other model or runtime failure keeps its own cause.
// The probe checks the type because a dev server answers a missing file with its HTML page.
async function load() {
  const config = await fetch(`${env.localModelPath}${WHISPER.model}/config.json`);
  if (!config.ok || !config.headers.get('content-type')?.includes('json'))
    throw new Error('The transcription model is not installed. Run npm run fetch:whisper.');
  return pipeline('automatic-speech-recognition', WHISPER.model, {
    device: 'wasm',
    dtype: { encoder_model: 'q8', decoder_model_merged: 'q8' },
  });
}

// ponytail: blocks are cut at fixed points, so a word may split at a 150 s boundary; overlap
// blocks like Whisper's own stride if that shows in real recordings.
self.onmessage = async ({ data: samples }: MessageEvent<Float32Array>) => {
  try {
    const asr = await load();
    post({ type: 'loaded' });
    const block = BLOCK_SECONDS * SAMPLE_RATE;
    const chunks: TranscriptSegment[] = [];
    for (let at = 0; at < samples.length; at += block) {
      const piece = samples.subarray(at, at + block);
      const output = await asr(piece, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      });
      const offset = at / SAMPLE_RATE; // → source seconds
      for (const { text, timestamp } of (output as { chunks: Chunk[] }).chunks)
        chunks.push({
          text,
          start: offset + timestamp[0],
          end: offset + (timestamp[1] ?? piece.length / SAMPLE_RATE),
        });
      post({ type: 'progress', seconds: (at + piece.length) / SAMPLE_RATE });
    }
    // Whisper invents words over silence, so a chunk over near-silent audio is dropped.
    post({ type: 'done', chunks: chunks.filter((c) => audible(samples, c.start, c.end)) });
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
