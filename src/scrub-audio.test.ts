import { describe, expect, it } from 'vitest';
import { mixAt, SLICE_MS, RESTART_MS } from './scrub-audio';
import { FPS, type Clip, type TrackDef } from './timeline-model';
import type { Asset } from './media';

const TRACKS: TrackDef[] = [
  { id: 'screen', label: 'Screen recording', kind: 'visual', role: 'screen' },
  { id: 'voice', label: 'Voiceover', kind: 'audio', gain: 1 },
  { id: 'music', label: 'Music', kind: 'audio', gain: 0.22 },
];

// A audio-source fixture; `over` can flip it to a silent asset, so the union is asserted.
const asset = (id: string, over: Partial<Asset> = {}): Asset =>
  ({
    id,
    name: id,
    kind: 'audio',
    url: `blob:${id}`,
    size: 1,
    width: 0,
    height: 0,
    duration: 60 * FPS,
    hasAudio: true,
    peaks: new Float32Array(0),
    thumbnail: '',
    ...over,
  }) as Asset;

const clip = (id: string, over: Partial<Clip> = {}): Clip => ({
  id,
  assetId: id,
  track: 'voice',
  start: 0,
  duration: 10 * FPS,
  offset: 0,
  ...over,
});

const ASSETS = [asset('voice'), asset('music'), asset('landscape', { hasAudio: false })];

describe('mixAt', () => {
  it('sounds an audio-track clip under the frame at its source time and mix gain', () => {
    const clips = [clip('voice', { start: 60, offset: 30 })];
    expect(mixAt(90, clips, TRACKS, [], ASSETS)).toEqual([
      { clip: 'voice', url: 'blob:voice', name: 'voice', at: 2, gain: 1 },
    ]);
  });

  it('applies the track gain and the clip gain, amplification above 1 included', () => {
    const clips = [clip('music', { track: 'music', gain: 12 })];
    const [slice] = mixAt(0, clips, TRACKS, [], ASSETS);
    expect(slice.gain).toBeCloseTo(0.22 * 10 ** (12 / 20), 6);
  });

  it('treats a missing clip gain as 0 dB', () => {
    const [slice] = mixAt(0, [clip('music', { track: 'music' })], TRACKS, [], ASSETS);
    expect(slice.gain).toBeCloseTo(0.22, 6);
  });

  it('scales every slice by the whole-recording gain, mute still silent', () => {
    const clips = [clip('voice'), clip('music', { track: 'music' })];
    const slices = mixAt(0, clips, TRACKS, [], ASSETS, 6);
    expect(slices[0].gain).toBeCloseTo(10 ** (6 / 20), 6);
    expect(slices[1].gain).toBeCloseTo(0.22 * 10 ** (6 / 20), 6);
    expect(mixAt(0, clips, TRACKS, ['voice'], ASSETS, 6)).toEqual([slices[1]]);
  });

  it('is silent outside the clip window, at its end frame included', () => {
    const clips = [clip('voice', { start: 60, duration: 30 })];
    expect(mixAt(59, clips, TRACKS, [], ASSETS)).toEqual([]);
    expect(mixAt(90, clips, TRACKS, [], ASSETS)).toEqual([]);
  });

  it('is silent on a muted track, on a visual track, and for an asset without audio', () => {
    const muted = mixAt(0, [clip('voice')], TRACKS, ['voice'], ASSETS);
    const visual = mixAt(0, [clip('landscape', { track: 'screen' })], TRACKS, [], ASSETS);
    const noAudio = mixAt(0, [clip('landscape')], TRACKS, [], ASSETS);
    expect(muted).toEqual([]);
    expect(visual).toEqual([]);
    expect(noAudio).toEqual([]);
  });

  it('lists every overlapping audio clip, two clips of one asset included', () => {
    const clips = [clip('voice'), clip('again', { assetId: 'voice', track: 'music', offset: 15 })];
    expect(mixAt(5, clips, TRACKS, [], ASSETS)).toEqual([
      { clip: 'voice', url: 'blob:voice', name: 'voice', at: 5 / FPS, gain: 1 },
      { clip: 'again', url: 'blob:voice', name: 'voice', at: 20 / FPS, gain: 0.22 },
    ]);
  });

  it('skips a clip whose asset is gone', () => {
    expect(mixAt(0, [clip('voice')], TRACKS, [], [])).toEqual([]);
  });

  it('keeps the shipped slice and throttle constants', () => {
    expect(SLICE_MS).toBe(90);
    expect(RESTART_MS).toBe(70);
  });
});
