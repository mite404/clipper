import { expect, it } from 'vitest';
import type { Asset } from './media';
import type { Clip } from './timeline-model';
import { cursorFixture } from './cursor.fixture';
import { cursorFrame } from './cursor-render';

const asset = {
  id: 'capture',
  name: 'Synthetic capture',
  kind: 'video',
  url: 'blob:synthetic',
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

it('projects source-time cursor positions through cover crop and fractional scaled hotspots', () => {
  // 1600×1000 cover-fits at 0.7, crop x = -60. Source (0.75, 0.2) becomes (780, 140).
  const first = cursorFrame(clips, [asset], 30, layout);
  expect(first?.x).toBeCloseTo(779.65);
  expect(first?.y).toBeCloseTo(139.3);
  expect(first?.width).toBeCloseTo(1.4);
  expect(first?.height).toBeCloseTo(1.4);
  expect(first?.imageDataUrl).toBe(cursorFixture.assets[0].imageDataUrl);
  // A source cut jumps directly to (0.5, 0.5), with no interpolation across timeline clips.
  expect(cursorFrame(clips, [asset], 33, layout)?.x).toBeCloseTo(499.65);
  expect(cursorFrame(clips, [asset], 33, layout)?.y).toBeCloseTo(349.3);
  expect(cursorFrame(clips, [asset], 30, { ...layout, swapped: true })).toEqual(first);
  expect(cursorFrame(clips, [asset], 29, layout)).toBeUndefined();
  expect(cursorFrame(clips, [asset], 36, layout)).toBeUndefined();
});

it('returns to each trimmed clip start on its last rendered frame, including after a source cut', () => {
  const loop: Asset = {
    ...asset,
    cursor: { ...asset.cursor, settings: { mode: 'raw', size: 2, hidden: false, ending: 'loop' } },
  };
  expect(cursorFrame(clips, [loop], 32, layout)).toEqual(cursorFrame(clips, [loop], 30, layout));
  expect(cursorFrame(clips, [loop], 35, layout)).toEqual(cursorFrame(clips, [loop], 33, layout));
  expect(cursorFrame(clips, [loop], 35, layout)).not.toEqual(
    cursorFrame(clips, [loop], 30, layout),
  );
});
