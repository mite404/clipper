import { describe, expect, it } from 'vitest';
import {
  FPS,
  clipPiece,
  covers,
  createTrack,
  paintOrder,
  placeMedia,
  DEFAULT_TRACKS,
  insertClip,
  lockedChange,
  moveTrack,
  overwrite,
  rulerMarks,
  snapFrame,
  splitWhere,
  sourceFrame,
  splitClip,
  trackNumber,
  trimBounds,
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
// Room on both sides, so a test names only the limit it exercises.
const open = { start: 0, end: 1000 };

// Pixels between each neighbouring pair of marks, and the frames between the first two.
const rulerGaps = (marks: number[], scale: number) =>
  marks.slice(1).map((mark, i) => ((mark - marks[i]) / FPS) * scale);
const rulerStep = (marks: number[]) => (marks.length > 1 ? marks[1] - marks[0] : FPS);

// What must hold of a ruler at any length and scale; each entry is a name and when it is broken.
const RULER_CHECKS: [string, (marks: number[], duration: number, scale: number) => boolean][] = [
  ['does not start at 0', (marks) => marks[0] !== 0],
  ['passes the end', (marks, duration) => marks.at(-1)! > duration],
  ['does not increase', (marks) => marks.some((mark, i) => i && mark <= marks[i - 1])],
  ['has marks under 64 px apart', (marks, _, scale) => rulerGaps(marks, scale).some((g) => g < 64)],
  [
    // Every second boundary carries a mark, so a label never skips the whole second it sits in.
    'steps by something other than a frame divisor of a second or whole seconds',
    (marks) => {
      const step = rulerStep(marks);
      return (step < FPS ? FPS % step : step % FPS) !== 0;
    },
  ],
  [
    // The 9-mark cap holds only until the ruler would go sparse, and then marks stay 160 px apart.
    'has over 9 marks closer than 160 px',
    (marks, _, scale) => marks.length > 9 && rulerGaps(marks, scale).some((g) => g < 160),
  ],
  [
    // Never a wide hole where a window could hold no mark, unless a single frame is the finest step.
    'leaves a 480 px gap that a finer step would close',
    (marks, _, scale) => rulerStep(marks) > 1 && rulerGaps(marks, scale).some((g) => g >= 480),
  ],
];

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
    expect(sourceFrame(trimClip(clip, 'left', 45, open), 100)).toBe(130);
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

  it('ripples only the insert track, from the frame on, whatever the other tracks hold', () => {
    const on = (id: string, track: string, start: number, duration: number): Clip => ({
      ...clip,
      id,
      track,
      start,
      duration,
      offset: 0,
    });
    // Around frame 90: one clip ends exactly there, one starts exactly there, one starts after it.
    const screen = [
      on('s-end', 'screen', 0, 90),
      on('s-at', 'screen', 90, 30),
      on('s-late', 'screen', 150, 20),
    ];
    const others = [
      on('v-late', 'voice', 120, 30), // starts after the frame
      on('m-at', 'music', 90, 25), // starts exactly at the frame
      on('c-cross', 'camera', 60, 60), // crosses the frame
    ];
    const next = insertClip([...screen, ...others], on('new', 'screen', 0, 45), 90);
    // The insert track ripples from the frame on: a clip that ends at 90 stays, one that starts at
    // 90 or later moves by the 45 frames, and nothing is split.
    expect(
      next.filter((c) => c.track === 'screen').map((c) => [c.id, c.start, c.duration]),
    ).toEqual([
      ['s-end', 0, 90],
      ['s-at', 135, 30],
      ['s-late', 195, 20],
      ['new', 90, 45],
    ]);
    // Every other track comes back as it was: later, at-the-frame and crossing clips alike.
    expect(next.filter((c) => c.track !== 'screen')).toEqual(others);

    // Inserting on camera at 90 splits only the camera clip that crosses it, and shifts only
    // camera clips; the screen clips that start at, cross or follow 90 are left whole.
    const onCamera = insertClip(
      [...screen, on('s-cross', 'screen', 60, 60), ...others],
      on('new', 'camera', 0, 45),
      90,
    );
    expect(onCamera.filter((c) => c.track === 'screen')).toEqual([
      ...screen,
      on('s-cross', 'screen', 60, 60),
    ]);
    expect(onCamera.filter((c) => c.track === 'camera').map((c) => [c.start, c.duration])).toEqual([
      [60, 30],
      [135, 30],
      [90, 45],
    ]);
    expect(onCamera.filter((c) => c.track === 'voice' || c.track === 'music')).toEqual(
      others.filter((c) => c.track !== 'camera'),
    );
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

  it('puts one ruler label on each whole second of a 6 s sequence, once each', () => {
    // 180 frames at 150 px/s: every second fits, so each reads once and sits at its own time.
    expect(rulerMarks(180, 150)).toEqual([0, 30, 60, 90, 120, 150, 180]);
  });

  it('keeps ruler marks distinct, increasing, 64 px apart and on a round step at any length and scale', () => {
    const faults: string[] = [];
    for (const duration of [1, 29, 30, 31, 180, 360, 3600, 108000, 2592000])
      for (const scale of [1, 5, 20.5, 66, 103.67, 400, 2000, 3000]) {
        const marks = rulerMarks(duration, scale);
        for (const [problem, broken] of RULER_CHECKS)
          if (broken(marks, duration, scale))
            faults.push(`${duration} frames at ${scale} px/s ${problem}`);
      }
    expect(faults).toEqual([]);
    expect(rulerMarks(1, 3000)).toEqual([0]);
  });

  it('drops a last mark that is not the end and sits within 20 px of it', () => {
    // 3610 s at 3 px/s: the 3600 s mark is 30 px from the end, so it stays...
    expect(rulerMarks(3610 * FPS, 3).at(-1)).toBe(3600 * FPS);
    // ...and at 0.5 px/s it is 5 px away (600 s steps stay 300 px apart, short of refining), so its wide label would overhang the padding.
    expect(rulerMarks(3610 * FPS, 0.5).at(-1)).toBe(3000 * FPS);
    // A mark exactly at the end always stays, and so does frame 0.
    expect(rulerMarks(3600 * FPS, 1).at(-1)).toBe(3600 * FPS);
    expect(rulerMarks(1, 0.5)).toEqual([0]);
  });

  it('steps a ruler by round seconds and ends on the largest step at or before the end', () => {
    // The 12 s demo: 2 s steps at fit scale on a wide window, 5 s steps on a narrow one.
    expect(rulerMarks(360, 103.67)).toEqual([0, 60, 120, 180, 240, 300, 360]);
    expect(rulerMarks(360, 20.5)).toEqual([0, 150, 300]);
  });

  it('keeps the 2 s demo steps up to a 320 px gap and refines to frames beyond it', () => {
    const step = (scale: number) => {
      const marks = rulerMarks(360, scale);
      return marks[1] - marks[0]; // → frames between marks
    };
    // 160 px/s: 2 s steps sit 320 px apart, the widest gap that is left alone.
    expect(step(160)).toBe(60);
    // Just past it, the smallest step 160 px apart or wider takes over: one second here.
    expect(step(161)).toBe(30);
    // 4x fit, 8x fit and the 32x maximum of the demo: 15, 10 and 2 frames.
    expect(step(361)).toBe(15);
    expect(step(723)).toBe(10);
    expect(step(2890)).toBe(2);
    // The finest step is one frame, so every frame of a very deep zoom carries a mark.
    expect(step(9000)).toBe(1);
  });

  it('marks every second boundary of a refined ruler, so each whole second keeps its label', () => {
    const marks = rulerMarks(360, 2890);
    expect(marks.filter((mark) => mark % FPS === 0)).toEqual(
      Array.from({ length: 13 }, (_, i) => i * FPS),
    );
    expect(marks.slice(0, 4)).toEqual([0, 2, 4, 6]);
    expect(marks.at(-1)).toBe(360);
  });

  it('moves either edge in both directions without changing source timing', () => {
    expect(trimClip(clip, 'left', 45, open)).toEqual({
      ...clip,
      start: 75,
      offset: 105,
      duration: 105,
    });
    expect(trimClip(clip, 'right', -45, open)).toEqual({ ...clip, duration: 105 });
    expect(trimClip(clip, 'left', -20, open)).toEqual({
      ...clip,
      start: 10,
      offset: 40,
      duration: 170,
    });
    expect(trimClip(clip, 'right', 20, open)).toEqual({ ...clip, duration: 170 });
    expect(trimClip(clip, 'left', 0, open)).toEqual(clip);
    expect(trimClip(clip, 'right', 0, open)).toEqual(clip);
    // Shorten then extend lands on the original clip.
    const shorter = trimClip(clip, 'right', -45, open);
    expect(trimClip(shorter, 'right', 45, open)).toEqual(clip);
  });

  it('rounds a fractional pointer delta to a whole frame on both edges, in both directions', () => {
    // clip: timeline 30..179 (end 180), source offset 60. A drag at a pixel is rarely a whole frame.
    const cases: [string, 'left' | 'right', number, number[]][] = [
      // [name, edge, delta, [start, offset, duration]]
      ['left, in, rounds up', 'left', 12.6, [43, 73, 137]],
      ['left, in, rounds down', 'left', 12.4, [42, 72, 138]],
      ['left, out, rounds up', 'left', -12.4, [18, 48, 162]],
      ['left, out, rounds down', 'left', -12.6, [17, 47, 163]],
      ['right, in, rounds down', 'right', -12.4, [30, 60, 138]],
      ['right, in, rounds up', 'right', -12.6, [30, 60, 137]],
      ['right, out, rounds up', 'right', 12.6, [30, 60, 163]],
      ['right, out, rounds down', 'right', 12.4, [30, 60, 162]],
    ];
    expect(cases.map(([, edge, delta]) => trimClip(clip, edge, delta, open))).toEqual(
      cases.map(([, , , [start, offset, duration]]) => ({ ...clip, start, offset, duration })),
    );
    // However fine the pointer, every trim lands on whole frames with the edge on the nearest one.
    for (let tenths = -200; tenths <= 200; tenths++) {
      const delta = tenths / 10;
      const left = trimClip(clip, 'left', delta, open);
      const right = trimClip(clip, 'right', delta, open);
      expect([left.start, left.offset, left.duration, right.duration].every(Number.isInteger)).toBe(
        true,
      );
      expect(left.start).toBe(Math.floor(30 + delta + 0.5));
      expect(right.start + right.duration).toBe(Math.floor(180 + delta + 0.5));
    }
  });

  it('rounds a fractional delta before it meets a bound or the one-frame minimum', () => {
    const bounds = { start: 25, end: 190 };
    // Left bound 25: -4.6 rounds onto it, -5.4 rounds past it and stops at it, -4.4 stays inside.
    expect(trimClip(clip, 'left', -4.6, bounds).start).toBe(25);
    expect(trimClip(clip, 'left', -5.4, bounds).start).toBe(25);
    expect(trimClip(clip, 'left', -4.4, bounds).start).toBe(26);
    // Right bound 190: 9.6 rounds onto it, 10.6 rounds past it and stops at it, 9.4 stays inside.
    expect(trimClip(clip, 'right', 9.6, bounds).duration).toBe(160);
    expect(trimClip(clip, 'right', 10.6, bounds).duration).toBe(160);
    expect(trimClip(clip, 'right', 9.4, bounds).duration).toBe(159);
    // One frame is the least a clip keeps: 148.6 rounds onto it, 150.6 rounds past it.
    expect(trimClip(clip, 'left', 148.6, open)).toMatchObject({ start: 179, duration: 1 });
    expect(trimClip(clip, 'left', 150.6, open)).toMatchObject({ start: 179, duration: 1 });
    expect(trimClip(clip, 'left', 147.4, open)).toMatchObject({ start: 177, duration: 3 });
    expect(trimClip(clip, 'right', -148.6, open).duration).toBe(1);
    expect(trimClip(clip, 'right', -150.4, open).duration).toBe(1);
    expect(trimClip(clip, 'right', -147.4, open).duration).toBe(3);
  });

  it('keeps one frame and stops an edge at its bounds', () => {
    expect(trimClip(clip, 'left', 200, open).duration).toBe(1);
    expect(trimClip(clip, 'left', 200, open).start).toBe(179);
    expect(trimClip(clip, 'right', -200, open).duration).toBe(1);
    const bounds = { start: 25, end: 190 };
    expect(trimClip(clip, 'left', -20, bounds)).toEqual({
      ...clip,
      start: 25,
      offset: 55,
      duration: 155,
    });
    expect(trimClip(clip, 'right', 20, bounds)).toEqual({ ...clip, duration: 160 });
  });

  it('limits edges by the source, frame 0 and the 24-hour cap, never by a neighbour', () => {
    // Source 60..210 sits at timeline 30..180 from a 300-frame source: head at -30, tail at 270.
    expect(trimBounds(clip, 300)).toEqual({ start: 0, end: 270 });
    expect(trimBounds(clip, 215)).toEqual({ start: 0, end: 185 });
    // The source head ends an outward left trim before frame 0 does.
    const late: Clip = { ...clip, start: 100, offset: 10 };
    expect(trimBounds(late, 300)).toEqual({ start: 90, end: 390 });
    // A still has no source limit, only frame 0 and the 24-hour cap.
    const still: Clip = { ...clip, start: 300, duration: 30, offset: 0 };
    expect(trimBounds(still, undefined)).toEqual({ start: 0, end: 24 * 60 * 60 * 30 });
    const grown = trimClip(still, 'left', -500, trimBounds(still, undefined));
    expect(grown).toEqual({ ...still, start: 0, duration: 330 });
    // A video with the same start and offset 0 keeps its source head at the clip start.
    expect(trimBounds(still, 1000).start).toBe(300);
    // Shortening raises the offset and extending lowers it again, never below 0.
    const shorter = trimClip(grown, 'left', 100, open);
    expect(shorter.offset).toBe(100);
    expect(trimClip(shorter, 'left', -500, trimBounds(shorter, undefined)).offset).toBe(0);
  });

  it('overwrites what a placed clip lands on, splitting, trimming or removing it', () => {
    const at = (id: string, start: number, duration: number, offset = 0): Clip => ({
      ...clip,
      id,
      start,
      duration,
      offset,
    });
    const [a, b, c] = [at('a', 0, 100), at('b', 100, 100, 10), at('c', 200, 100, 40)];
    const d: Clip = { ...at('d', 0, 300), track: 'camera' };
    const lane = [a, b, c, d];
    const put = (placed: Clip, items = lane) =>
      overwrite(items, placed, (x) => x.track === placed.track, 1, clipPiece);
    // Across two edges: the left one is cut short, the covered one goes, the right one loses its
    // head along with that much source. Another track's clip is never touched.
    const wide = at('p', 80, 140);
    expect(put(wide)).toEqual([
      { ...a, duration: 80 },
      { ...c, start: 220, duration: 80, offset: 60 },
      d,
      wide,
    ]);
    // Touching edges are left alone.
    expect(put(at('p', 100, 100))).toEqual([a, c, d, at('p', 100, 100)]);
    // Inside one clip: two pieces, the right one a unique ID that remembers its origin.
    const inside = at('p', 130, 20);
    const right = { ...b, id: 'b-150', originId: 'b', start: 150, duration: 50, offset: 60 };
    expect(put(inside)).toEqual([a, { ...b, duration: 30 }, right, c, d, inside]);
    expect(put(inside, [...lane, at('b-150', 900, 10)])[2].id).toBe('b-150.2');
    // A clip already in the list moves: its old copy goes, its place in the list stays.
    expect(put({ ...a, start: 150 })).toEqual([
      { ...a, start: 150 },
      { ...b, duration: 50 },
      { ...c, start: 250, duration: 50, offset: 90 },
      d,
    ]);
    // Onto another track, it overwrites that track's clips and leaves its old one free.
    expect(put({ ...d, track: 'screen', duration: 50 })).toEqual([
      { ...a, start: 50, duration: 50, offset: 50 },
      b,
      c,
      { ...d, track: 'screen', duration: 50 },
    ]);
    // An extended edge overwrites the neighbour it now reaches.
    const left = at('l', 0, 90);
    const reached = trimClip(left, 'right', 25, trimBounds(left, 180));
    expect(put(reached, [left, at('r', 90, 90, 90)])).toEqual([reached, at('r', 115, 65, 115)]);
  });

  it('drops a remnant shorter than the minimum and keeps the rest of an item as it was', () => {
    const z = {
      id: 'z',
      start: 0,
      duration: 100,
      scale: 2.5,
      x: 30,
      y: 70,
      follow: 'smooth' as const,
    };
    const small = { ...z, id: 's', start: 3, duration: 30, scale: 2 };
    const lane = () => true;
    expect(overwrite([z], { ...small, start: 3, duration: 97 }, lane, 6)).toEqual([
      { ...small, start: 3, duration: 97 },
    ]);
    expect(overwrite([z], { ...small, start: 3, duration: 97 }, lane, 1)).toEqual([
      { ...z, duration: 3 },
      { ...small, start: 3, duration: 97 },
    ]);
    // A remnant exactly the minimum stays.
    expect(overwrite([z], { ...small, start: 6, duration: 94 }, lane, 6)[0]).toEqual({
      ...z,
      duration: 6,
    });
    // A split keeps scale, focus and follow mode on both pieces.
    expect(overwrite([z], { ...small, start: 40 }, lane, 6)).toEqual([
      { ...z, duration: 40 },
      { ...z, id: 'z-70', start: 70, duration: 30 },
      { ...small, start: 40 },
    ]);
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
    expect(lockedChange([clip, v], [clip, trimClip(v, 'left', 5, open)], ['music', 'voice'])).toBe(
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

  it('places whole sources by kind, creating compatible tracks and refusing without moving', () => {
    const video = { assetId: 'v', audio: false, duration: 60 };
    const audio = { assetId: 'a', audio: true, duration: 30 };
    const lane = [{ ...clip, track: 'camera', start: 0, duration: 90 }];
    const place = (media: typeof video, target: Parameters<typeof placeMedia>[3], frame: number) =>
      placeMedia(DEFAULT_TRACKS, lane, media, target, frame);
    expect(place(video, { track: 'camera' }, 90)).toMatchObject({
      clip: { track: 'camera', start: 90, duration: 60, offset: 0 },
      tracks: DEFAULT_TRACKS,
    });
    expect(place(video, { track: 'camera' }, 89.6)).toMatchObject({ clip: { start: 90 } });
    // A source dropped over a clip overwrites the part it covers.
    expect(place(video, { track: 'camera' }, 89)).toMatchObject({
      clips: [
        { ...lane[0], duration: 89 },
        { track: 'camera', start: 89, duration: 60 },
      ],
    });
    expect(place(video, { track: 'voice' }, 0)).toEqual({
      refused: 'Voiceover takes audio media.',
      reason: 'kind',
    });
    expect(place(audio, { track: 'screen' }, 0)).toEqual({
      refused: 'Screen recording takes video or still media.',
      reason: 'kind',
    });
    expect(place(video, { track: 'gone' }, 0)).toEqual({
      refused: 'That track no longer exists.',
      reason: 'missing',
    });
    // Before frame 0 it lands at 0, and the clip it overwrites keeps its later source frames.
    expect(place(video, { track: 'camera' }, -40)).toMatchObject({
      clips: [{ ...lane[0], start: 60, duration: 30, offset: 120 }, { start: 0 }],
    });
    // Ending exactly at 24 hours fits; one frame later is refused, even on a new track.
    const day = 24 * 3600 * 30;
    expect(place(video, { track: 'camera' }, day - 60)).toMatchObject({
      clip: { start: day - 60 },
    });
    for (const target of [{ track: 'camera' }, { create: 'screen' as const }])
      expect(place(video, target, day - 59)).toEqual({
        refused: 'That would pass the 24-hour timeline.',
        reason: 'occupied',
      });
    const made = (media: typeof video, create: 'background' | 'screen' | 'audio') => {
      const result = place(media, { create }, -5);
      if ('refused' in result) throw new Error(result.refused);
      return result.tracks.find((t) => t.id === result.clip.track)!;
    };
    expect(made(video, 'background')).toMatchObject({ kind: 'visual', role: 'background' });
    expect(made(video, 'audio')).toMatchObject({ kind: 'visual', role: 'screen' });
    expect(made(audio, 'background')).toMatchObject({ kind: 'audio', gain: 1 });
    expect(place(video, { create: 'background' }, -5)).toMatchObject({ clip: { start: 0 } });
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
