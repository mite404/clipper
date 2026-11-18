import { expect, it } from 'vitest';
import type { Asset } from './media';
import { DEFAULT_TRACKS, type Clip, type TrackDef } from './timeline-model';
import { cursorFixture } from './cursor.fixture';
import { cursorFrame } from './cursor-render';

const asset = {
  id: 'capture',
  name: 'Synthetic capture',
  kind: 'video',
  url: 'blob:synthetic',
  size: 0,
  width: 1600,
  height: 1000,
  duration: 300,
  peaks: [],
  hasAudio: false,
  thumbnail: '',
  cursor: {
    recording: {
      ...cursorFixture,
      samples: [
        { timeMs: 0, cx: 0.6, cy: 0.1, assetId: 'arrow' },
        { timeMs: 100, cx: 0.9, cy: 0.3, assetId: 'arrow' },
        { timeMs: 200, cx: 0.1, cy: 0.7, assetId: 'arrow' },
      ],
    },
    offsetMs: 50,
    settings: { mode: 'raw', size: 2, hidden: false },
  },
} satisfies Asset;
const clips: Clip[] = [
  { id: 'a', assetId: 'capture', track: 'screen', start: 30, duration: 3, offset: 3 },
  { id: 'b', assetId: 'capture', track: 'screen', start: 33, duration: 3, offset: 6 },
];
const layout = { radius: 22, screenX: 25, screenY: 80, cameraX: 50, cameraY: 50 };

it('scales actual render coordinates, bitmap and fractional hotspot together at HD and 4K', () => {
  for (const [width, height, x, y, bitmap, hotspotX, hotspotY] of [
    [1920, 1080, 1169.475, 208.95, 2.1, 0.525, 1.05],
    [3840, 2160, 2338.95, 417.9, 4.2, 1.05, 2.1],
  ]) {
    const cursor = cursorFrame(clips, [asset], 30, layout, DEFAULT_TRACKS, { width, height });
    expect(cursor?.x).toBeCloseTo(x);
    expect(cursor?.y).toBeCloseTo(y);
    expect(cursor?.width).toBeCloseTo(bitmap);
    expect(cursor?.height).toBeCloseTo(bitmap);
    expect(cursor?.hotspotX).toBeCloseTo(hotspotX);
    expect(cursor?.hotspotY).toBeCloseTo(hotspotY);
    expect(cursor?.rotation).toBe(0);
  }
});

it('projects source-time cursor positions through cover crop and fractional scaled hotspots', () => {
  // 1600×1000 cover-fits at 0.7, crop x = -60. Source (0.75, 0.2) becomes (780, 140).
  const first = cursorFrame(clips, [asset], 30, layout, DEFAULT_TRACKS);
  expect(first?.x).toBeCloseTo(779.65);
  expect(first?.y).toBeCloseTo(139.3);
  expect(first?.width).toBeCloseTo(1.4);
  expect(first?.height).toBeCloseTo(1.4);
  expect(first?.imageDataUrl).toBe(cursorFixture.assets[0].imageDataUrl);
  // A source cut jumps directly to (0.5, 0.5), with no interpolation across timeline clips.
  expect(cursorFrame(clips, [asset], 33, layout, DEFAULT_TRACKS)?.x).toBeCloseTo(499.65);
  expect(cursorFrame(clips, [asset], 33, layout, DEFAULT_TRACKS)?.y).toBeCloseTo(349.3);
  expect(cursorFrame(clips, [asset], 30, { ...layout, swapped: true }, DEFAULT_TRACKS)).toEqual(
    first,
  );
  expect(cursorFrame(clips, [asset], 29, layout, DEFAULT_TRACKS)).toBeUndefined();
  expect(cursorFrame(clips, [asset], 36, layout, DEFAULT_TRACKS)).toBeUndefined();
});

it('returns to each trimmed clip start on its last rendered frame, including after a source cut', () => {
  const loop: Asset = {
    ...asset,
    cursor: { ...asset.cursor, settings: { mode: 'raw', size: 2, hidden: false, ending: 'loop' } },
  };
  expect(cursorFrame(clips, [loop], 32, layout, DEFAULT_TRACKS)).toEqual(
    cursorFrame(clips, [loop], 30, layout, DEFAULT_TRACKS),
  );
  expect(cursorFrame(clips, [loop], 35, layout, DEFAULT_TRACKS)).toEqual(
    cursorFrame(clips, [loop], 33, layout, DEFAULT_TRACKS),
  );
  expect(cursorFrame(clips, [loop], 35, layout, DEFAULT_TRACKS)).not.toEqual(
    cursorFrame(clips, [loop], 30, layout, DEFAULT_TRACKS),
  );
});

it('keeps hiding on source time through trimmed, cut and repeated uses with telemetry offset', () => {
  const hidden: Asset = {
    ...asset,
    cursor: {
      ...asset.cursor,
      settings: {
        ...asset.cursor.settings,
        hiddenRanges: [{ startMs: 100, endMs: 200 }],
      },
    },
  };
  const repeated: Clip[] = [...clips, { ...clips[0], id: 'repeat', start: 40 }];
  for (const frame of [30, 32, 40, 42])
    expect(cursorFrame(repeated, [hidden], frame, layout, DEFAULT_TRACKS)).toBeUndefined();
  expect(cursorFrame(repeated, [hidden], 33, layout, DEFAULT_TRACKS)?.x).toBeCloseTo(499.65);
  expect(cursorFrame(repeated, [hidden], 34, layout, DEFAULT_TRACKS)).toBeDefined();
});

