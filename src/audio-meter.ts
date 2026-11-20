// The transport's LED dB meter: pure level math over a tapped AnalyserNode so the sampling
// closures in App and Composition stay simple enough to read. The meter shows the preview mix
// only; rendering never creates the tap.

export interface MeterState {
  lit: number; // LEDs on right now, 0..12
  peak: number; // held peak LED index
  db: number; // whole dBFS, floored at -60
}

export interface Peak {
  index: number;
  at: number; // Date.now() of the last refresh
}

/** Silence as the meter shows it: nothing lit, floor reading. */
export const SILENCE: { db: number; lit: number } = { db: -60, lit: 0 };

const LEDS = 12;
const FLOOR_DB = -60;
const HOLD_MS = 5000;

/**
 * Turn one sampled buffer into LEDs and dBFS: peak sample magnitude over the bar's -60..0 range.
 * @param samples float time-domain samples, nominally -1..1
 */
export function meterLevel(samples: Float32Array): { db: number; lit: number } {
  let max = 0;
  for (const sample of samples) max = Math.max(max, Math.abs(sample));
  const db = Math.max(FLOOR_DB, 20 * Math.log10(Math.max(max, 1e-6))); // → dBFS, floored at the bar
  const lit = Math.min(LEDS, Math.max(0, Math.ceil((db - FLOOR_DB) / 5))); // → LEDs over the range
  return { db, lit };
}

/**
 * The peak worth showing: a level at or above the hold refreshes it, otherwise the hold lapses
 * five seconds after its last refresh. Silence never refreshes a hold.
 */
export function holdPeak(held: Peak, lit: number, now: number): Peak {
  if (lit >= held.index && lit > 0) return { index: lit, at: now };
  if (now - held.at > HOLD_MS) return { index: lit, at: now };
  return held;
}

/**
 * The meter's next render state: the same object when nothing moved, so a quiet or paused
 * transport does not re-render ten times a second.
 */
export function nextMeterState(
  was: MeterState,
  live: { db: number; lit: number },
  held: Peak,
): MeterState {
  const db = Math.round(live.db);
  return was.lit === live.lit && was.peak === held.index && was.db === db
    ? was
    : { lit: live.lit, peak: held.index, db };
}

/**
 * Sample the tapped mix once into a level reading, reusing scratch so sampling never allocates.
 * @param scratch a ref whose current starts undefined; the first call allocates it
 */
export function sampleMeter(
  node: AnalyserNode,
  scratch: { current: Float32Array<ArrayBuffer> | undefined },
): { db: number; lit: number } {
  scratch.current ??= new Float32Array(node.fftSize);
  node.getFloatTimeDomainData(scratch.current);
  return meterLevel(scratch.current);
}

/**
 * Hang a listen-only analyser off Remotion's shared preview gain and hand it up; the returned
 * cleanup disconnects what it connected and hands null back up. Returns undefined where there is
 * nothing to tap (no shared context, as when rendering) or nobody listening.
 */
export function tapMeter(
  audioContext: AudioContext | null | undefined,
  gainNode: GainNode | null | undefined,
  onMeter: ((analyser: AnalyserNode | null) => void) | undefined,
): (() => void) | undefined {
  if (!onMeter || !audioContext || !gainNode) return undefined;
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  gainNode.connect(analyser);
  onMeter(analyser);
  return () => {
    gainNode.disconnect(analyser);
    onMeter(null);
  };
}
