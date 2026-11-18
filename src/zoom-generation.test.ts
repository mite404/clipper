import { expect, it } from 'vitest';
import type { Asset } from './media';
import { DEFAULT_TRACKS, type Clip, type TrackDef, type Zoom } from './timeline-model';
import { splitClip, insertClip } from './timeline-model';
import { moveZoom, resolveZooms } from './zoom-generation';
import type { AnchoredZoom } from './project';

const layout = { radius: 22, screenX: 25, screenY: 80, cameraX: 50, cameraY: 50 };
const asset: Asset = {
  id: 'screen',
  name: 'Synthetic screen',
  kind: 'video',
  url: 'blob:synthetic',
  size: 0,
  width: 1600,
  height: 1000,
  duration: 900,
  peaks: [],
  thumbnail: '',
  hasAudio: false,
};
const clips: Clip[] = [
  { id: 'take', assetId: 'screen', track: 'screen', start: 60, offset: 15, duration: 225 },
];
const manual: Zoom = { id: 'manual', start: 0, duration: 30, scale: 1.5, x: 10, y: 90 };
// Literal legacy shots keep compatibility tests independent of the removed click generator.
const anchored = [
  {
    id: 'auto-take-21',
    start: 66,
    duration: 102,
    scale: 2,
    x: 88.63636363636364,
    y: 20,
    follow: 'focused',
    source: { assetId: 'screen', clipId: 'take', start: 21, x: 0.75, y: 0.2 },
  },
  {
    id: 'auto-take-171',
    start: 216,
    duration: 69,
    scale: 2,
    x: 18.636363636363637,
    y: 80,
    follow: 'focused',
    source: { assetId: 'screen', clipId: 'take', start: 171, x: 0.2, y: 0.8 },
  },
] satisfies AnchoredZoom[];
const repeated = [...clips, { ...clips[0], id: 'repeat', start: 400 }];
const repeatedZooms = [
  ...anchored,
  ...anchored.map((zoom) => ({
    ...zoom,
    id: `repeat-${zoom.id}`,
    start: zoom.start + 340,
    source: { ...zoom.source, clipId: 'repeat' },
  })),
];

it('pins legacy shots at their resolved source timing and cover focus, dropping the anchor', () => {
  const zooms = resolveZooms([manual, ...anchored], clips, [asset], layout, DEFAULT_TRACKS);
  expect(zooms[0]).toEqual(manual);
  expect(zooms[1]).toMatchObject({ start: 66, duration: 102, scale: 2 });
  expect(zooms.filter((zoom) => 'source' in zoom)).toEqual([]);
  // 1600×1000 cover at .7: (840 - 60)/880 * 100, y = 20%.
  expect(zooms[1].x).toBeCloseTo(88.6363636);
  expect(zooms[1].y).toBeCloseTo(20);
  expect(zooms[2]).toMatchObject({ start: 216, duration: 69 });
  expect(resolveZooms(zooms, clips, [asset], layout, DEFAULT_TRACKS)).toEqual(zooms);
});

it('keeps repeated uses independent and moves source shots on a ripple without moving manual zooms', () => {
  const rippled = insertClip(repeated, { ...clips[0], id: 'insert', duration: 30 }, 0);
  const resolved = resolveZooms(
    [manual, ...repeatedZooms],
    rippled,
    [asset],
    layout,
    DEFAULT_TRACKS,
  );
  expect(resolved.map((z) => z.start)).toEqual([0, 96, 246, 436, 586]);
});

it('splits source shots with their footage and drops pieces below six frames', () => {
  const split = splitClip(clips, 'take', 100);
  const resolved = resolveZooms(anchored, split, [asset], layout, DEFAULT_TRACKS);
  expect(resolved.map((z) => [z.start, z.duration])).toEqual([
    [66, 34],
    [100, 68],
    [216, 69],
  ]);
  expect(new Set(resolved.map((z) => z.id)).size).toBe(3);
  expect(resolveZooms(resolved, split, [asset], layout, DEFAULT_TRACKS)).toEqual(resolved);
  const short = splitClip(clips, 'take', 70);
  expect(
    resolveZooms(anchored, short, [asset], layout, DEFAULT_TRACKS).map((z) => z.start),
  ).toEqual([70, 216]);
});

it('reprojects source focus after crop and drops generated collisions behind manual zooms', () => {
  const zooms = [manual, ...anchored];
  const cropped = resolveZooms(zooms, clips, [asset], { ...layout, screenX: 100 }, DEFAULT_TRACKS);
  expect(cropped[1].x).toBeCloseTo(68.181818);
  const moved = [{ ...clips[0], start: 0 }];
  const resolved = resolveZooms(zooms, moved, [asset], layout, DEFAULT_TRACKS);
  expect(resolved.map((z) => z.start)).toEqual([0, 156]);
  expect(resolveZooms(zooms, [], [asset], layout, DEFAULT_TRACKS)).toEqual([manual]);
});

it('drops the later generated shot when an edit makes two source shots overlap', () => {
  const overlapping = [clips[0], { ...repeated[1], start: 100 }];
  const resolved = resolveZooms(repeatedZooms, overlapping, [asset], layout, DEFAULT_TRACKS);
  expect(resolved.map((zoom) => [zoom.start, zoom.duration])).toEqual([
    [66, 102],
    [216, 69],
  ]);
  expect(resolveZooms(resolved, overlapping, [asset], layout, DEFAULT_TRACKS)).toEqual(resolved);
});

const screen2: TrackDef[] = [
  ...DEFAULT_TRACKS,
  { id: 's2', label: 'Screen 2 · Masked', kind: 'visual', role: 'screen' },
];

it('resolves a shot on a second screen track exactly as on V1', () => {
  const onTop: Clip[] = [{ ...clips[0], track: 's2' }];
  expect(resolveZooms(anchored, onTop, [asset], layout, screen2)).toEqual(
    resolveZooms(anchored, clips, [asset], layout, DEFAULT_TRACKS),
  );
});

it('moves a zoom over its neighbours, keeping its duration and overwriting what it lands on', () => {
  const a: Zoom = { id: 'a', start: 0, duration: 30, scale: 2, x: 50, y: 50 };
  const b: Zoom = { ...a, id: 'b', start: 100 };
  const c: Zoom = { ...a, id: 'c', start: 200 };
  const zooms = [a, b, c];
  const move = (id: string, start: number) => moveZoom(zooms, id, start, 300);
  expect(move('b', 150)).toEqual([a, { ...b, start: 150 }, c]);
  expect(move('b', 150.6)[1].start).toBe(151);
  // Over a neighbour's head it trims it; a remnant shorter than a zoom's minimum goes.
  expect(move('b', 190)).toEqual([a, { ...b, start: 190 }, { ...c, start: 220, duration: 10 }]);
  expect(move('b', 205)).toEqual([a, { ...b, start: 205 }]);
  // Covering a neighbour removes it; the sequence bounds still hold at both ends.
  expect(move('b', -50)).toEqual([{ ...b, start: 0 }, c]);
  expect(move('b', 999)).toEqual([a, { ...b, start: 270 }, c]);
  expect(move('missing', 10)).toBe(zooms);
  // A zoom ending past a sequence that shrank under it stays put on a move right, not pulled left.
  const late = [{ ...a, id: 'late', start: 300, duration: 120 }];
  const nudge = (start: number) => moveZoom(late, 'late', start, 360)[0].start;
  expect(nudge(301)).toBe(300);
  expect(nudge(290)).toBe(290);
});
