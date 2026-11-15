import { describe, expect, it } from 'vitest';
import { splitClip, insertClip, zoomAt, trimClip, zoomCamera, type Clip } from './timeline';

const clip: Clip = {
  id: 'screen',
  assetId: 'a',
  track: 'screen',
  start: 30,
  duration: 150,
  offset: 60,
};

describe('editing a timeline in frames', () => {
  it('splits a trimmed clip without repeating or losing source frames', () => {
    expect(splitClip([clip], 'screen', 90)).toEqual([
      { ...clip, duration: 60 },
      { ...clip, id: 'screen-90', start: 90, duration: 90, offset: 120 },
    ]);
    expect(splitClip([clip], 'screen', 30)).toEqual([clip]);
    expect(splitClip([clip], 'screen', 180)).toEqual([clip]);
  });

  it('keeps clip IDs unique when a split repeats at a frame after a ripple insert', () => {
    const halves = splitClip([{ ...clip, start: 0 }], 'screen', 90);
    const rippled = insertClip(halves, { ...clip, id: 'new', duration: 60 }, 0);
    const ids = splitClip(rippled, 'screen', 90).map((c) => c.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it('inserts into a track and ripples later material, leaving other tracks alone', () => {
    const audio: Clip = { ...clip, id: 'voice', track: 'voice' };
    const next = insertClip([clip, audio], { ...clip, id: 'new', duration: 45, offset: 0 }, 90);
    expect(
      next.filter((c) => c.track === 'screen').map((c) => [c.start, c.duration, c.offset]),
    ).toEqual([
      [30, 60, 60],
      [135, 90, 120],
      [90, 45, 0],
    ]);
    expect(next.find((c) => c.id === 'voice')).toEqual(audio);
  });

  it('eases into a zoom, holds, and returns exactly to the uncropped frame', () => {
    const zoom = { id: 'z', start: 30, duration: 120, scale: 2, x: 25, y: 60 };
    expect(zoomAt([zoom], 29)).toBe(1);
    expect(zoomAt([zoom], 30)).toBe(1);
    expect(zoomAt([zoom], 45)).toBeGreaterThan(1);
    expect(zoomAt([zoom], 90)).toBe(2);
    expect(zoomAt([zoom], 150)).toBe(1);
  });

  it('shortens either edge without changing neighboring tracks or source timing', () => {
    expect(trimClip(clip, 'left', 45)).toEqual({ ...clip, start: 75, offset: 105, duration: 105 });
    expect(trimClip(clip, 'right', -45)).toEqual({ ...clip, duration: 105 });
    expect(trimClip(clip, 'left', 200).duration).toBe(1);
    expect(trimClip(clip, 'right', -200).duration).toBe(1);
    expect(trimClip(clip, 'left', -20)).toEqual(clip);
    expect(trimClip(clip, 'right', 20)).toEqual(clip);
  });

  it('centers the marked mouse at full zoom and returns without a pan jump', () => {
    const zoom = { id: 'z', start: 30, duration: 120, scale: 2, x: 25, y: 65 };
    expect(zoomCamera([zoom], 30)).toEqual({ scale: 1, x: 0, y: 0 });
    expect(zoomCamera([zoom], 90)).toEqual({ scale: 2, x: 50, y: -30 });
    expect(zoomCamera([zoom], 150)).toEqual({ scale: 1, x: 0, y: 0 });
    // Point 25%, 65% maps to the center after scaling around center and translating.
    const camera = zoomCamera([zoom], 90);
    expect((25 - 50) * camera.scale + 50 + camera.x).toBe(50);
    expect((65 - 50) * camera.scale + 50 + camera.y).toBe(50);
  });
});
