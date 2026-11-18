import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MediaLibrary } from './components';
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
