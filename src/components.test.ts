import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MediaLibrary, waveShape } from './components';
import type { Asset } from './media';

const asset = (id: string, over: Partial<Asset>): Asset =>
  ({
    id,
    name: id,
    url: `blob:${id}`,
    size: 1,
    width: 640,
    height: 360,
    peaks: [],
    thumbnail: '',
    kind: 'video',
    duration: 30,
    hasAudio: false,
    ...over,
  }) as Asset;

// The library's duration chip reads the shared clock: to the second, floored, hours from one hour.
describe('media library duration chips', () => {
  const chips = (assets: Asset[]) =>
    [
      ...renderToStaticMarkup(
        createElement(MediaLibrary, {
          assets,
          selected: '',
          onSelect: () => undefined,
          onImport: () => undefined,
          busy: false,
        }),
      ).matchAll(/class="asset-duration">([^<]*)</g),
    ].map((match) => match[1]);

  it('floors each source length to whole seconds and marks a still', () => {
    expect(
      chips([
        asset('a', { duration: 59 }),
        asset('b', { duration: 61 }),
        asset('c', { duration: 60 * 60 * 30 }),
        asset('d', { kind: 'image', duration: undefined, hasAudio: false }),
      ]),
    ).toEqual(['00:01', '00:02', '1:00:00', 'STILL']);
  });
});

describe('waveform bins', () => {
  // Bin peaks against a loudest of 1, drawn up to 21 units either side of y = 24,
  // through each column's centre and held flat to the span's ends.
  const peaks = [0.2, 1, 0.5, 0.25];

  it('draws whole bins from the one the in-point falls in, the same at any width past the bins', () => {
    const path = 'M1,3L1.5,3L2.5,13.5L3.5,18.75L4,18.75L4,29.25L3.5,29.25L2.5,34.5L1.5,45L1,45Z';
    expect(waveShape(peaks, 1.5, 4, 10)).toEqual({ step: 1, path });
    expect(waveShape(peaks, 1.5, 4, 1000)).toEqual({ step: 1, path });
  });

  it('merges bins by their peak when there are more bins than pixels', () => {
    expect(waveShape(peaks, 0, 4, 2)).toEqual({
      step: 2,
      path: 'M0,3L0.5,3L1.5,13.5L2,13.5L2,34.5L1.5,34.5L0.5,45L0,45Z',
    });
  });
});
