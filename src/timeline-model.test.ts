import { describe, expect, it } from 'vitest';
import {
  FPS,
  backgroundImage,
  isReferenced,
  removeBackgroundImage,
  setBackgroundImage,
  initialSizing,
  scaleFromText,
  setSizing,
  GAIN_LIMITS,
  outputFrames,
  outputRate,
  outputTick,
  addChapter,
  chapterList,
  clipAt,
  clipPiece,
  editPoint,
  gainFactor,
  gainFromText,
  setGain,
  clock,
  covers,
  createTrack,
  paintOrder,
  placeMedia,
  removeChapter,
  retitleChapter,
  shownChapters,
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
  timecode,
  trackNumber,
  trimTo,
  trimBounds,
  trimClip,
  zoomAt,
  zoomCamera,
  ZOOM_CURVES,
  type ZoomCurve,
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

  it('eases a zoom with a curve by that cubic-bezier, mirrored on the way out', () => {
    const zoom = { id: 'z', start: 30, duration: 120, scale: 2, x: 25, y: 60 };
    const at = (curve: ZoomCurve, frame: number) => zoomAt([{ ...zoom, curve }], frame);
    // Control points on the diagonal make the bezier a straight line: a quarter ramp is a quarter.
    expect(at([0.2, 0.2, 0.8, 0.8], 36)).toBeCloseTo(1.25, 8);
    expect(at([0.2, 0.2, 0.8, 0.8], 144)).toBeCloseTo(1.25, 8);
    // The Smooth preset is today's smoothstep, so a zoom without a curve looks the same.
    for (const frame of [31, 36, 42, 47, 53, 140])
      expect(at(ZOOM_CURVES.Smooth, frame)).toBeCloseTo(zoomAt([zoom], frame), 8);
    // Ease in starts slow and Ease out starts fast, each the other turned end over end.
    expect(at(ZOOM_CURVES['Ease in'], 36)).toBeLessThan(1.25);
    expect(at(ZOOM_CURVES['Ease out'], 36)).toBeGreaterThan(1.25);
    expect(at(ZOOM_CURVES['Ease in'], 36) - 1).toBeCloseTo(2 - at(ZOOM_CURVES['Ease out'], 48), 8);
    // S-curve is symmetric about mid-ramp; Fast then settle covers most of the way early.
    expect(at(ZOOM_CURVES['S-curve'], 42)).toBeCloseTo(1.5, 8);
    expect(at(ZOOM_CURVES['Fast then settle'], 36)).toBeGreaterThan(1.6);
    // Ends and the hold are exact, so a curve never leaves a sliver of zoom outside the region.
    for (const curve of Object.values(ZOOM_CURVES)) {
      expect([at(curve, 30), at(curve, 54), at(curve, 90), at(curve, 150)]).toEqual([1, 2, 2, 1]);
    }
    // An instant zoom ignores its curve.
    expect(zoomAt([{ ...zoom, instant: true, curve: ZOOM_CURVES['Ease in'] }], 31)).toBe(2);
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
    // In picture in picture the camera inset paints last, even moved below a screen track.
    expect(paintOrder([tracks[2], second, tracks[0], tracks[1]], true).map((t) => t.id)).toEqual([
      'bg',
      'screen-2',
      'screen',
      'camera',
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
    // A new masked clip fits its mask; a new Background fills the frame; audio has no sizing.
    expect(place(video, { track: 'camera' }, 90)).toMatchObject({ clip: { fit: 'contain' } });
    expect(place(video, { create: 'background' }, 0)).toMatchObject({ clip: { fit: 'cover' } });
    const voice = place(audio, { track: 'voice' }, 0);
    expect('clip' in voice && 'fit' in voice.clip).toBe(false);
  });

  it('sizes clips per instance: snapped to 1% within 10% to 400%, 100% stored as no scale', () => {
    const fit = { ...clip, fit: 'contain' as const };
    expect(initialSizing({ id: 'a', label: 'A', kind: 'audio', gain: 1 })).toEqual({});
    expect(setSizing(fit, { scale: 1.234 })).toEqual({ ...fit, scale: 1.23 });
    expect(setSizing(fit, { scale: 0.01 })).toMatchObject({ scale: 0.1 });
    expect(setSizing(fit, { scale: 9 })).toMatchObject({ scale: 4 });
    expect(setSizing({ ...fit, scale: 2 }, { scale: 1 })).toEqual(fit);
    expect(['150', ' 7.5 ', '', 'abc'].map(scaleFromText)).toEqual([
      1.5,
      0.075,
      undefined,
      undefined,
    ]);
    expect(setSizing({ ...fit, scale: 2 }, { fit: 'cover' })).toEqual({
      ...fit,
      fit: 'cover',
      scale: 2,
    });
    // A split keeps both halves' sizing, and sizing one half leaves the other alone.
    const [left, right] = splitClip([{ ...fit, scale: 1.5 }], fit.id, fit.start + 10);
    expect([left.scale, right.scale, left.fit, right.fit]).toEqual([
      1.5,
      1.5,
      'contain',
      'contain',
    ]);
    expect(setSizing(right, { scale: 0.5 }).scale).toBe(0.5);
    expect(left.scale).toBe(1.5);
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

describe('timecodes at any length', () => {
  // [frame, timecode, clock], derived by hand at 30 fps. 59 and 61 sit either side of the first
  // minute, and 1799 and 1800 either side of the 30th, so a wrong rounding or carry shows.
  const cases: [number, string, string][] = [
    [0, '00:00:00', '00:00'],
    [1, '00:00:01', '00:00'],
    [29 * 30 + 29, '00:29:29', '00:29'],
    [59, '00:01:29', '00:01'],
    [61, '00:02:01', '00:02'],
    [1799, '00:59:29', '00:59'],
    [1800, '01:00:00', '01:00'],
    [(59 * 60 + 59) * 30 + 29, '59:59:29', '59:59'],
    [60 * 60 * 30, '1:00:00:00', '1:00:00'],
    [(99 * 60 + 59) * 30, '1:39:59:00', '1:39:59'],
    [105 * 60 * 30, '1:45:00:00', '1:45:00'],
    [24 * 60 * 60 * 30, '24:00:00:00', '24:00:00'],
  ];

  it.each(cases)('reads frame %i as %s, and to the second as %s', (frame, full, short) => {
    expect(timecode(frame)).toBe(full);
    expect(clock(frame)).toBe(short);
  });

  it('floors a fractional frame', () => {
    expect(timecode(30.9)).toBe('00:01:00');
    expect(clock(59.9)).toBe('00:01');
  });
});

describe('chapters', () => {
  const at = (...frames: number[]) =>
    frames.map((frame, i) => ({ frame, title: `Chapter ${i + 1}` }));

  it('adds in frame order, numbering past the titles already taken, and refuses a taken frame', () => {
    expect(addChapter([], 90)).toEqual([{ frame: 90, title: 'Chapter 1' }]);
    expect(addChapter(at(90), 30)).toEqual([
      { frame: 30, title: 'Chapter 2' },
      { frame: 90, title: 'Chapter 1' },
    ]);
    // Chapter 2 was deleted, so the next of two is named 3, not a second "Chapter 2".
    expect(
      addChapter(
        [
          { frame: 0, title: 'Chapter 1' },
          { frame: 9, title: 'Chapter 3' },
        ],
        60,
      ),
    ).toEqual([
      { frame: 0, title: 'Chapter 1' },
      { frame: 9, title: 'Chapter 3' },
      { frame: 60, title: 'Chapter 4' },
    ]);
    expect(addChapter(at(59), 59)).toBeNull();
    expect(addChapter(at(59), 60)).toHaveLength(2);
  });

  it('removes and retitles only the chapter at that frame, trimming and cutting the title', () => {
    expect(removeChapter(at(10, 20), 20)).toEqual(at(10));
    expect(removeChapter(at(10, 20), 15)).toEqual(at(10, 20));
    expect(retitleChapter(at(10, 20), 10, '  Intro ')).toEqual([
      { frame: 10, title: 'Intro' },
      { frame: 20, title: 'Chapter 2' },
    ]);
    expect(retitleChapter(at(10), 10, 'x'.repeat(250))[0].title).toHaveLength(200);
  });

  it('shows those before the end of the sequence, and a chapter at the last frame is still shown', () => {
    expect(shownChapters(at(0, 59, 60, 61), 60)).toEqual(at(0, 59));
    expect(shownChapters(at(0, 59), 60)).toHaveLength(2);
  });

  it('lists them as mm:ss titles, with 00:00 Start ahead of a first chapter that is not at 0', () => {
    const titled = [
      { frame: 0, title: 'Intro' },
      { frame: 59, title: 'Setup' },
      { frame: 61, title: 'Demo' },
      { frame: 3600 * 30, title: 'Q and A' },
    ];
    // 59 frames is still 00:01 and 61 is 00:02; an hour reads 1:00:00.
    expect(chapterList(titled, 3700 * 30)).toBe(
      '00:00 Intro\n00:01 Setup\n00:02 Demo\n1:00:00 Q and A',
    );
    expect(chapterList(titled.slice(1), 3700 * 30)).toBe(
      '00:00 Start\n00:01 Setup\n00:02 Demo\n1:00:00 Q and A',
    );
    // Chapters past the end are left out; with none shown there is no list, not a lone Start.
    expect(chapterList(titled, 61)).toBe('00:00 Intro\n00:01 Setup');
    expect(chapterList(titled.slice(2), 61)).toBe('');
    expect(chapterList([], 60)).toBe('');
  });
});

describe('clipAt', () => {
  const on = (id: string, track: string, start: number, duration: number): Clip => ({
    ...clip,
    id,
    track,
    start,
    duration,
  });
  const clips = [
    on('s', 'screen', 0, 60),
    on('c', 'camera', 30, 60),
    on('v', 'voice', 0, 90),
    on('s2', 'screen', 90, 30),
  ];

  it('takes the topmost video clip under the playhead, never audio, and nothing over a gap', () => {
    // Camera paints over screen. Screen alone at 29; both at 30; the camera clip ends before 90.
    expect(clipAt(clips, DEFAULT_TRACKS, [], 29)?.id).toBe('s');
    expect(clipAt(clips, DEFAULT_TRACKS, [], 30)?.id).toBe('c');
    expect(clipAt(clips, DEFAULT_TRACKS, [], 89)?.id).toBe('c');
    expect(clipAt(clips, DEFAULT_TRACKS, [], 90)?.id).toBe('s2');
    // Audio alone under the playhead selects nothing; neither does a gap.
    expect(clipAt([on('v', 'voice', 0, 90)], DEFAULT_TRACKS, [], 10)).toBeUndefined();
    expect(clipAt(clips, DEFAULT_TRACKS, [], 120)).toBeUndefined();
    expect(clipAt([], DEFAULT_TRACKS, [], 0)).toBeUndefined();
  });

  it('prefers a selected track that has a clip there, else falls back to the topmost video', () => {
    expect(clipAt(clips, DEFAULT_TRACKS, ['screen'], 45)?.id).toBe('s');
    expect(clipAt(clips, DEFAULT_TRACKS, ['voice'], 45)?.id).toBe('v');
    // Camera is selected but has no clip at 10, so the topmost video there is screen; at 45 both
    // are selected and the first track in the registry wins.
    expect(clipAt(clips, DEFAULT_TRACKS, ['camera'], 10)?.id).toBe('s');
    expect(clipAt(clips, DEFAULT_TRACKS, ['camera', 'screen'], 45)?.id).toBe('s');
  });
});

describe('trimTo', () => {
  // clip: timeline 30..179 shows source 60..209.
  it('moves the start to the playhead, or the end up to it, keeping source timing', () => {
    expect(trimTo(clip, 'left', 100)).toEqual({ ...clip, start: 100, offset: 130, duration: 80 });
    expect(trimTo(clip, 'right', 100)).toEqual({ ...clip, duration: 70 });
  });

  it('does nothing unless the playhead is inside the clip past its first frame', () => {
    for (const edge of ['left', 'right'] as const)
      for (const frame of [0, 29, 30, 180, 500])
        expect(trimTo(clip, edge, frame), `${edge} at ${frame}`).toBeUndefined();
  });

  it('keeps one frame at the extremes, on either side of the clip', () => {
    expect(trimTo(clip, 'left', 179)).toMatchObject({ start: 179, duration: 1, offset: 209 });
    expect(trimTo(clip, 'right', 31)).toMatchObject({ start: 30, duration: 1 });
    expect(trimTo(clip, 'left', 31)).toMatchObject({ start: 31, duration: 149 });
    expect(trimTo(clip, 'right', 179)).toMatchObject({ duration: 149 });
  });
});

describe('editPoint', () => {
  const on = (id: string, track: string, start: number, duration: number): Clip => ({
    ...clip,
    id,
    track,
    start,
    duration,
  });
  // Screen 10..40 and 70..100; camera 25..90 (ends mid-way). The sequence is 100 frames long.
  const clips = [on('a', 'screen', 10, 30), on('b', 'screen', 70, 30), on('c', 'camera', 25, 65)];
  const next = (frame: number, locked: string[] = []) => editPoint(clips, locked, 100, frame, 1);
  const prev = (frame: number, locked: string[] = []) => editPoint(clips, locked, 100, frame, -1);

  it('steps to the nearest start or end ahead, and from a point to the one after it', () => {
    // 0, 10, 25, 40, 70, 90, then the last frame 99 for the end of the sequence.
    expect([0, 9, 10, 24, 25, 39, 40, 69, 70, 89, 90].map((frame) => next(frame))).toEqual([
      10, 10, 25, 25, 40, 40, 70, 70, 90, 90, 99,
    ]);
  });

  it('steps to the nearest one behind, ending at frame 0', () => {
    expect([99, 91, 90, 71, 70, 41, 40, 26, 25, 11, 10, 1].map((frame) => prev(frame))).toEqual([
      90, 90, 70, 70, 40, 40, 25, 25, 10, 10, 0, 0,
    ]);
  });

  it('has nothing past either end', () => {
    expect(next(99)).toBeUndefined();
    expect(prev(0)).toBeUndefined();
    expect(editPoint([], [], 1, 0, 1)).toBeUndefined();
  });

  it('ignores the edges of a locked track, which still set the sequence length', () => {
    expect(next(0, ['screen'])).toBe(25);
    expect(next(25, ['screen'])).toBe(90);
    expect(prev(99, ['camera'])).toBe(70);
    expect([0, 70, 100].map((frame) => next(frame, ['screen', 'camera']))).toEqual([
      99,
      99,
      undefined,
    ]);
  });
});

describe('clip gain', () => {
  it('turns decibels into a linear factor, 10^(dB/20)', () => {
    // Derived by hand: -6 dB is a half of the amplitude, +6 about twice, -24 a sixteenth, +12 four times.
    expect(gainFactor()).toBe(1);
    expect(gainFactor(0)).toBe(1);
    expect(gainFactor(-6)).toBeCloseTo(0.501187, 5);
    expect(gainFactor(6)).toBeCloseTo(1.995262, 5);
    expect(gainFactor(-24)).toBeCloseTo(0.0630957, 6);
    expect(gainFactor(12)).toBeCloseTo(3.981072, 5);
  });

  it('sets a gain snapped to 0.5 dB and held inside -24..+12, and drops it at 0', () => {
    expect(setGain(clip, 6.2).gain).toBe(6);
    expect(setGain(clip, 6.3).gain).toBe(6.5);
    expect(setGain(clip, -0.3).gain).toBe(-0.5);
    expect(setGain(clip, 40).gain).toBe(GAIN_LIMITS.max);
    expect(setGain(clip, -99).gain).toBe(GAIN_LIMITS.min);
    expect(setGain(clip, 11.9).gain).toBe(12);
    // A value that rounds to 0 leaves no gain key at all, and setting it again changes nothing else.
    expect('gain' in setGain({ ...clip, gain: 3 }, 0.2)).toBe(false);
    expect(setGain({ ...clip, gain: 3 }, 0)).toEqual(clip);
    expect(setGain(setGain(clip, -4), 2)).toEqual({ ...clip, gain: 2 });
  });

  it('reads a field text as a gain, or nothing', () => {
    expect(gainFromText(' -6 ')).toBe(-6);
    expect(gainFromText('3.3')).toBe(3.5);
    expect(gainFromText('100')).toBe(12);
    for (const text of ['', '   ', 'abc', '--', 'Infinity'])
      expect(gainFromText(text)).toBeUndefined();
  });

  it('gives both halves of a split the clip gain', () => {
    const [left, right] = splitClip([{ ...clip, gain: -6 }], 'screen', 90);
    expect([left.gain, right.gain]).toEqual([-6, -6]);
  });
});

describe('output frame rates', () => {
  it('resolves 29.97 to NTSC 30000/1001 and Auto to the 30 fps project cadence', () => {
    expect(outputRate('29.97')).toEqual({ p: 30000, q: 1001 });
    expect(outputRate('auto')).toEqual({ p: 30, q: 1 });
    expect(outputRate('120')).toEqual({ p: 120, q: 1 });
  });

  it('counts output samples in whole-number rational arithmetic', () => {
    // 31 ticks is 1.0333 s: 62 samples at 60 fps and 124 at 120, never one extra from rounding.
    expect(outputFrames(31, outputRate('60'))).toBe(62);
    expect(outputFrames(31, outputRate('120'))).toBe(124);
    // An exact boundary adds no sample; a partial one adds one.
    expect(outputFrames(30, outputRate('24'))).toBe(24);
    expect(outputFrames(31, outputRate('24'))).toBe(25);
    // 1000 ticks at 30000/1001 is 999.001 samples, so a last short one: 1000, not 999.
    expect(outputFrames(1000, outputRate('29.97'))).toBe(1000);
    expect(outputFrames(300, outputRate('29.97'))).toBe(300);
    expect(outputFrames(90, outputRate('auto'))).toBe(90);
  });

  it('places each sample at its exact composition tick', () => {
    expect(outputTick(1, outputRate('60'))).toBe(0.5);
    expect(outputTick(3, outputRate('24'))).toBe(3.75);
    expect(outputTick(1000, outputRate('29.97'))).toBeCloseTo(1001, 9);
    expect(outputTick(7, outputRate('auto'))).toBe(7);
  });
});

describe('the background image', () => {
  const still = (id: string) => id.startsWith('img');
  const bg = {
    id: 'bg',
    label: 'Background · Full frame',
    kind: 'visual' as const,
    role: 'background' as const,
  };
  const clip = (id: string, assetId: string, track: string, start = 0, duration = 100) => ({
    id,
    assetId,
    track,
    start,
    duration,
    offset: 0,
  });

  it('has none without a Background track, or on an empty one, and says where one would go', () => {
    expect(backgroundImage(DEFAULT_TRACKS, [], still)).toEqual({ kind: 'none' });
    expect(backgroundImage([bg, ...DEFAULT_TRACKS], [], still)).toEqual({
      kind: 'none',
      track: 'bg',
    });
  });

  it('claims a lone still on the lowest Background track, and nothing else', () => {
    const tracks = [bg, ...DEFAULT_TRACKS];
    const lone = clip('c', 'img1', 'bg');
    expect(backgroundImage(tracks, [lone], still)).toEqual({ kind: 'image', clip: lone });
    // A video, a second clip, or a clip on a masked track is the timeline's, not the control's.
    expect(backgroundImage(tracks, [clip('v', 'landscape', 'bg')], still)).toEqual({
      kind: 'busy',
    });
    expect(backgroundImage(tracks, [lone, clip('d', 'img2', 'bg', 100)], still)).toEqual({
      kind: 'busy',
    });
    expect(backgroundImage(tracks, [clip('s', 'img1', 'screen')], still)).toEqual({
      kind: 'none',
      track: 'bg',
    });
    // A higher Background track is not the lowest: only the lowest is read.
    const upper = { ...bg, id: 'bg2', label: 'Background 2 · Full frame' };
    expect(
      backgroundImage([bg, upper, ...DEFAULT_TRACKS], [clip('u', 'img1', 'bg2')], still),
    ).toEqual({
      kind: 'none',
      track: 'bg',
    });
  });

  it('chooses by making the Background track beneath the pair and a cover clip for the timeline', () => {
    const base = [clip('s', 'landscape', 'screen', 0, 360)];
    const next = setBackgroundImage(DEFAULT_TRACKS, base, { kind: 'none' }, 'img1', 360);
    expect(next.tracks[0]).toMatchObject({ kind: 'visual', role: 'background' });
    expect(next.tracks).toHaveLength(DEFAULT_TRACKS.length + 1);
    const made = next.clips.find((c) => c.assetId === 'img1')!;
    expect(made).toMatchObject({
      track: next.tracks[0].id,
      start: 0,
      duration: 360,
      offset: 0,
      fit: 'cover',
    });
    // An empty Background track is used as it is.
    const empty = setBackgroundImage(
      [bg, ...DEFAULT_TRACKS],
      base,
      { kind: 'none', track: 'bg' },
      'img1',
      360,
    );
    expect(empty.tracks).toHaveLength(DEFAULT_TRACKS.length + 1);
    expect(empty.clips.find((c) => c.assetId === 'img1')?.track).toBe('bg');
  });

  it('replaces by swapping the asset and keeping the clip as it was, and removes only that clip', () => {
    const lone = { ...clip('c', 'img1', 'bg', 30, 200), fit: 'contain' as const, scale: 1.5 };
    const others = [clip('s', 'landscape', 'screen', 0, 360)];
    const tracks = [bg, ...DEFAULT_TRACKS];
    const swapped = setBackgroundImage(
      tracks,
      [lone, ...others],
      { kind: 'image', clip: lone },
      'img2',
      360,
    );
    expect(swapped.tracks).toBe(tracks);
    expect(swapped.clips).toEqual([{ ...lone, assetId: 'img2' }, ...others]);
    expect(removeBackgroundImage([lone, ...others], lone)).toEqual(others);
  });

  it('knows an asset is referenced by the edit or by any edit in history', () => {
    const now = [clip('a', 'img1', 'bg')];
    const before = [clip('b', 'img2', 'bg')];
    const older = [clip('c', 'img3', 'screen')];
    expect(isReferenced('img1', [{ clips: now }, { clips: before }, { clips: older }])).toBe(true);
    expect(isReferenced('img2', [{ clips: now }, { clips: before }, { clips: older }])).toBe(true);
    expect(isReferenced('img3', [{ clips: now }, { clips: before }, { clips: older }])).toBe(true);
    expect(isReferenced('img4', [{ clips: now }, { clips: before }, { clips: older }])).toBe(false);
    expect(isReferenced('img1', [])).toBe(false);
  });
});
