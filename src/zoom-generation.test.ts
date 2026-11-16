import { expect, it } from 'vitest';
import type { Asset } from './media';
import type { Clip, Zoom } from './timeline-model';
import { splitClip, insertClip } from './timeline-model';
import { cursorFixture } from './cursor.fixture';
import { generateZooms, resolveZooms } from './zoom-generation';

const layout = { radius: 22, screenX: 25, screenY: 80, cameraX: 50, cameraY: 50 };
const asset: Asset = {
  id: 'screen',
  name: 'Synthetic screen',
  kind: 'video',
  url: 'blob:synthetic',
  width: 1600,
  height: 1000,
  duration: 900,
  peaks: [],
  thumbnail: '',
  hasAudio: false,
  cursor: {
    offsetMs: 100,
    recording: {
      ...cursorFixture,
      samples: [
        { timeMs: 1000, cx: 0.75, cy: 0.2, interactionType: 'click' },
        { timeMs: 1000, cx: 0.75, cy: 0.2, interactionType: 'click' },
        { timeMs: 1600, cx: 0.6, cy: 0.4, interactionType: 'mouseup' },
        { timeMs: 2000, cx: 0.65, cy: 0.3, interactionType: 'click' },
        { timeMs: 2100, cx: 0.65, cy: 0.3, interactionType: 'mouseup' },
        { timeMs: 6000, cx: 0.2, cy: 0.8, interactionType: 'click' },
        { timeMs: 6100, cx: 0.2, cy: 0.8, interactionType: 'mouseup' },
      ],
    },
  },
};
const clips: Clip[] = [
  { id: 'take', assetId: 'screen', track: 'screen', start: 60, offset: 15, duration: 225 },
];
const manual: Zoom = { id: 'manual', start: 0, duration: 30, scale: 1.5, x: 10, y: 90 };

it('groups nearby clicks, applies the source clock and projects focus through cover crop', () => {
  const zooms = generateZooms(clips, [asset], layout, [manual], 2, 60);
  expect(zooms).toHaveLength(3);
  expect(zooms[0]).toEqual(manual);
  // Click frames 33 and 63 merge: source span 21..123 -> timeline 66..168.
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
  expect(generateZooms(clips, [asset], layout, zooms, 2, 60)).toEqual(zooms);
});

it('preserves manual zooms and does not invent activity for empty or clipped-away clicks', () => {
  expect(generateZooms(clips, [{ ...asset, cursor: undefined }], layout, [manual])).toEqual([
    manual,
  ]);
  expect(generateZooms([{ ...clips[0], offset: 300, duration: 30 }], [asset], layout, [])).toEqual(
    [],
  );
  const occupying = { ...manual, start: 60, duration: 225 };
  expect(generateZooms(clips, [asset], layout, [occupying])).toEqual([occupying]);
});

it('keeps interior unpaired clicks but heuristically omits terminal clicks without changing raw samples', () => {
  const recording = {
    ...cursorFixture,
    samples: [
      { timeMs: 1000, cx: 0.7, cy: 0.2, interactionType: 'mouseup' },
      { timeMs: 2000, cx: 0.5, cy: 0.7, interactionType: 'click' },
      { timeMs: 2100, cx: 0.5, cy: 0.7, interactionType: 'mouseup' },
      { timeMs: 2100, cx: 0.5, cy: 0.7, interactionType: 'mouseup' },
      { timeMs: 6000, cx: 0.4, cy: 0.6, interactionType: 'click' },
      { timeMs: 6500, cx: 0.4, cy: 0.6, interactionType: 'move' },
      { timeMs: 7000, cx: 0.2, cy: 0.2, interactionType: 'click' },
    ],
  };
  const before = structuredClone(recording);
  const zooms = generateZooms(
    clips,
    [{ ...asset, cursor: { recording, offsetMs: 0 } }],
    layout,
    [],
  );
  expect(zooms).toHaveLength(2);
  expect(zooms[0].source?.x).toBe(0.5);
  expect(zooms[1].source?.x).toBe(0.4);
  expect(recording).toEqual(before);
});