it('leans around the scaled hotspot from source motion, resets at cuts and ignores seek order', () => {
  const rotating: Asset = {
    ...asset,
    cursor: { ...asset.cursor, settings: { ...asset.cursor.settings, rotate: true } },
  };
  expect(cursorFrame(clips, [asset], 31, layout, DEFAULT_TRACKS)).toMatchObject({ rotation: 0 });
  for (const [frame, rotation] of [
    [30, 0],
    [31, 12],
    [33, 0],
    [34, -12],
    [31, 12],
  ]) {
    expect(cursorFrame(clips, [rotating], frame, layout, DEFAULT_TRACKS)).toMatchObject({
      rotation,
      hotspotX: 0.35,
      hotspotY: 0.7,
    });
    expect(cursorFrame(clips, [rotating], frame, layout, DEFAULT_TRACKS)?.x).toBeCloseTo(
      cursorFrame(clips, [asset], frame, layout, DEFAULT_TRACKS)!.x,
    );
  }
  const advanced: Asset = { ...rotating, cursor: { ...rotating.cursor!, offsetMs: -50 } };
  expect(cursorFrame(clips, [advanced], 31, layout, DEFAULT_TRACKS)).toMatchObject({
    rotation: -12,
  });
});

it('keeps vertical or stopped movement upright and starts fresh after missing tracking', () => {
  const rotating: Asset = {
    ...asset,
    cursor: {
      ...asset.cursor,
      offsetMs: 0,
      settings: { ...asset.cursor.settings, rotate: true },
      recording: {
        ...asset.cursor.recording,
        samples: [
          { timeMs: 0, cx: 0.4, cy: 0.1, assetId: 'arrow' },
          { timeMs: 100, cx: 0.45, cy: 0.4, assetId: 'arrow' },
          { timeMs: 200, cx: 0.45, cy: 0.8, assetId: 'arrow' },
          { timeMs: 300, cx: 0.45, cy: 0.8, assetId: 'arrow' },
          { timeMs: 400, cx: 0.8, cy: 0.8, assetId: 'arrow', visible: false },
          { timeMs: 500, cx: 0.2, cy: 0.8, assetId: 'arrow' },
        ],
      },
    },
  };
  const continuous: Clip[] = [{ ...clips[0], start: 0, offset: 0, duration: 20 }];
  expect(cursorFrame(continuous, [rotating], 3, layout, DEFAULT_TRACKS)?.rotation).toBeCloseTo(6);
  expect(cursorFrame(continuous, [rotating], 6, layout, DEFAULT_TRACKS)).toMatchObject({
    rotation: 0,
  });
  expect(cursorFrame(continuous, [rotating], 9, layout, DEFAULT_TRACKS)).toMatchObject({
    rotation: 0,
  });
  expect(cursorFrame(continuous, [rotating], 12, layout, DEFAULT_TRACKS)).toBeUndefined();
  expect(cursorFrame(continuous, [rotating], 15, layout, DEFAULT_TRACKS)).toMatchObject({
    rotation: 0,
  });
});

it('draws the frontmost covering screen-role clip, on its own track, and only its telemetry', () => {
  const tracks: TrackDef[] = [
    ...DEFAULT_TRACKS,
    { id: 's2', label: 'Screen 2 · Masked', kind: 'visual', role: 'screen' },
  ];
  const bare: Asset = { ...asset, id: 'bare', cursor: undefined };
  const second: Clip[] = [{ ...clips[0], track: 's2' }];
  // Only V3 covers frame 30: its sidecar draws in V3's mask, at the same projection as V1.
  expect(cursorFrame(second, [asset], 30, layout, tracks)).toEqual({
    ...cursorFrame(clips, [asset], 30, layout, DEFAULT_TRACKS),
    track: 's2',
  });
  // V3 sits in front of V1: it owns the frame even without telemetry, so V1's hidden cursor is off.
  const stacked: Clip[] = [...clips, { ...clips[0], id: 'top', assetId: 'bare', track: 's2' }];
  expect(cursorFrame(stacked, [asset, bare], 30, layout, tracks)).toBeUndefined();
  expect(cursorFrame(stacked, [asset, bare], 33, layout, tracks)?.track).toBe('screen');
  // A front clip the renderer does not paint, here with no loaded source, never owns the cursor.
  const unpainted: Clip[] = [...clips, { ...clips[0], id: 'gone', assetId: 'gone', track: 's2' }];
  expect(cursorFrame(unpainted, [asset], 30, layout, tracks)).toEqual(
    cursorFrame(clips, [asset], 30, layout, DEFAULT_TRACKS),
  );
  // A camera clip never owns the cursor, whatever its paint order.
  const camera: Clip[] = [...clips, { ...clips[0], id: 'face', assetId: 'bare', track: 'camera' }];
  expect(cursorFrame(camera, [asset, bare], 30, layout, tracks)?.track).toBe('screen');
});
