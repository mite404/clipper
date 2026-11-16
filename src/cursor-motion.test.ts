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

it('shortens animated travel without retiming clicks, raw motion or arbitrary source seeks', () => {
  const original = structuredClone(path.recording);
  for (const [animationStyle, x] of [
    ['smooth', 0.8125],
    ['medium', 0.7518518518518519],
    ['rapid', 0.6],
    ['none', 0.1],
  ] as const) {
    const styled: CursorTrack = {
      ...path,
      offsetMs: 50,
      settings: { mode: 'smooth', size: 1, hidden: false, animationStyle },
    };
    expect(cursorAt(styled, 250)).toMatchObject({ cx: 0.9, cy: 0.2 });
    expect(cursorAt(styled, 225)?.cx).toBeCloseTo(x);
    expect(cursorAt(styled, 225, 'raw')?.cx).toBeCloseTo(0.7);
    expect(cursorAt(styled, 150)).toMatchObject({ cx: 0.1, cy: 0.8 });
    expect(cursorAt(styled, 225)?.cx).toBeCloseTo(x);
    expect(cursorAt({ ...styled, offsetMs: -50 }, 125)?.cx).toBeCloseTo(x);
    expect(cursorAt(styled, 149)).toBeUndefined();
  }
  expect(path.recording).toEqual(original);
});

