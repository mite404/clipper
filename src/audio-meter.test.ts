import { describe, expect, it } from 'vitest';
import {
  SILENCE,
  holdPeak,
  meterLevel,
  nextMeterState,
  sampleMeter,
  tapMeter,
} from './audio-meter';

describe('meterLevel', () => {
  it('reads silence as the floored bar with nothing lit', () => {
    expect(meterLevel(new Float32Array([0, 0, 0, 0]))).toEqual({ db: -60, lit: 0 });
  });

  it('reads a full-scale peak as 0 dB with every LED lit', () => {
    expect(meterLevel(new Float32Array([1, -1, 0.2]))).toEqual({ db: 0, lit: 12 });
  });

  it('reads half scale near -6 dB', () => {
    const { db, lit } = meterLevel(new Float32Array([0.5, -0.1]));
    expect(db).toBeCloseTo(-6.02, 1);
    expect(lit).toBe(11);
  });
});

describe('holdPeak', () => {
  it('refreshes the hold on a level at or above it', () => {
    expect(holdPeak({ index: 4, at: 100 }, 6, 200)).toEqual({ index: 6, at: 200 });
    expect(holdPeak({ index: 6, at: 100 }, 6, 200)).toEqual({ index: 6, at: 200 });
  });

  it('keeps the hold while a lower level is inside five seconds', () => {
    const held = { index: 8, at: 1000 };
    expect(holdPeak(held, 3, 5999)).toBe(held);
  });

  it('lets the hold lapse to the live level after five seconds', () => {
    expect(holdPeak({ index: 8, at: 1000 }, 3, 6001)).toEqual({ index: 3, at: 6001 });
  });

  it('never lets silence refresh a hold', () => {
    const held = { index: 5, at: 1000 };
    expect(holdPeak(held, 0, 2000)).toBe(held);
  });
});

describe('nextMeterState', () => {
  const live = { db: -12.2, lit: 10 };
  const held = { index: 10, at: 500 };

  it('keeps the same state object when nothing moved', () => {
    const was = { lit: 10, peak: 10, db: -12 };
    expect(nextMeterState(was, live, held)).toBe(was);
  });

  it('rounds the dB readout and follows the held peak', () => {
    expect(nextMeterState({ lit: 0, peak: 0, db: -60 }, live, held)).toEqual({
      lit: 10,
      peak: 10,
      db: -12,
    });
  });
});

describe('sampleMeter', () => {
  // A fake analyser whose buffer the test fills itself.
  const fakeNode = (samples: number[]) =>
    ({
      fftSize: samples.length,
      getFloatTimeDomainData: (out: Float32Array) => out.set(samples),
    }) as unknown as AnalyserNode;

  it('reads the node through reused scratch', () => {
    const scratch: { current: Float32Array<ArrayBuffer> | undefined } = { current: undefined };
    const first = sampleMeter(fakeNode([0.5]), scratch);
    expect(first.lit).toBe(11);
    const buffer = scratch.current;
    expect(sampleMeter(fakeNode([0]), scratch)).toEqual(SILENCE);
    expect(scratch.current).toBe(buffer);
  });
});

describe('tapMeter', () => {
  const fakes = () => {
    const analyser = { fftSize: 0 } as unknown as AnalyserNode;
    const connected: unknown[] = [];
    const disconnected: unknown[] = [];
    const audioContext = {
      createAnalyser: () => analyser,
    } as unknown as AudioContext;
    const gainNode = {
      connect: (node: unknown) => connected.push(node),
      disconnect: (node: unknown) => disconnected.push(node),
    } as unknown as GainNode;
    return { analyser, connected, disconnected, audioContext, gainNode };
  };

  it('does nothing with nothing to tap or nobody listening', () => {
    const { audioContext, gainNode } = fakes();
    expect(tapMeter(null, gainNode, () => {})).toBeUndefined();
    expect(tapMeter(audioContext, null, () => {})).toBeUndefined();
    expect(tapMeter(audioContext, gainNode, undefined)).toBeUndefined();
  });

  it('connects a 512-bin analyser and hands it up until the cleanup runs', () => {
    const { analyser, connected, disconnected, audioContext, gainNode } = fakes();
    const seen: (AnalyserNode | null)[] = [];
    const release = tapMeter(audioContext, gainNode, (node) => seen.push(node));
    expect(analyser.fftSize).toBe(512);
    expect(connected).toEqual([analyser]);
    expect(seen).toEqual([analyser]);
    release?.();
    expect(disconnected).toEqual([analyser]);
    expect(seen).toEqual([analyser, null]);
  });
});
