import { describe, expect, it } from 'vitest';
import {
  covers,
  createTrack,
  paintOrder,
  DEFAULT_TRACKS,
  insertClip,
  lockedChange,
  moveTrack,
  placeClip,
  snapFrame,
  splitWhere,
  sourceFrame,
  splitClip,
  trackNumber,
  trimClip,
  zoomAt,
  zoomCamera,
  zoomsOverlap,
  type Clip,
  type TrackDef,
} from './timeline-model';

const clip: Clip = {
  id: 'screen',
  assetId: 'a',
  track: 'screen',
  start: 30,
  duration: 150,
  offset: 60,
};

describe('editing a timeline in frames', () => {
  it('skips both ramps only for an instant zoom', () => {
    const zoom = { id: 'instant', start: 30, duration: 60, scale: 2, x: 40, y: 60, instant: true };
    expect([29, 30, 89, 90].map((frame) => zoomAt([zoom], frame))).toEqual([1, 2, 2, 1]);
    expect(zoomCamera([zoom], 30)).toEqual({ scale: 2, x: 20, y: -20 });
  });

  it('splits a trimmed clip without repeating or losing source frames', () => {
    expect(splitClip([clip], 'screen', 90)).toEqual([
      { ...clip, originId: 'screen', duration: 60 },
      { ...clip, originId: 'screen', id: 'screen-90', start: 90, duration: 90, offset: 120 },
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

  it('maps a timeline frame to the same source frame through splits and left trims', () => {
    // clip: timeline 30..179 shows source 60..209.
    expect(sourceFrame(clip, 30)).toBe(60);
    expect(sourceFrame(clip, 100)).toBe(130);
    const [left, right] = splitClip([clip], 'screen', 90);
    expect(sourceFrame(left, 89)).toBe(119);
    expect(sourceFrame(right, 90)).toBe(120);
    expect(sourceFrame(trimClip(clip, 'left', 45), 100)).toBe(130);
    expect([29, 30, 179, 180].map((frame) => covers(clip, frame))).toEqual([
      false,
      true,
      true,
      false,
    ]);
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

  it('ramps over 24 frames on a smoothstep curve, in and out', () => {
    const zoom = { id: 'z', start: 30, duration: 120, scale: 2, x: 25, y: 60 };
    expect(zoomAt([zoom], 36)).toBeCloseTo(1.15625, 10); // a linear ramp would give 1.25
    expect(zoomAt([zoom], 42)).toBe(1.5);
    expect(zoomAt([zoom], 53)).toBeLessThan(2);
    expect(zoomAt([zoom], 54)).toBe(2);
    expect(zoomAt([zoom], 126)).toBe(2);
    expect(zoomAt([zoom], 138)).toBe(1.5);
    expect(zoomAt([zoom], 149)).toBeCloseTo(1.00506, 4);
  });

  it('gives a short zoom half its length to ramp, so it peaks only at its midpoint', () => {
    const zoom = { id: 'z', start: 100, duration: 20, scale: 3, x: 50, y: 50 };
    expect(zoomAt([zoom], 109)).toBeLessThan(3);
    expect(zoomAt([zoom], 110)).toBe(3);
    expect(zoomAt([zoom], 111)).toBeLessThan(3);
  });

  it('pans toward the focus in step with the ramp instead of jumping to it', () => {
    const zoom = { id: 'z', start: 30, duration: 120, scale: 2, x: 25, y: 65 };
    expect(zoomCamera([zoom], 31).x).toBeGreaterThan(0);
    expect(zoomCamera([zoom], 31).x).toBeLessThan(1);
    expect(zoomCamera([zoom], 42).x).toBeCloseTo(18.75, 10);
    expect(zoomCamera([zoom], 42).y).toBeCloseTo(-11.25, 10);
  });

  it('detects overlapping zooms, but not touching ones or the zoom being edited', () => {
    const zooms = [{ id: 'a', start: 30, duration: 60, scale: 2, x: 50, y: 50 }];
    expect(zoomsOverlap(zooms, { id: 'b', start: 0, duration: 30 })).toBe(false);
    expect(zoomsOverlap(zooms, { id: 'b', start: 90, duration: 30 })).toBe(false);
    expect(zoomsOverlap(zooms, { id: 'b', start: 0, duration: 31 })).toBe(true);
    expect(zoomsOverlap(zooms, { id: 'b', start: 89, duration: 30 })).toBe(true);
    expect(zoomsOverlap(zooms, { id: 'b', start: 40, duration: 6 })).toBe(true);
    expect(zoomsOverlap(zooms, { id: 'a', start: 40, duration: 60 })).toBe(false);
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

  it('cuts only targeted clips that strictly cross the frame, with unique right IDs', () => {
    const lanes: Clip[] = [
      { ...clip, id: 'a', start: 0, duration: 60 },
      { ...clip, id: 'a-30', start: 60, duration: 30 },
      { ...clip, id: 'v', track: 'voice', start: 10, duration: 50 },
      { ...clip, id: 'm', track: 'music', start: 30, duration: 30 },
    ];
    const cut = splitWhere(lanes, 30, (c) => c.track !== 'voice');
    expect(cut.map((c) => [c.id, c.start, c.duration, c.offset])).toEqual([
      ['a', 0, 30, 60],
      ['a-30.2', 30, 30, 90],
      ['a-30', 60, 30, 60],
      ['v', 10, 50, 60],
      ['m', 30, 30, 60],
    ]);
    expect(new Set(cut.map((c) => c.id)).size).toBe(cut.length);
    expect(splitWhere(lanes, 60, () => true)).toBe(lanes);
    expect(splitWhere(lanes, 95, () => true)).toBe(lanes);
  });

  it('names the first locked track whose clips changed, ignoring order and other tracks', () => {
    const v: Clip = { ...clip, id: 'v', track: 'voice' };
    expect(lockedChange([clip, v], [v, clip], ['voice'])).toBeUndefined();
    expect(lockedChange([clip, v], splitClip([clip, v], 'screen', 90), ['voice'])).toBeUndefined();
    expect(lockedChange([clip, v], [clip, trimClip(v, 'left', 5)], ['music', 'voice'])).toBe(
      'voice',
    );
    expect(lockedChange([clip, v], [clip], ['voice'])).toBe('voice');
  });

  it('snaps to the nearest target inside the radius and prefers the first on a tie', () => {
    expect(snapFrame(50, [40, 57], 8)).toBe(57);
    expect(snapFrame(50, [42, 58], 8)).toBe(42);
    expect(snapFrame(50, [58, 42], 8)).toBe(58);
    expect(snapFrame(50, [41, 59], 8)).toBe(50);
    expect(snapFrame(50, [], 8)).toBe(50);
  });
});

describe('the track registry', () => {
  const bg = { id: 'bg', label: 'Background · Full frame', kind: 'visual', role: 'background' };
  const tracks = [bg, ...DEFAULT_TRACKS] as TrackDef[];

  it('numbers visual tracks bottom to top and audio tracks in order', () => {
    expect(
      ['bg', 'screen', 'camera', 'voice', 'music'].map((id) => trackNumber(tracks, id)),
    ).toEqual(['V1', 'V2', 'V3', 'A1', 'A2']);
  });

  it('places a clip only where its track is free, allowing exact adjacency', () => {
    const lane = [{ ...clip, track: 'camera', start: 30, duration: 60 }];
    const at = (start: number, duration = 30) => ({
      ...clip,
      id: 'new',
      track: 'camera',
      start,
      duration,
    });
    expect(placeClip(lane, at(0))).toEqual([...lane, at(0)]);
    expect(placeClip(lane, at(90))).toEqual([...lane, at(90)]);
    expect(placeClip(lane, at(1))).toBeNull();
    expect(placeClip(lane, at(89))).toBeNull();
    expect(placeClip(lane, at(0, 200))).toBeNull();
    // Another track's clip at the same time never collides.
    expect(placeClip(lane, { ...at(40), track: 'screen' })).toHaveLength(2);
  });

  it('creates a background beneath, a masked screen in front, and audio last, with fresh IDs', () => {
    const background = createTrack(DEFAULT_TRACKS, 'background');
    expect(background.tracks.map((t) => t.id)).toEqual([
      background.id,
      'screen',
      'camera',
      'voice',
      'music',
    ]);
    expect(background.tracks[0]).toMatchObject({ kind: 'visual', role: 'background' });
    const screen = createTrack(background.tracks, 'screen');
    expect(screen.tracks.map((t) => t.id).slice(0, 4)).toEqual([
      background.id,
      'screen',
      'camera',
      screen.id,
    ]);
    const audio = createTrack(screen.tracks, 'audio');
    expect(audio.tracks.at(-1)).toEqual({
      id: audio.id,
      label: expect.any(String),
      kind: 'audio',
      gain: 1,
    });
    const ids = audio.tracks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(audio.tracks.map((t) => t.label)).size).toBe(ids.length);
  });

  it('paints back to front, with only the lowest track of each mask role painting its mask', () => {
    const second = { id: 'screen-2', label: 'Screen 2', kind: 'visual', role: 'screen' } as const;
    expect(paintOrder([...tracks, second])).toEqual([
      { id: 'bg', role: 'background', placeholder: false },
      { id: 'screen', role: 'screen', placeholder: true },
      { id: 'camera', role: 'camera', placeholder: true },
      { id: 'screen-2', role: 'screen', placeholder: false },
    ]);
  });

  it('moves a track only past a neighbour of its own kind', () => {
    const order = (list: TrackDef[]) => list.map((t) => t.id);
    expect(order(moveTrack(tracks, 'bg', 1))).toEqual(['screen', 'bg', 'camera', 'voice', 'music']);
    expect(order(moveTrack(tracks, 'camera', -1))).toEqual([
      'bg',
      'camera',
      'screen',
      'voice',
      'music',
    ]);
    expect(moveTrack(tracks, 'camera', 1)).toBe(tracks);
    expect(moveTrack(tracks, 'bg', -1)).toBe(tracks);
    expect(moveTrack(tracks, 'voice', -1)).toBe(tracks);
    expect(order(moveTrack(tracks, 'music', -1))).toEqual([
      'bg',
      'screen',
      'camera',
      'music',
      'voice',
    ]);
  });
});