it('holds None until the next sample and leaves gaps and visibility unchanged for every speed style', () => {
  for (const animationStyle of ['smooth', 'medium', 'rapid', 'none'] as const) {
    const styled: CursorTrack = {
      ...track([
        { timeMs: 0, cx: 0.1, cy: 0.8, assetId: 'arrow' },
        { timeMs: 100, cx: 0.9, cy: 0.2, assetId: 'arrow' },
        { timeMs: 200, cx: 0.4, cy: 0.6, assetId: 'arrow', visible: false },
        { timeMs: 600, cx: 0.7, cy: 0.3, assetId: 'arrow' },
      ]),
      settings: { mode: 'smooth', size: 1, hidden: false, animationStyle },
    };
    expect(cursorAt(styled, 150)).toMatchObject({ cx: 0.9, cy: 0.2 });
    expect(cursorAt(styled, 200)).toBeUndefined();
    expect(cursorAt(styled, 500)).toBeUndefined();
    expect(cursorAt(styled, 600)).toMatchObject({ cx: 0.7, cy: 0.3 });
    expect(cursorAt(styled, 99.999)?.cx).toBeCloseTo(animationStyle === 'none' ? 0.1 : 0.9, 3);
    expect(cursorAt(styled, 100)).toMatchObject({ cx: 0.9, cy: 0.2 });
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

it('hides a stationary cursor after idle time but shows clicks and resumed motion on arbitrary seeks', () => {
  const cursor = track(
    Array.from({ length: 27 }, (_, i) => ({
      timeMs: i * 100,
      cx: i < 19 ? 0.2 : 0.7,
      cy: 0.6,
      assetId: 'arrow',
      interactionType: i === 5 ? 'click' : 'move',
    })),
    50,
  );
  const idle = {
    ...cursor,
    settings: { mode: 'smooth', size: 1, hidden: false, hideIdle: true },
  } satisfies CursorTrack;
  expect(cursorAt(idle, 1750)).toBeUndefined();
  expect(cursorAt(idle, 1950)).toMatchObject({ cx: 0.7, cy: 0.6 });
  expect(cursorAt(idle, 1350)).toMatchObject({ cx: 0.2, cy: 0.6 });
  expect(cursorAt(cursor, 1750)).toMatchObject({ cx: 0.2, cy: 0.6 });
  expect(cursor.recording.samples[5].interactionType).toBe('click');
});

it('removes small shakes without moving clicks, deliberate travel, or the original recording', () => {
  const cursor = track([
    { timeMs: 0, cx: 0.2, cy: 0.6, assetId: 'arrow' },
    { timeMs: 100, cx: 0.202, cy: 0.597, assetId: 'arrow', interactionType: 'move' },
    { timeMs: 200, cx: 0.199, cy: 0.602, assetId: 'arrow' },
    { timeMs: 300, cx: 0.203, cy: 0.6, assetId: 'arrow', interactionType: 'click' },
    { timeMs: 400, cx: 0.201, cy: 0.599, assetId: 'arrow' },
    { timeMs: 500, cx: 0.7, cy: 0.3, assetId: 'arrow' },
  ]);
  const original = structuredClone(cursor.recording);
  const steady = {
    ...cursor,
    settings: { mode: 'raw', size: 1, hidden: false, removeShakes: true },
  } satisfies CursorTrack;
  expect(cursorAt(steady, 200)).toMatchObject({ cx: 0.2, cy: 0.6 });
  expect(cursorAt(steady, 300)).toMatchObject({ cx: 0.203, cy: 0.6 });
  expect(cursorAt(steady, 500)).toMatchObject({ cx: 0.7, cy: 0.3 });
  expect(cursorAt(steady, 400)).toMatchObject({ cx: 0.203, cy: 0.6 });
  expect(cursorAt(cursor, 200)).toMatchObject({ cx: 0.199, cy: 0.602 });
  expect(cursor.recording).toEqual(original);
});

it('can retain recorded PNG changes, fix the first captured shape, or use a centered touch indicator', () => {
  const cursor = track([
    { timeMs: 0, cx: 0.2, cy: 0.6, assetId: 'arrow' },
    { timeMs: 100, cx: 0.7, cy: 0.3, assetId: 'hand' },
  ]);
  cursor.recording.assets.push({ ...cursorFixture.assets[0], id: 'hand', hotspotX: 0.75 });
  const fixed = {
    ...cursor,
    settings: { mode: 'raw', size: 1, hidden: false, style: 'default' },
  } satisfies CursorTrack;
  expect(cursorAt(fixed, 100)?.asset.id).toBe('arrow');
  expect(cursorAt(cursor, 100)?.asset.id).toBe('hand');
  const touch = {
    ...cursor,
    settings: { mode: 'raw', size: 1, hidden: false, style: 'touch' },
  } satisfies CursorTrack;
  expect(cursorAt(touch, 100)).toMatchObject({
    cx: 0.7,
    cy: 0.3,
    asset: { width: 32, height: 32, hotspotX: 16, hotspotY: 16 },
  });
  expect(cursorAt(touch, 100)?.asset.imageDataUrl).not.toBe(cursorFixture.assets[0].imageDataUrl);
});

it('stabilizes short shape changes on the source clock without rewriting telemetry or seek history', () => {
  const cursor = track(
    [
      { timeMs: 0, cx: 0.2, cy: 0.6, assetId: 'arrow' },
      { timeMs: 40, cx: 0.3, cy: 0.5, assetId: 'hand' },
      { timeMs: 90, cx: 0.4, cy: 0.4, assetId: 'arrow' },
      { timeMs: 140, cx: 0.5, cy: 0.3, assetId: 'hand' },
      { timeMs: 239, cx: 0.6, cy: 0.2, assetId: 'hand' },
      { timeMs: 240, cx: 0.7, cy: 0.1, assetId: 'hand' },
    ],
    50,
  );
  cursor.recording.assets.push({ ...cursorFixture.assets[0], id: 'hand', hotspotX: 0.75 });
  const original = structuredClone(cursor.recording);
  const stabilized = {
    ...cursor,
    settings: { mode: 'raw', size: 1, hidden: false, stabilizeShapes: true },
  } satisfies CursorTrack;
  for (const mode of ['raw', 'smooth'] as const) {
    expect(cursorAt(stabilized, 290, mode)?.asset).toMatchObject({ id: 'hand', hotspotX: 0.75 });
    expect(cursorAt(stabilized, 289, mode)?.asset.id).toBe('arrow');
    expect(cursorAt(stabilized, 90, mode)).toMatchObject({
      cx: 0.3,
      cy: 0.5,
      asset: { id: 'arrow' },
    });
    expect(cursorAt(stabilized, 190, mode)?.asset.id).toBe('arrow');
    expect(cursorAt(stabilized, 290, mode)?.asset.id).toBe('hand');
    expect(cursorAt(cursor, 90, mode)?.asset.id).toBe('hand');
  }
  expect(cursor.recording).toEqual(original);
});

it('accepts interaction shapes and resets stabilization across hidden, missing and disconnected tracking', () => {
  const cursor = track([
    { timeMs: 0, cx: 0.2, cy: 0.6, assetId: 'arrow' },
    { timeMs: 40, cx: 0.3, cy: 0.5, assetId: 'hand', interactionType: 'click' },
    { timeMs: 80, cx: 0.4, cy: 0.4, assetId: 'arrow' },
    { timeMs: 120, cx: 0.5, cy: 0.3, assetId: 'hand', visible: false },
    { timeMs: 160, cx: 0.6, cy: 0.2, assetId: 'arrow' },
    { timeMs: 200, cx: 0.7, cy: 0.1, assetId: null },
    { timeMs: 240, cx: 0.6, cy: 0.2, assetId: 'hand' },
    { timeMs: 600, cx: 0.5, cy: 0.3, assetId: 'arrow' },
    { timeMs: 600, cx: 0.4, cy: 0.4, assetId: 'hand' },
  ]);
  cursor.recording.assets.push({ ...cursorFixture.assets[0], id: 'hand' });
  const stabilized = {
    ...cursor,
    settings: { mode: 'smooth', size: 1, hidden: false, stabilizeShapes: true },
  } satisfies CursorTrack;
  expect(cursorAt(stabilized, 40)?.asset.id).toBe('hand');
  expect(cursorAt(stabilized, 80)?.asset.id).toBe('hand');
  expect(cursorAt(stabilized, 120)).toBeUndefined();
  expect(cursorAt(stabilized, 160)?.asset.id).toBe('arrow');
  expect(cursorAt(stabilized, 200)).toBeUndefined();
  expect(cursorAt(stabilized, 240)?.asset.id).toBe('hand');
  expect(cursorAt(stabilized, 500)).toBeUndefined();
  expect(cursorAt(stabilized, 600)?.asset.id).toBe('hand');
});

it('returns to the trimmed clip start or stops at its ending without depending on seek order', () => {
  const cursor = track(
    Array.from({ length: 51 }, (_, i) => ({
      timeMs: i * 100,
      cx: 0.1 + i * 0.01,
      cy: 0.7,
      assetId: 'arrow',
    })),
  );
  const loop = {
    ...cursor,
    settings: { mode: 'raw', size: 1, hidden: false, ending: 'loop' },
  } satisfies CursorTrack;
  const range = { startMs: 1000, endMs: 4000 };
  expect(cursorAt(loop, 4000, 'raw', range)?.cx).toBeCloseTo(0.2);
  expect(cursorAt(loop, 3750, 'raw', range)?.cx).toBeCloseTo(0.325);
  expect(cursorAt(loop, 1000, 'raw', range)?.cx).toBeCloseTo(0.2);
  expect(cursorAt(loop, 3500, 'raw', range)?.cx).toBeCloseTo(0.45);
  const stop = { ...loop, settings: { ...loop.settings, ending: 'stop' } } satisfies CursorTrack;
  expect(cursorAt(stop, 4000, 'raw', range)?.cx).toBeCloseTo(0.45);
  expect(cursorAt(stop, 3750, 'raw', range)?.cx).toBeCloseTo(0.45);
  expect(cursorAt(stop, 3000, 'raw', range)?.cx).toBeCloseTo(0.4);
  expect(cursorAt(loop, 4000, 'raw')?.cx).toBeCloseTo(0.5);
});

it('hides half-open source-video ranges independently of offsets, seeks and ending effects', () => {
  const original = structuredClone(path.recording);
  const hidden = {
    ...path,
    offsetMs: 50,
    settings: {
      mode: 'raw' as const,
      size: 1,
      hidden: false,
      ending: 'loop' as const,
      hiddenRanges: [{ startMs: 200, endMs: 260 }],
    },
  };
  const range = { startMs: 150, endMs: 300 };
  expect(cursorAt(hidden, 259, 'raw', range)).toBeUndefined();
  expect(cursorAt(hidden, 199, 'raw', range)).toBeDefined();
  expect(cursorAt(hidden, 200, 'smooth', range)).toBeUndefined();
  expect(cursorAt(hidden, 260, 'raw', range)).toBeDefined();
  expect(cursorAt(hidden, 220)).toBeUndefined();
  expect(cursorAt(hidden, 150)).toBeDefined();
  expect(path.recording).toEqual(original);
});
