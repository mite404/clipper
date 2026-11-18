import { expect, it } from 'vitest';
import type { Asset } from './media';
import { DEFAULT_TRACKS, moveTrack, type Clip, type TrackDef, type Zoom } from './timeline-model';
import { splitClip, insertClip } from './timeline-model';
import { moveZoom, resolveZooms } from './zoom-generation';

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
] satisfies Zoom[];
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

it('resolves legacy source timing and cover focus without requiring click metadata', () => {
  const zooms = resolveZooms([manual, ...anchored], clips, [asset], layout, DEFAULT_TRACKS);
  expect(zooms[0]).toEqual(manual);
  expect(zooms[1]).toMatchObject({
    start: 66,
    duration: 102,
    scale: 2,
    source: { assetId: 'screen', clipId: 'take', start: 21, x: 0.75, y: 0.2 },
  });
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

it('keeps V1 shots whole when a V3 clip covers them, then is moved behind or deleted', () => {
  const original = resolveZooms(anchored, clips, [asset], layout, screen2);
  // V3 covers frames 100 to 199 of the first 66+102 shot.
  const cover: Clip = {
    id: 'cover',
    assetId: 'screen',
    track: 's2',
    start: 100,
    offset: 0,
    duration: 100,
  };
  const covered = resolveZooms(original, [...clips, cover], [asset], layout, screen2);
  expect(covered).toEqual(original);
  const behind = moveTrack(moveTrack(screen2, 's2', -1), 's2', -1);
  expect(resolveZooms(covered, [...clips, cover], [asset], layout, behind)).toEqual(original);
  expect(resolveZooms(covered, clips, [asset], layout, screen2)).toEqual(original);
});

it('keeps a V3-anchored shot through Move down past V1 and back up', () => {
  // V1's take sits under the V3 take, so moving V3 behind V1 covers the anchored V3 clip.
  const both: Clip[] = [...clips, { ...clips[0], id: 'top', track: 's2' }];
  const shot = { ...anchored[0], id: 'auto-top', source: { ...anchored[0].source, clipId: 'top' } };
  const start = resolveZooms([shot], both, [asset], layout, screen2);
  expect(start).toEqual([shot]);
  let order = screen2;
  let zooms = start;
  for (const step of [-1, -1, 1, 1] as const) {
    order = moveTrack(order, 's2', step);
    zooms = resolveZooms(zooms, both, [asset], layout, order);
    expect(zooms).toEqual(start);
  }
  expect(order).toEqual(screen2);
});

it('moves a zoom within its free gap, keeping its duration and never jumping a neighbour', () => {
  const a: Zoom = { id: 'a', start: 0, duration: 30, scale: 2, x: 50, y: 50 };
  const b: Zoom = { ...a, id: 'b', start: 100 };
  const c: Zoom = { ...a, id: 'c', start: 200 };
  const zooms = [a, b, c];
  const startOf = (moved: Zoom[], id: string) => moved.find((z) => z.id === id)!.start;
  const move = (id: string, start: number) =>
    moveZoom(zooms, id, start, 300, clips, DEFAULT_TRACKS);
  expect(move('b', 150)).toEqual([a, { ...b, start: 150 }, c]);
  expect(startOf(move('b', 150.6), 'b')).toBe(151);
  // Between two neighbours, a request far past the next one stops at the near neighbour's edge.
  expect(startOf(move('b', 400), 'b')).toBe(170);
  expect(startOf(move('b', -50), 'b')).toBe(30);
  // The sequence bounds hold at both ends.
  expect(startOf(move('c', 999), 'c')).toBe(270);
  expect(startOf(move('a', -5), 'a')).toBe(0);
  expect(move('missing', 10)).toBe(zooms);
  // A zoom ending past a sequence that shrank under it stays put on a move right, not pulled left.
  const late = [{ ...a, id: 'late', start: 300, duration: 120 }];
  const nudge = (start: number) =>
    moveZoom(late, 'late', start, 360, clips, DEFAULT_TRACKS)[0].start;
  expect(nudge(301)).toBe(300);
  expect(nudge(290)).toBe(290);
});

it('moves a generated shot with its source anchor, and drops the anchor once it leaves its clip', () => {
  const resolved = resolveZooms(anchored, clips, [asset], layout, DEFAULT_TRACKS);
  const moved = moveZoom(resolved, 'auto-take-21', 76, 400, clips, DEFAULT_TRACKS);
  expect(moved[0]).toEqual({
    ...anchored[0],
    start: 76,
    source: { ...anchored[0].source, start: 31 },
  });
  // resolveZooms keeps the moved shot where it was dropped instead of snapping it back.
  expect(resolveZooms(moved, clips, [asset], layout, DEFAULT_TRACKS)).toEqual(moved);
  // Dragged into the next shot, it stops at that shot's edge and the anchor follows.
  const stopped = moveZoom(resolved, 'auto-take-21', 200, 400, clips, DEFAULT_TRACKS);
  expect(stopped[0]).toMatchObject({ start: 114, source: { start: 69 } });
  expect(resolveZooms(stopped, clips, [asset], layout, DEFAULT_TRACKS)).toEqual(stopped);
  // Before the take begins, the shot no longer lies inside its clip: it becomes a manual zoom.
  const outside = moveZoom(resolved, 'auto-take-21', 0, 400, clips, DEFAULT_TRACKS);
  const { source: _anchor, ...manualShot } = anchored[0];
  expect(outside[0]).toEqual({ ...manualShot, start: 0 });
  expect(resolveZooms(outside, clips, [asset], layout, DEFAULT_TRACKS)).toEqual(outside);
});
