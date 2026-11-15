import { describe, expect, it } from 'vitest';
import type { Asset } from './media';
import { parseProject, serializeProject, validateSources, type Edit } from './project';
import { cursorFixture } from './cursor.fixture';
import type { CursorTrack } from './cursor';

const edit: Edit = {
  clips: [{ id: 'clip', assetId: 'video', track: 'screen', start: 0, duration: 30, offset: 15 }],
  zooms: [{ id: 'zoom', start: 0, duration: 30, scale: 2, x: 25, y: 65 }],
  layout: { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
};
const media = [{ id: 'video', name: 'recording.mp4', data: 'data:video/mp4;base64,AAEC/w==' }];
const project = () => ({
  version: 2,
  fps: 30,
  ...structuredClone(edit),
  media: structuredClone(media),
  muted: ['music'],
});

describe('portable project parsing', () => {
  it('saves and reopens every source anchor and split lineage field', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    const anchored: Edit = {
      ...edit,
      clips: [{ ...edit.clips[0], originId: 'original-take' }],
      zooms: [
        {
          ...edit.zooms[0],
          source: {
            assetId: 'video',
            clipId: 'original-take',
            start: 15,
            x: 0.27,
            y: 0.64,
          },
        },
      ],
    };
    try {
      const saved = await serializeProject(anchored, [{ ...asset, url }], []);
      expect(parseProject(await saved.text()).edit).toEqual(anchored);
      for (const source of [
        { ...anchored.zooms[0].source, x: -0.01 },
        { ...anchored.zooms[0].source, start: 1.5 },
        { ...anchored.zooms[0].source, start: 24 * 60 * 60 * 30 },
        { ...anchored.zooms[0].source, assetId: 'missing' },
        { ...anchored.zooms[0].source, clipId: 'unrelated-take' },
      ]) {
        const value = {
          ...project(),
          clips: anchored.clips,
          zooms: [{ ...anchored.zooms[0], source }],
        };
        expect(() => parseProject(JSON.stringify(value))).toThrow(/source|anchor/i);
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('preserves all cursor fields and the source clock adjustment through save and reopen', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    const cursor: CursorTrack = {
      recording: cursorFixture,
      offsetMs: -78,
      settings: { mode: 'raw', size: 2.5, hidden: true },
    };
    try {
      const saved = await serializeProject(edit, [{ ...asset, url, cursor }], []);
      expect(JSON.parse(await saved.text()).media[0].cursor).toEqual(cursor);
      expect(parseProject(await saved.text()).media[0]).toEqual({ ...media[0], cursor });
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('reopens edit settings and embedded bytes without treating them as decoded media', () => {
    expect(parseProject(JSON.stringify(project()))).toEqual({ edit, media, muted: ['music'] });
    const swapped = project();
    swapped.layout.swapped = true;
    expect(parseProject(JSON.stringify(swapped)).edit.layout.swapped).toBe(true);
  });

  it('accepts zooms that touch without overlapping', () => {
    const value = project();
    value.zooms.push({ ...value.zooms[0], id: 'second', start: 30, duration: 6 });
    expect(parseProject(JSON.stringify(value)).edit.zooms).toHaveLength(2);
  });

  it('allows an empty project', () => {
    const value = { ...project(), clips: [], zooms: [], media: [], muted: [] };
    expect(parseProject(JSON.stringify(value)).edit.clips).toEqual([]);
  });

  it.each([
    ['{', /JSON/i],
    ['null', /project/i],
    ['[]', /project/i],
    [JSON.stringify({ version: 1, assets: [] }), /version 1|metadata|portable/i],
    [JSON.stringify({ ...project(), version: 9 }), /version/i],
    [JSON.stringify({ ...project(), fps: 24 }), /fps|30/i],
    [JSON.stringify({ ...project(), media: undefined }), /media/i],
    [JSON.stringify({ ...project(), muted: ['other'] }), /track/i],
    [JSON.stringify({ ...project(), muted: ['music', 'music'] }), /duplicate/i],
  ])('rejects malformed or incompatible input: %s', (text, message) => {
    expect(() => parseProject(text)).toThrow(message);
  });

  it.each([
    [
      'missing source',
      (p: ReturnType<typeof project>) => {
        p.clips[0].assetId = 'missing';
      },
      /missing|reference/i,
    ],
    [
      'unknown track',
      (p: ReturnType<typeof project>) => {
        Object.assign(p.clips[0], { track: 'other' });
      },
      /track/i,
    ],
    [
      'duplicate clips',
      (p: ReturnType<typeof project>) => {
        p.clips.push(p.clips[0]);
      },
      /duplicate/i,
    ],
    [
      'duplicate media',
      (p: ReturnType<typeof project>) => {
        p.media.push(p.media[0]);
      },
      /duplicate/i,
    ],
    [
      'duplicate zooms',
      (p: ReturnType<typeof project>) => {
        p.zooms.push(p.zooms[0]);
      },
      /duplicate/i,
    ],
    [
      'negative offset',
      (p: ReturnType<typeof project>) => {
        p.clips[0].offset = -1;
      },
      /offset/i,
    ],
    [
      'zero duration',
      (p: ReturnType<typeof project>) => {
        p.clips[0].duration = 0;
      },
      /duration/i,
    ],
    [
      'fractional frames',
      (p: ReturnType<typeof project>) => {
        p.clips[0].start = 0.5;
      },
      /start/i,
    ],
    [
      'overflowing source range',
      (p: ReturnType<typeof project>) => {
        p.clips[0].offset = Number.MAX_SAFE_INTEGER;
      },
      /range/i,
    ],
    [
      'overflowing timeline range',
      (p: ReturnType<typeof project>) => {
        p.clips[0].start = Number.MAX_SAFE_INTEGER;
      },
      /range/i,
    ],
    [
      'nonfinite setting',
      (p: ReturnType<typeof project>) => {
        p.layout.radius = Infinity;
      },
      /radius/i,
    ],
    [
      'excessive radius',
      (p: ReturnType<typeof project>) => {
        p.layout.radius = 61;
      },
      /radius/i,
    ],
    [
      'invalid crop',
      (p: ReturnType<typeof project>) => {
        p.layout.cameraX = -1;
      },
      /cameraX/i,
    ],
    [
      'invalid swapped',
      (p: ReturnType<typeof project>) => {
        Object.assign(p.layout, { swapped: 'yes' });
      },
      /swapped/i,
    ],
    [
      'invalid zoom focus',
      (p: ReturnType<typeof project>) => {
        p.zooms[0].x = 101;
      },
      /x/i,
    ],
    [
      'invalid zoom scale',
      (p: ReturnType<typeof project>) => {
        p.zooms[0].scale = 3.1;
      },
      /scale/i,
    ],
    [
      'invalid zoom duration',
      (p: ReturnType<typeof project>) => {
        p.zooms[0].duration = -1;
      },
      /duration/i,
    ],
    [
      'a zoom shorter than six frames',
      (p: ReturnType<typeof project>) => {
        p.zooms[0].duration = 5;
      },
      /duration/i,
    ],
    [
      'overlapping zooms',
      (p: ReturnType<typeof project>) => {
        p.zooms.push({ ...p.zooms[0], id: 'second', start: 29 });
      },
      /overlap/i,
    ],
    [
      'a zoom that shares a clip ID',
      (p: ReturnType<typeof project>) => {
        p.zooms[0].id = p.clips[0].id;
      },
      /duplicate/i,
    ],
    [
      'a clip placed more than a day into the timeline',
      (p: ReturnType<typeof project>) => {
        p.clips[0].start = 24 * 60 * 60 * 30;
      },
      /range/i,
    ],
    [
      'empty ID',
      (p: ReturnType<typeof project>) => {
        p.clips[0].id = '';
      },
      /id/i,
    ],
  ])('rejects %s', (_name, change, message) => {
    const value = project();
    change(value);
    expect(() => parseProject(JSON.stringify(value))).toThrow(message);
  });

  it.each([
    'blob:old-session',
    'https://example.com/video.mp4',
    'data:text/html;base64,PHNjcmlwdD4=',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:video/mp4,hello',
    'data:video/mp4;base64,',
    'data:video/mp4;base64,!!!!',
    'data:video/mp4;base64,A===',
    'data:video/mp4;base64,AB==',
  ])('rejects unsafe or malformed media payload %s', (data) => {
    const value = project();
    value.media[0].data = data;
    expect(() => parseProject(JSON.stringify(value))).toThrow(/data|media/i);
  });
});

const asset: Asset = {
  id: 'video',
  name: 'recording.mp4',
  kind: 'video',
  url: '',
  duration: 45,
  width: 1280,
  height: 720,
  hasAudio: true,
  peaks: [],
  thumbnail: '',
};

describe('decoded source validation', () => {
  it('accepts a source range ending exactly at the last decoded frame', () => {
    expect(() => validateSources(edit, [asset])).not.toThrow();
  });

  it.each([
    ['missing source', [], /missing/i],
    ['short source', [{ ...asset, duration: 44 }], /source|duration/i],
    ['audio-only visual source', [{ ...asset, kind: 'audio' as const }], /video|screen/i],
    ['duplicate source', [asset, asset], /duplicate/i],
    ['nonfinite duration', [{ ...asset, duration: NaN }], /duration/i],
  ])('rejects %s', (_name, assets, error) => {
    expect(() => validateSources(edit, assets)).toThrow(error);
  });

  it('requires an audio stream for voice or music, including video sources', () => {
    const audioEdit: Edit = { ...edit, clips: [{ ...edit.clips[0], track: 'voice' }] };
    expect(() => validateSources(audioEdit, [asset])).not.toThrow();
    expect(() => validateSources(audioEdit, [{ ...asset, hasAudio: false }])).toThrow(/audio/i);
  });
});

describe('portable project serialization', () => {
  it('embeds the actual local bytes, retains top-level edits, and needs no old blob URL', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    let saved: Blob;
    try {
      saved = await serializeProject(edit, [{ ...asset, url }], ['music']);
    } finally {
      URL.revokeObjectURL(url);
    }
    expect(saved.type).toBe('application/json');
    const text = await saved.text();
    expect(text).not.toContain('blob:');
    expect(JSON.parse(text)).toMatchObject({ version: 2, fps: 30, ...edit, muted: ['music'] });
    const reopened = parseProject(text);
    expect(reopened).toEqual({ edit, media, muted: ['music'] });
    const blob = await (await fetch(reopened.media[0].data)).blob();
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual([0, 1, 2, 255]);
  });

  it('preserves unused library media and untyped bytes without a large spread call', async () => {
    const bytes = new Uint8Array(65537).fill(253);
    const url = URL.createObjectURL(new Blob([bytes]));
    try {
      const empty: Edit = { ...edit, clips: [], zooms: [] };
      const saved = await serializeProject(empty, [{ ...asset, url }], []);
      const reopened = parseProject(await saved.text());
      expect(reopened.media).toHaveLength(1);
      const restored = await (await fetch(reopened.media[0].data)).arrayBuffer();
      expect(new Uint8Array(restored)).toEqual(bytes);
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('refuses network URLs rather than downloading or uploading media', async () => {
    await expect(
      serializeProject(edit, [{ ...asset, url: 'https://example.com/video.mp4' }], []),
    ).rejects.toThrow(/local|blob/i);
  });

  it('reports unavailable local media rather than saving metadata-only files', async () => {
    const url = URL.createObjectURL(new Blob(['bytes']));
    URL.revokeObjectURL(url);
    await expect(serializeProject(edit, [{ ...asset, url }], [])).rejects.toThrow(
      /recording.mp4|media/i,
    );
  });
});