it('keeps repeated uses independent and moves source shots on a ripple without moving manual zooms', () => {
  const repeated = [...clips, { ...clips[0], id: 'repeat', start: 400 }];
  const zooms = generateZooms(repeated, [asset], layout, [manual], 2, 60);
  expect(zooms).toHaveLength(5);
  const rippled = insertClip(repeated, { ...clips[0], id: 'insert', duration: 30 }, 0);
  const resolved = resolveZooms(zooms, rippled, [asset], layout);
  expect(resolved.map((z) => z.start)).toEqual([0, 96, 246, 436, 586]);
});

it('collapses consecutive downs until release without losing an independent released click', () => {
  const samples = [
    { timeMs: 1000, cx: 0.75, cy: 0.2, interactionType: 'click' },
    { timeMs: 1045, cx: 0.75, cy: 0.2, interactionType: 'click' },
    { timeMs: 1090, cx: 0.75, cy: 0.2, interactionType: 'click' },
    { timeMs: 1100, cx: 0.75, cy: 0.2, interactionType: 'mouseup' },
  ];
  const zooms = generateZooms(
    clips,
    [
      {
        ...asset,
        cursor: {
          offsetMs: 100,
          recording: { ...cursorFixture, samples },
        },
      },
    ],
    layout,
    [],
    2,
    60,
  );
  expect(zooms[0].duration).toBe(72);
  const closeAgain = [
    ...samples,
    { timeMs: 1130, cx: 0.6, cy: 0.3, interactionType: 'click' },
    { timeMs: 1200, cx: 0.6, cy: 0.3, interactionType: 'mouseup' },
  ];
  const second = generateZooms(
    clips,
    [
      {
        ...asset,
        cursor: {
          offsetMs: 100,
          recording: { ...cursorFixture, samples: closeAgain },
        },
      },
    ],
    layout,
    [],
    2,
    60,
  );
  expect(second[0].duration).toBe(76);
});

it('splits source shots with their footage and drops pieces below six frames', () => {
  const zooms = generateZooms(clips, [asset], layout, [], 2, 60);
  const split = splitClip(clips, 'take', 100);
  const resolved = resolveZooms(zooms, split, [asset], layout);
  expect(resolved.map((z) => [z.start, z.duration])).toEqual([
    [66, 34],
    [100, 68],
    [216, 69],
  ]);
  expect(new Set(resolved.map((z) => z.id)).size).toBe(3);
  expect(resolveZooms(resolved, split, [asset], layout)).toEqual(resolved);
  const short = splitClip(clips, 'take', 70);
  expect(resolveZooms(zooms, short, [asset], layout).map((z) => z.start)).toEqual([70, 216]);
});

it('reprojects source focus after crop and drops generated collisions behind manual zooms', () => {
  const zooms = generateZooms(clips, [asset], layout, [manual], 2, 60);
  const cropped = resolveZooms(zooms, clips, [asset], { ...layout, screenX: 100 });
  expect(cropped[1].x).toBeCloseTo(68.181818);
  const moved = [{ ...clips[0], start: 0 }];
  const resolved = resolveZooms(zooms, moved, [asset], layout);
  expect(resolved.map((z) => z.start)).toEqual([0, 156]);
  expect(resolveZooms(zooms, [], [asset], layout)).toEqual([manual]);
});

it('drops the later generated shot when an edit makes two source shots overlap', () => {
  const repeated = [...clips, { ...clips[0], id: 'repeat', start: 400 }];
  const zooms = generateZooms(repeated, [asset], layout, [], 2, 60);
  const overlapping = [clips[0], { ...repeated[1], start: 100 }];
  const resolved = resolveZooms(zooms, overlapping, [asset], layout);
  expect(resolved.map((zoom) => [zoom.start, zoom.duration])).toEqual([
    [66, 102],
    [216, 69],
  ]);
  expect(resolveZooms(resolved, overlapping, [asset], layout)).toEqual(resolved);
});
