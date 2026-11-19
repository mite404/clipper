// Dictation for the assistant's compose box (CLIP-49), after yaklabs ADR-028: a microphone, its
// level for the waveform, and Whisper in the browser for the words. Audio never leaves the page
// (ADR-1): yaklabs' Web Speech API is not used, since Chrome's sends audio to Google.
import { SAMPLE_RATE, type TranscriptSegment } from './whisper';
import { transcribeSamples } from './transcribe';

/** A capture device the person can choose, as the browser reports it. */
export type AudioDevice = { id: string; label: string };

// ponytail: the preview re-transcribes the whole take every CHUNK_SECONDS; a streaming decoder
// would be cheaper once takes run past a minute or two.
// How often the live preview re-reads the take, in seconds of audio.
const CHUNK_SECONDS = 4;

/** Formats recording time as m:ss, e.g. "0:07". */
export function formatElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// A block of time-domain samples → a 0-1 loudness (scaled RMS).
function levelFromSamples(samples: Float32Array): number {
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return samples.length ? Math.min(1, Math.sqrt(sum / samples.length) * 4) : 0;
}

/** Joins dictated text onto a draft with exactly one space between them. */
export function appendDictation(draft: string, transcript: string): string {
  const spoken = transcript.trim();
  if (!spoken) return draft;
  return draft.trim() ? `${draft.trimEnd()} ${spoken}` : spoken;
}

// Whisper's segments → one line of text.
const textOf = (segments: TranscriptSegment[]) =>
  segments
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join(' ');

// Concatenates recorded blocks into one buffer.
function joinBlocks(blocks: Float32Array[]): Float32Array {
  const all = new Float32Array(blocks.reduce((n, b) => n + b.length, 0));
  let at = 0;
  for (const block of blocks) {
    all.set(block, at);
    at += block.length;
  }
  return all;
}

// The inputs to pick from, the system default first; unnamed ones are numbered.
function pickableInputs(all: Pick<MediaDeviceInfo, 'deviceId' | 'kind' | 'label'>[]) {
  return all
    .filter((d) => d.kind === 'audioinput')
    .map((d, i) => ({
      id: d.deviceId,
      label: d.deviceId === 'default' ? 'System Default' : d.label || `Microphone ${i + 1}`,
    }))
    .sort((a, b) => Number(b.id === 'default') - Number(a.id === 'default'));
}

const microphoneError = (reason: unknown) =>
  reason instanceof DOMException && reason.name === 'NotAllowedError'
    ? 'Microphone access was blocked. Allow it in your browser settings to dictate.'
    : 'No microphone could be opened.';

/** Where a recording reports to while it listens. */
export type DictationSink = {
  onLevel: (level: number) => void;
  onDevices: (devices: AudioDevice[]) => void;
  onText: (text: string) => void;
  onError: (message: string) => void;
};

/**
 * Records a microphone at Whisper's rate, reports its level every frame, and re-transcribes the
 * take every CHUNK_SECONDS. Failures go to `sink.onError`, never to the caller.
 * @returns `finish`, which stops and resolves with the whole take's text, and `cancel`
 */
export function record(deviceId: string, sink: DictationSink) {
  let stopped = false;
  let frame = 0;
  let stream: MediaStream | undefined;
  let context: AudioContext | undefined;
  const blocks: Float32Array[] = [];
  let heard = 0; // → samples already sent to the preview
  let previewing: Promise<void> = Promise.resolve();
  const controller = new AbortController();

  const preview = () => {
    const take = joinBlocks(blocks); // → 16 kHz mono so far
    heard = take.length;
    previewing = transcribeSamples(take, controller.signal).then(
      (segments) => {
        if (!stopped) sink.onText(textOf(segments));
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          sink.onError(error instanceof Error ? error.message : String(error));
      },
    );
  };

  async function listen() {
    try {
      const audio = deviceId === 'default' ? true : { deviceId: { exact: deviceId } };
      const granted = await navigator.mediaDevices.getUserMedia({ audio }); // → MediaStream
      if (stopped) return granted.getTracks().forEach((t) => t.stop());
      stream = granted;
      context = new AudioContext({ sampleRate: SAMPLE_RATE });
      const source = context.createMediaStreamSource(granted);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      // ponytail: ScriptProcessor is deprecated but needs no worklet file; move to an
      // AudioWorklet if Chrome removes it.
      const tap = context.createScriptProcessor(4096, 1, 1);
      tap.onaudioprocess = ({ inputBuffer }) => {
        blocks.push(new Float32Array(inputBuffer.getChannelData(0)));
        const total = blocks.reduce((n, b) => n + b.length, 0);
        if (total - heard >= CHUNK_SECONDS * SAMPLE_RATE) {
          heard = total;
          void previewing.then(preview);
        }
      };
      source.connect(tap);
      tap.connect(context.destination);
      const level = new Float32Array(analyser.fftSize);
      const measure = () => {
        analyser.getFloatTimeDomainData(level);
        sink.onLevel(levelFromSamples(level));
        frame = requestAnimationFrame(measure);
      };
      measure();
      sink.onDevices(pickableInputs(await navigator.mediaDevices.enumerateDevices()));
    } catch (reason) {
      sink.onError(microphoneError(reason));
    }
  }

  const stop = () => {
    stopped = true;
    cancelAnimationFrame(frame);
    stream?.getTracks().forEach((t) => t.stop());
    void context?.close();
  };
  void listen();
  return {
    /** Stops and transcribes the whole take. */
    finish: async (): Promise<string> => {
      stop();
      controller.abort();
      const take = joinBlocks(blocks);
      if (!take.length) return '';
      return textOf(await transcribeSamples(take, new AbortController().signal));
    },
    cancel: () => {
      stop();
      controller.abort();
    },
  };
}
