import { expect, it } from 'vitest';
import { cursorFixture } from './cursor.fixture';
import { parseCursor, parseCursorTrack } from './cursor';

it('keeps source times, duplicate timestamps, unbalanced events, fractional hotspots and extension fields', () => {
  expect(parseCursor(structuredClone(cursorFixture))).toEqual(cursorFixture);
  expect(parseCursorTrack({ recording: cursorFixture, offsetMs: -78 })).toEqual({
    recording: cursorFixture,
    offsetMs: -78,
  });
});

it.each([
  { ...cursorFixture, version: 1 },
  { ...cursorFixture, provider: 'none' },
  { ...cursorFixture, samples: [{ timeMs: -1, cx: 0, cy: 0 }] },
  { ...cursorFixture, samples: [{ timeMs: 1, cx: 1.01, cy: 0 }] },
  { ...cursorFixture, samples: [{ timeMs: 1, cx: 0, cy: Number.NaN }] },
  { ...cursorFixture, samples: [...cursorFixture.samples].reverse() },
  { ...cursorFixture, samples: [{ timeMs: 0, cx: 0, cy: 0, assetId: 'missing' }] },
  { ...cursorFixture, samples: [{ timeMs: 0, cx: 0, cy: 0, visible: 'false' }] },
  { ...cursorFixture, assets: [cursorFixture.assets[0], cursorFixture.assets[0]] },
  {
    ...cursorFixture,
    assets: [{ ...cursorFixture.assets[0], imageDataUrl: 'https://example.com/cursor.png' }],
  },
  {
    ...cursorFixture,
    assets: [{ ...cursorFixture.assets[0], imageDataUrl: 'data:image/svg+xml;base64,PHN2Zy8+' }],
  },
  {
    ...cursorFixture,
    assets: [{ ...cursorFixture.assets[0], imageDataUrl: 'data:image/png;base64,AAAA' }],
  },
  {
    ...cursorFixture,
    assets: [{ ...cursorFixture.assets[0], hotspotX: Number.POSITIVE_INFINITY }],
  },
  { ...cursorFixture, assets: [{ ...cursorFixture.assets[0], scaleFactor: 0 }] },
  { ...cursorFixture, assets: [{ ...cursorFixture.assets[0], width: 2 }] },
])('rejects malformed or unsafe sidecars %#', (value) => {
  expect(() => parseCursor(value)).toThrow(/cursor|OpenScreen/i);
});

it('rejects invalid timing adjustments when reopening projects', () => {
  expect(() => parseCursorTrack({ recording: cursorFixture, offsetMs: '78' })).toThrow(/cursor/i);
  expect(() => parseCursorTrack({ recording: cursorFixture, offsetMs: Infinity })).toThrow(
    /cursor/i,
  );
});

it('preserves rendering settings and rejects invalid saved cursor controls', () => {
  const cursor = {
    recording: cursorFixture,
    offsetMs: 78,
    settings: {
      mode: 'raw',
      size: 2.5,
      hidden: true,
      style: 'touch',
      hideIdle: false,
      removeShakes: true,
      ending: 'loop',
      hiddenRanges: [{ startMs: 0, endMs: 123.5 }],
    },
  };
  expect(parseCursorTrack(cursor)).toEqual(cursor);
  for (const settings of [
    { ...cursor.settings, mode: 'spring' },
    { ...cursor.settings, size: 0 },
    { ...cursor.settings, size: Infinity },
    { ...cursor.settings, hidden: 'false' },
    { ...cursor.settings, hideIdle: 'false' },
    { ...cursor.settings, removeShakes: 1 },
    { ...cursor.settings, style: 'native' },
    { ...cursor.settings, ending: 'warp' },
    ...[
      null,
      {},
      [{ startMs: -1, endMs: 3 }],
      [{ startMs: 3, endMs: 3 }],
      [{ startMs: 4, endMs: 3 }],
      [{ startMs: 0, endMs: Infinity }],
      [{ startMs: '0', endMs: 3 }],
    ].map((hiddenRanges) => ({ ...cursor.settings, hiddenRanges })),
  ]) {
    expect(() => parseCursorTrack({ ...cursor, settings })).toThrow(/cursor/i);
  }
});
