import { expect, it } from 'vitest';
import type { CursorSample, CursorTrack } from './cursor';
import { cursorFixture } from './cursor.fixture';
import { cursorAt } from './cursor-motion';

function track(samples: CursorSample[], offsetMs = 0): CursorTrack {
  return { recording: { ...cursorFixture, assets: [...cursorFixture.assets], samples }, offsetMs };
}

const path = track([
  { timeMs: 100, cx: 0.1, cy: 0.8, assetId: 'arrow' },
  { timeMs: 200, cx: 0.9, cy: 0.2, assetId: 'arrow', interactionType: 'click' },
  { timeMs: 300, cx: 0.3, cy: 0.6, assetId: 'arrow' },
]);

it('interpolates source time with a signed offset and does not depend on seek order', () => {
  const delayed = { ...path, offsetMs: 50 };
  expect(cursorAt(delayed, 200, 'raw')).toMatchObject({ cx: 0.5, cy: 0.5 });
  expect(cursorAt(delayed, 250, 'smooth')).toMatchObject({ cx: 0.9, cy: 0.2 });
  expect(cursorAt(delayed, 200, 'raw')).toMatchObject({ cx: 0.5, cy: 0.5 });
  expect(cursorAt({ ...path, offsetMs: -50 }, 100, 'raw')).toMatchObject({ cx: 0.5, cy: 0.5 });
});

it('smooths movement without overshooting a reversal or moving recorded clicks', () => {
  expect(cursorAt(path, 175, 'raw')?.cx).toBeCloseTo(0.7);
  expect(cursorAt(path, 175, 'smooth')?.cx).toBeCloseTo(0.8125);
  expect(cursorAt(path, 200, 'smooth')).toMatchObject({ cx: 0.9, cy: 0.2 });
  for (const time of [101, 125, 175, 199, 201, 225, 275, 299]) {
    const pose = cursorAt(path, time, 'smooth');
    expect(pose?.cx).toBeGreaterThanOrEqual(0.1);
    expect(pose?.cx).toBeLessThanOrEqual(0.9);
    expect(pose?.cy).toBeGreaterThanOrEqual(0.2);
    expect(pose?.cy).toBeLessThanOrEqual(0.8);
  }
});

it('takes the last sample at a repeated timestamp and picks bitmaps by asset ID', () => {
  const cursor = track([
    { timeMs: 0, cx: 0.1, cy: 0.2, assetId: 'arrow' },
    { timeMs: 0, cx: 0.7, cy: 0.4, assetId: 'hand', cursorType: 'pointer' },
    { timeMs: 43, cx: 0.8, cy: 0.3, assetId: 'arrow', visible: false },
  ]);
  cursor.recording.assets.push({ ...cursorFixture.assets[0], id: 'hand', hotspotX: 0.75 });
  expect(cursorAt(cursor, 0, 'smooth')).toMatchObject({
    cx: 0.7,
    cy: 0.4,
    asset: { id: 'hand', hotspotX: 0.75 },
  });
  expect(cursorAt(cursor, 42, 'smooth')?.asset.id).toBe('hand');
  expect(cursorAt(cursor, 43, 'smooth')).toBeUndefined();
});

it('does not invent movement before, between disconnected intervals, or after tracking', () => {
  const cursor = track([
    { timeMs: 100, cx: 0.1, cy: 0.2, assetId: 'arrow' },
    { timeMs: 143, cx: 0.4, cy: 0.3, assetId: 'arrow' },
    { timeMs: 1000, cx: 0.9, cy: 0.7, assetId: 'arrow' },
  ]);
  expect(cursorAt(cursor, 99, 'smooth')).toBeUndefined();
  expect(cursorAt(cursor, 143, 'smooth')).toMatchObject({ cx: 0.4, cy: 0.3 });
  expect(cursorAt(cursor, 500, 'smooth')).toBeUndefined();
  expect(cursorAt(cursor, 1000, 'smooth')).toMatchObject({ cx: 0.9, cy: 0.7 });
  expect(cursorAt(cursor, 1078, 'smooth')).toMatchObject({ cx: 0.9, cy: 0.7 });
  expect(cursorAt(cursor, 2000, 'smooth')).toBeUndefined();
});

it('does not interpolate into hidden samples or invent missing cursor assets', () => {
  const cursor = track([
    { timeMs: 0, cx: 0.1, cy: 0.2, assetId: 'arrow' },
    { timeMs: 43, cx: 0.9, cy: 0.7, assetId: null, visible: false },
    { timeMs: 86, cx: 0.3, cy: 0.5, assetId: 'arrow' },
  ]);
  expect(cursorAt(cursor, 30, 'smooth')).toMatchObject({ cx: 0.1, cy: 0.2 });
  expect(cursorAt(cursor, 65, 'smooth')).toBeUndefined();
  expect(cursorAt(cursor, 86, 'smooth')).toMatchObject({ cx: 0.3, cy: 0.5 });
  expect(cursorAt(track([]), 0, 'smooth')).toBeUndefined();
  expect(cursorAt(track([{ timeMs: 0, cx: 0.1, cy: 0.2 }]), 0, 'raw')).toBeUndefined();
});

it('uses source rendering settings and suppresses a globally hidden cursor', () => {
  const raw: CursorTrack = { ...path, settings: { mode: 'raw', size: 2, hidden: false } };
  expect(cursorAt(raw, 175)?.cx).toBeCloseTo(0.7);
  expect(
    cursorAt({ ...raw, settings: { mode: 'raw', size: 2, hidden: true } }, 175),
  ).toBeUndefined();
});
