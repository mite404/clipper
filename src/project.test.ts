import { describe, expect, it, vi } from 'vitest';
import type { Asset } from './media';
import {
  librarySizeWarning,
  parseProject,
  serializeProject,
  validateSources,
  type Edit,
} from './project';
import { cursorFixture } from './cursor.fixture';
import { DEFAULT_TRACKS, type TrackDef } from './timeline-model';
import type { CursorTrack } from './cursor';
import { resolveZooms } from './zoom-generation';

const edit: Edit = {
  clips: [{ id: 'clip', assetId: 'video', track: 'screen', start: 0, duration: 30, offset: 15 }],
  zooms: [{ id: 'zoom', start: 0, duration: 30, scale: 2, x: 25, y: 65 }],
  layout: { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 },
  tracks: DEFAULT_TRACKS,
};
const media = [{ id: 'video', name: 'recording.mp4', data: 'data:video/mp4;base64,AAEC/w==' }];
// A version 2 file: the four default tracks are implied, never written.
const { tracks: _defaults, ...legacyEdit } = edit;
const project = () => ({
  version: 2,
  fps: 30,
  ...structuredClone(legacyEdit),
  media: structuredClone(media),
  muted: ['music'],
});

describe('portable project parsing', () => {
  it('round trips optional follow, instant and curve settings without changing version 2 defaults', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    try {
      for (const follow of ['focused', 'smooth'] as const) {
        for (const instant of [true, false]) {
          const curve = [0.16, 1, 0.3, 1] as [number, number, number, number];
          const next: Edit = { ...edit, zooms: [{ ...edit.zooms[0], follow, instant, curve }] };
          const saved = (await serializeProject(next, [{ ...asset, url }], [])).file;
          expect(JSON.parse(await saved.text()).version).toBe(2);
          expect(parseProject(await saved.text()).edit).toEqual(next);
        }
      }
      expect(parseProject(JSON.stringify(project())).edit).toEqual(edit);
      for (const fields of [
        { follow: 'unknown' },
        { follow: true },
        { instant: 1 },
        { instant: null },
        { curve: [0.2, 0.1, 0.8] },
        { curve: [0.2, 0.1, 0.8, 0.9, 1] },
        { curve: [-0.1, 0, 0.5, 1] },
        { curve: [0, 0, 1.01, 1] },
        { curve: [0, 1.5, 0.5, 1] },
        { curve: [0, '0', 0.5, 1] },
        { curve: [0, null, 0.5, 1] },
        { curve: 'ease-in' },
      ]) {
        const invalid = { ...project(), zooms: [{ ...edit.zooms[0], ...fields }] };
        expect(() => parseProject(JSON.stringify(invalid))).toThrow(/follow|instant|curve/i);
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('reads legacy source anchors, rejects malformed ones and saves pinned zooms without them', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    const source = { assetId: 'video', clipId: 'original-take', start: 15, x: 0.27, y: 0.64 };
    const clips = [{ ...edit.clips[0], originId: 'original-take' }];
    const legacy = { ...project(), clips, zooms: [{ ...edit.zooms[0], source }] };
    try {
      const opened = parseProject(JSON.stringify(legacy)).edit;
      expect(opened).toEqual({ ...edit, clips, zooms: [{ ...edit.zooms[0], source }] });
      const assets: Asset[] = [{ ...asset, url }];
      const pinned = {
        ...opened,
        zooms: resolveZooms(opened.zooms, clips, assets, opened.layout, opened.tracks),
      };
      expect(pinned.zooms).toEqual([
        { ...edit.zooms[0], x: expect.any(Number), y: expect.any(Number) },
      ]);
      const saved = (await serializeProject(pinned, assets, [])).file;
      expect(JSON.parse(await saved.text()).zooms[0]).not.toHaveProperty('source');
      expect(parseProject(await saved.text()).edit).toEqual(pinned);
      for (const bad of [
        { ...source, x: -0.01 },
        { ...source, start: 1.5 },
        { ...source, start: 24 * 60 * 60 * 30 },
        { ...source, assetId: 'missing' },
        { ...source, clipId: 'unrelated-take' },
      ]) {
        const value = { ...legacy, zooms: [{ ...edit.zooms[0], source: bad }] };
        expect(() => parseProject(JSON.stringify(value))).toThrow(/source|anchor/i);
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('opens a legacy source anchor on any screen-role clip, as zoom generation resolves it', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    const tracks: TrackDef[] = [
      ...DEFAULT_TRACKS,
      { id: 's2', label: 'Screen 2 · Masked', kind: 'visual', role: 'screen' },
    ];
    const source = { assetId: 'video', clipId: 'clip', start: 15, x: 0.27, y: 0.64 };
    const second: Edit = { ...edit, tracks, clips: [{ ...edit.clips[0], track: 's2' }] };
    try {
      const saved = (await serializeProject(second, [{ ...asset, url }], [])).file;
      const json = JSON.parse(await saved.text());
      const legacy = { ...json, zooms: [{ ...json.zooms[0], source }] };
      const reopened = parseProject(JSON.stringify(legacy)).edit;
      expect(reopened.zooms[0].source).toEqual(source);
      const assets: Asset[] = [{ ...asset, url }];
      const resolved = resolveZooms(
        reopened.zooms,
        reopened.clips,
        assets,
        reopened.layout,
        tracks,
      );
      expect(resolved).toEqual([expect.objectContaining({ id: 'zoom', start: 0, duration: 30 })]);
      expect(resolved[0]).not.toHaveProperty('source');
      // A camera clip is not a screen, for the parser or for zoom generation.
      const face = [{ ...edit.clips[0], track: 'camera' }];
      expect(() => parseProject(JSON.stringify({ ...legacy, clips: face }))).toThrow(/anchor/i);
      expect(resolveZooms(reopened.zooms, face, assets, reopened.layout, tracks)).toEqual([]);
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
      const saved = (await serializeProject(edit, [{ ...asset, url, cursor }], [])).file;
      expect(JSON.parse(await saved.text()).media[0].cursor).toEqual(cursor);
      expect(parseProject(await saved.text()).media[0]).toEqual({ ...media[0], cursor });
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('saves and reopens a source transcript, and rejects a malformed one', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    const transcript = {
      model: 'whisper-tiny.en@794207f',
      segments: [
        { start: 0, end: 7.74, text: 'And so my fellow Americans' },
        { start: 7.74, end: 10.64, text: 'ask not 🇺🇸' },
      ],
    };
    try {
      const saved = (await serializeProject(edit, [{ ...asset, url, transcript }], [])).file;
      const json = JSON.parse(await saved.text());
      expect(json.version).toBe(2);
      expect(json.media[0].transcript).toEqual(transcript);
      expect(parseProject(await saved.text()).media[0]).toEqual({ ...media[0], transcript });
      const [first, second] = transcript.segments;
      for (const bad of [
        { ...transcript, model: '' },
        { ...transcript, segments: {} },
        { ...transcript, segments: [{ ...first, end: 0 }] },
        { ...transcript, segments: [{ ...first, start: -1 }] },
        { ...transcript, segments: [{ ...first, end: Infinity }] },
        { ...transcript, segments: [{ ...first, end: 24 * 60 * 60 + 1 }] },
        { ...transcript, segments: [{ ...first, text: 7 }] },
        { ...transcript, segments: [{ ...first, text: 'x'.repeat(4001) }] },
        { ...transcript, segments: [second, first] },
        { ...transcript, segments: [first, { ...second, start: 7 }] },
      ]) {
        const value = { ...project(), media: [{ ...media[0], transcript: bad }] };
        expect(() => parseProject(JSON.stringify(value))).toThrow(/transcript/i);
      }
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('reopens edit settings and embedded bytes without treating them as decoded media', () => {
    // A file from before track locks and selection has neither key; both default to empty.
    // Without an output rate it exports at Auto, the 30 fps it always had.
    expect(parseProject(JSON.stringify(project()))).toEqual({
      edit,
      media,
      muted: ['music'],
      locked: [],
      selectedTracks: [],
      outputFps: 'auto',
    });
    expect(parseProject(JSON.stringify({ ...project(), outputFps: '29.97' })).outputFps).toBe(
      '29.97',
    );
    const toggled = { ...project(), locked: ['voice'], selectedTracks: ['screen', 'camera'] };
    expect(parseProject(JSON.stringify(toggled))).toMatchObject({
      locked: ['voice'],
      selectedTracks: ['screen', 'camera'],
    });
    const swapped = project();
    swapped.layout.swapped = true;
    expect(parseProject(JSON.stringify(swapped)).edit.layout.swapped).toBe(true);
    const pip = project();
    Object.assign(pip.layout, { mode: 'pip', corner: 'top-left' });
    expect(parseProject(JSON.stringify(pip)).edit.layout).toMatchObject({
      mode: 'pip',
      corner: 'top-left',
    });
  });

  it('accepts zooms that touch without overlapping', () => {
    const value = project();
    value.zooms.push({ ...value.zooms[0], id: 'second', start: 30, duration: 6 });
    expect(parseProject(JSON.stringify(value)).edit.zooms).toHaveLength(2);
  });

  it('accepts zoom and layout values exactly at their limits', () => {
    // Every limit is inclusive, so a file saved at one still opens.
    const edges = project();
    Object.assign(edges.zooms[0], {
      start: 24 * 60 * 60 * 30 - 6,
      duration: 6,
      scale: 1,
      x: 0,
      y: 100,
    });
    edges.layout = { radius: 60, screenX: 100, screenY: 0, cameraX: 0, cameraY: 100 };
    const opened = parseProject(JSON.stringify(edges)).edit;
    expect(opened.zooms[0]).toMatchObject({ scale: 1, x: 0, y: 100, duration: 6 });
    expect(opened.layout).toEqual(edges.layout);
    const top = project();
    Object.assign(top.zooms[0], { scale: 3, x: 100, y: 0 });
    expect(parseProject(JSON.stringify(top)).edit.zooms[0]).toMatchObject({
      scale: 3,
      x: 100,
      y: 0,
    });
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
    [JSON.stringify({ ...project(), locked: 'voice' }), /locked/i],
    [JSON.stringify({ ...project(), locked: null }), /locked/i],
    [JSON.stringify({ ...project(), selectedTracks: null }), /selectedTracks/i],
    [JSON.stringify({ ...project(), locked: ['V1'] }), /track/i],
    [JSON.stringify({ ...project(), locked: ['voice', 'voice'] }), /duplicate/i],
    [JSON.stringify({ ...project(), selectedTracks: {} }), /selectedTracks/i],
    [JSON.stringify({ ...project(), selectedTracks: ['other'] }), /track/i],
    [JSON.stringify({ ...project(), selectedTracks: ['camera', 'camera'] }), /duplicate/i],
    // Only the five explicit rates are stored, as strings; Auto is stored as no key.
    [JSON.stringify({ ...project(), outputFps: '30' }), /outputFps/],
    [JSON.stringify({ ...project(), outputFps: 'auto' }), /outputFps/],
    [JSON.stringify({ ...project(), outputFps: 29.97 }), /outputFps/],
    [JSON.stringify({ ...project(), outputFps: null }), /outputFps/],
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
      'invalid layout mode',
      (p: ReturnType<typeof project>) => {
        Object.assign(p.layout, { mode: 'grid' });
      },
      /layout\.mode/i,
    ],
    [
      'invalid PiP corner',
      (p: ReturnType<typeof project>) => {
        Object.assign(p.layout, { mode: 'pip', corner: 'middle' });
      },
      /layout\.corner/i,
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
      'a zoom scale below one',
      (p: ReturnType<typeof project>) => {
        p.zooms[0].scale = 0.5;
      },
      /zooms\[0\]\.scale/,
    ],
    [
      'a zoom focus y above 100',
      (p: ReturnType<typeof project>) => {
        p.zooms[0].y = 101;
      },
      /zooms\[0\]\.y/,
    ],
    [
      'a zoom focus y below zero',
      (p: ReturnType<typeof project>) => {
        p.zooms[0].y = -0.5;
      },
      /zooms\[0\]\.y/,
    ],
    [
      'a zoom focus x below zero',
      (p: ReturnType<typeof project>) => {
        p.zooms[0].x = -0.5;
      },
      /zooms\[0\]\.x/,
    ],
    [
      'a zoom one frame past the 24 hour limit',
      (p: ReturnType<typeof project>) => {
        Object.assign(p.zooms[0], { start: 24 * 60 * 60 * 30 - 29, duration: 30 });
      },
      /range/i,
    ],
    [
      'a layout screenX above 100',
      (p: ReturnType<typeof project>) => {
        p.layout.screenX = 100.5;
      },
      /screenX/i,
    ],
    [
      'a layout screenY below zero',
      (p: ReturnType<typeof project>) => {
        p.layout.screenY = -1;
      },
      /screenY/i,
    ],
    [
      'a layout cameraY above 100',
      (p: ReturnType<typeof project>) => {
        p.layout.cameraY = 101;
      },
      /cameraY/i,
    ],
    [
      'a layout cameraX above 100',
      (p: ReturnType<typeof project>) => {
        p.layout.cameraX = 100.01;
      },
      /cameraX/i,
    ],
    [
      'a negative layout radius',
      (p: ReturnType<typeof project>) => {
        p.layout.radius = -1;
      },
      /radius/i,
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
  size: 4,
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

describe('source rules for every track', () => {
  // The clip needs 45 frames of source, which `asset` has; an image carries no duration.
  const { duration: _length, ...still } = asset;
  const sources: Record<string, Asset> = {
    video: asset,
    'silent video': { ...asset, hasAudio: false },
    'audio only': { ...asset, kind: 'audio' },
    image: { ...still, kind: 'image', hasAudio: false },
  };
  // What validateSources says of one clip on one track holding one source.
  const verdict = (track: string, source: Asset) => {
    const clips = [{ ...edit.clips[0], track }];
    try {
      validateSources({ ...edit, clips }, [source]);
      return 'accepted';
    } catch (error) {
      return (error as Error).message;
    }
  };
  const needsPicture = (label: string) => `Clip clip on ${label} requires video or image media.`;
  const needsSound = (label: string) => `Clip clip on ${label} requires an audio stream.`;
  // Each track takes exactly the sources its kind can play: screen and camera need something to
  // draw, voice and music need an audio stream, so an image is never heard nor audio seen.
  it.each([
    ['screen', 'video', 'accepted'],
    ['screen', 'silent video', 'accepted'],
    ['screen', 'image', 'accepted'],
    ['screen', 'audio only', needsPicture('Screen recording')],
    ['camera', 'video', 'accepted'],
    ['camera', 'silent video', 'accepted'],
    ['camera', 'image', 'accepted'],
    ['camera', 'audio only', needsPicture('Talking head')],
    ['voice', 'video', 'accepted'],
    ['voice', 'audio only', 'accepted'],
    ['voice', 'silent video', needsSound('Voiceover')],
    ['voice', 'image', needsSound('Voiceover')],
    ['music', 'video', 'accepted'],
    ['music', 'audio only', 'accepted'],
    ['music', 'silent video', needsSound('Music')],
    ['music', 'image', needsSound('Music')],
  ])('on %s a %s source is %s', (track, name, expected) => {
    expect(verdict(track, sources[name])).toBe(expected);
  });
});

describe('portable project serialization', () => {
  it('writes image envelopes as v3 with clip-owned duration and original bytes', async () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
    const image = {
      id: 'video',
      name: 'overlay.png',
      kind: 'image' as const,
      url,
      size: bytes.length,
      width: 320,
      height: 180,
      hasAudio: false as const,
      peaks: [],
      thumbnail: '',
    };
    const stillEdit = { ...edit, clips: [{ ...edit.clips[0], duration: 180, offset: 90 }] };
    try {
      const saved = (await serializeProject(stillEdit, [image], [])).file;
      const envelope = JSON.parse(await saved.text());
      expect(envelope.version).toBe(3);
      expect(envelope.media[0]).toMatchObject({
        kind: 'image',
        data: 'data:image/png;base64,iVBORw0KGgo=',
      });
      const reopened = parseProject(await saved.text());
      expect(reopened.edit).toEqual(stillEdit);
      expect(new Uint8Array(await (await fetch(reopened.media[0].data)).arrayBuffer())).toEqual(
        bytes,
      );
      expect(() =>
        validateSources({ ...stillEdit, clips: [{ ...stillEdit.clips[0], track: 'voice' }] }, [
          image,
        ]),
      ).toThrow(/audio/i);
      for (const invalid of [
        { ...envelope, version: 2 },
        { ...envelope, media: [{ ...envelope.media[0], kind: 'video' }] },
        { ...envelope, media: [{ ...envelope.media[0], kind: undefined }] },
        { ...envelope, media: [{ ...envelope.media[0], data: 'data:video/mp4;base64,AAEC/w==' }] },
      ])
        expect(() => parseProject(JSON.stringify(invalid))).toThrow(/image|kind|version/i);
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('chooses v2 when an unused image is omitted instead of embedded', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    try {
      const { duration: _duration, ...common } = asset;
      const image = {
        ...common,
        id: 'image',
        name: 'large.png',
        kind: 'image' as const,
        hasAudio: false as const,
        size: 375_000_001,
        url: 'blob:never-read',
      };
      const saved = await serializeProject(edit, [{ ...asset, url }, image], []);
      expect(saved.omitted).toEqual(['large.png']);
      expect(JSON.parse(await saved.file.text()).version).toBe(2);
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('embeds the actual local bytes, retains top-level edits, and needs no old blob URL', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    let saved: Blob;
    try {
      saved = (
        await serializeProject(edit, [{ ...asset, url }], ['music'], {
          locked: ['voice', 'screen'],
          selectedTracks: ['camera'],
          outputFps: '60',
        })
      ).file;
    } finally {
      URL.revokeObjectURL(url);
    }
    expect(saved.type).toBe('application/json');
    const text = await saved.text();
    expect(text).not.toContain('blob:');
    // Saved toggles stay in version 2: an older reader ignores the unknown keys and opens the edit.
    expect(JSON.parse(text)).toMatchObject({
      version: 2,
      fps: 30,
      ...legacyEdit,
      muted: ['music'],
      locked: ['voice', 'screen'],
      selectedTracks: ['camera'],
      outputFps: '60',
    });
    const reopened = parseProject(text);
    expect(reopened).toEqual({
      edit,
      media,
      muted: ['music'],
      locked: ['voice', 'screen'],
      selectedTracks: ['camera'],
      outputFps: '60',
    });
    const blob = await (await fetch(reopened.media[0].data)).blob();
    expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual([0, 1, 2, 255]);
  });

  it('preserves unused library media and untyped bytes of every size around a chunk edge', async () => {
    const empty: Edit = { ...edit, clips: [], zooms: [] };
    // Bytes that differ from their neighbours, so a dropped or repeated byte shows.
    const patterned = (length: number) => Uint8Array.from({ length }, (_, i) => (i * 7 + 3) % 256);
    for (const length of [1, 32767, 32768, 32769, 65536, 65537]) {
      const bytes = patterned(length);
      const url = URL.createObjectURL(new Blob([bytes]));
      try {
        const saved = (await serializeProject(empty, [{ ...asset, url }], [])).file;
        const reopened = parseProject(await saved.text());
        expect(reopened.media).toHaveLength(1);
        expect(reopened.media[0].data).toMatch(/^data:application\/octet-stream;base64,/);
        const restored = await (await fetch(reopened.media[0].data)).arrayBuffer();
        expect(new Uint8Array(restored)).toEqual(bytes);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  });

  it('never spreads more than 32768 bytes into one String.fromCharCode call', async () => {
    // Node's own limit is far higher than a browser's, so a payload that overflows nothing here would
    // still pass an unchunked save; the call sizes are what keep a large file saving everywhere.
    const url = URL.createObjectURL(new Blob([new Uint8Array(100_000).fill(253)]));
    const spy = vi.spyOn(String, 'fromCharCode');
    try {
      const empty: Edit = { ...edit, clips: [], zooms: [] };
      await serializeProject(empty, [{ ...asset, url }], []);
      const widest = Math.max(...spy.mock.calls.map((args) => args.length));
      expect(widest).toBeGreaterThan(0);
      expect(widest).toBeLessThanOrEqual(32768);
      expect(spy.mock.calls.reduce((sum, args) => sum + args.length, 0)).toBeGreaterThanOrEqual(
        100_000,
      );
    } finally {
      spy.mockRestore();
      URL.revokeObjectURL(url);
    }
  });

  it('saves the edit as it was when Save began, whatever changes while media is read', async () => {
    const url = URL.createObjectURL(new Blob([new Uint8Array([1, 2, 3])], { type: 'video/mp4' }));
    try {
      const live: Edit = structuredClone(edit);
      const muted = ['music'];
      const locked = ['voice'];
      const pending = serializeProject(live, [{ ...asset, url }], muted, {
        locked,
        selectedTracks: [],
      });
      // Edits, undo and toggles carry on while the bytes are read.
      live.zooms[0].x = 99;
      live.clips[0].duration = 1;
      live.layout.radius = 5;
      muted.push('camera');
      locked.length = 0;
      const saved = parseProject(await (await pending).file.text());
      expect(saved.edit).toEqual(edit);
      expect(saved.muted).toEqual(['music']);
      expect(saved.locked).toEqual(['voice']);
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('checks decoded sources before reading any media, so a bad edit is never saved', async () => {
    const fetched = vi.spyOn(globalThis, 'fetch');
    try {
      const short = { ...asset, duration: 44, url: 'blob:never-read' };
      await expect(serializeProject(edit, [short], [])).rejects.toThrow(
        "Clip clip source range exceeds recording.mp4's decoded duration.",
      );
      const missing = { ...asset, id: 'other', url: 'blob:never-read' };
      await expect(serializeProject(edit, [missing], [])).rejects.toThrow(
        'Clip clip references missing media video.',
      );
      expect(fetched).not.toHaveBeenCalled();
    } finally {
      fetched.mockRestore();
    }
  });

  it.each([
    [
      'overlapping zooms',
      { zooms: [edit.zooms[0], { ...edit.zooms[0], id: 'b', start: 29 }] },
      /overlap/i,
    ],
    ['a fractional clip start', { clips: [{ ...edit.clips[0], start: 0.5 }] }, /start/i],
    ['a zoom scale past the limit', { zooms: [{ ...edit.zooms[0], scale: 3.5 }] }, /scale/i],
    ['a zoom that shares a clip ID', { zooms: [{ ...edit.zooms[0], id: 'clip' }] }, /duplicate/i],
  ])(
    'refuses to write %s, so Save never produces a file Open rejects',
    async (_name, change, message) => {
      const url = URL.createObjectURL(new Blob([new Uint8Array([1])], { type: 'video/mp4' }));
      try {
        await expect(
          serializeProject({ ...edit, ...change }, [{ ...asset, url }], []),
        ).rejects.toThrow(message);
      } finally {
        URL.revokeObjectURL(url);
      }
    },
  );

  it('refuses network URLs rather than downloading or uploading media', async () => {
    const fetched = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network attempted'));
    try {
      await expect(
        serializeProject(edit, [{ ...asset, url: 'https://example.com/video.mp4' }], []),
      ).rejects.toThrow('Media recording.mp4 must have a local blob URL.');
      expect(fetched).not.toHaveBeenCalled();
    } finally {
      fetched.mockRestore();
    }
  });

  it('reports unavailable local media rather than saving metadata-only files', async () => {
    const url = URL.createObjectURL(new Blob(['bytes']));
    URL.revokeObjectURL(url);
    await expect(serializeProject(edit, [{ ...asset, url }], [])).rejects.toThrow(
      /recording.mp4|media/i,
    );
  });

  it('leaves out unused media it cannot read or fit, names it, and still saves the rest', async () => {
    const url = URL.createObjectURL(new Blob([new Uint8Array([7, 8, 9])], { type: 'video/mp4' }));
    const gone = URL.createObjectURL(new Blob(['bytes']));
    URL.revokeObjectURL(gone);
    const fetched = vi.spyOn(globalThis, 'fetch');
    try {
      const { file, omitted } = await serializeProject(
        edit,
        [
          { ...asset, id: 'unread', name: 'unread.mp4', url: gone },
          { ...asset, url },
          // One byte more than is left once the used 4 bytes are counted.
          { ...asset, id: 'huge', name: 'huge.mp4', url: 'blob:never-read', size: 374_999_997 },
          { ...asset, id: 'spare', name: 'spare.mp4', url, size: 374_999_996 },
          // Nothing is left after spare.mp4, not even one byte.
          { ...asset, id: 'late', name: 'late.mp4', url, size: 1 },
        ],
        [],
      );
      expect(omitted).toEqual(['unread.mp4', 'huge.mp4', 'late.mp4']);
      expect(parseProject(await file.text()).media.map((item) => item.id)).toEqual([
        'video',
        'spare',
      ]);
      expect(fetched.mock.calls.map(([target]) => target)).not.toContain('blob:never-read');
    } finally {
      fetched.mockRestore();
      URL.revokeObjectURL(url);
    }
  });

  it('refuses before reading anything when its clips need more than one file can hold', async () => {
    const fetched = vi.spyOn(globalThis, 'fetch');
    try {
      const over = { ...asset, url: 'blob:never-read', size: 375_000_001 };
      await expect(serializeProject(edit, [over], [])).rejects.toThrow(
        'Clips on the timeline use 376 MB of media and a project file holds 375 MB.',
      );
      expect(fetched).not.toHaveBeenCalled();
    } finally {
      fetched.mockRestore();
    }
    // Exactly what a file holds is still saved.
    const url = URL.createObjectURL(new Blob([new Uint8Array([1])], { type: 'video/mp4' }));
    try {
      const { omitted } = await serializeProject(edit, [{ ...asset, url, size: 375_000_000 }], []);
      expect(omitted).toEqual([]);
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('warns about library size only past what one file can hold', () => {
    expect(librarySizeWarning([{ size: 300_000_000 }, { size: 75_000_000 }])).toBeNull();
    expect(librarySizeWarning([{ size: 300_000_000 }, { size: 75_000_001 }])).toContain(
      'Library media totals 376 MB and a project file holds 375 MB.',
    );
  });
});

describe('the version 4 track registry', () => {
  const registry: TrackDef[] = [
    { id: 'bg-1', label: 'Background · Full frame', kind: 'visual', role: 'background' },
    DEFAULT_TRACKS[1],
    DEFAULT_TRACKS[0],
    DEFAULT_TRACKS[2],
    DEFAULT_TRACKS[3],
    { id: 'audio-1', label: 'Audio', kind: 'audio', gain: 1 },
  ];
  const v4 = () => ({
    ...project(),
    version: 4,
    tracks: structuredClone(registry),
    clips: [
      ...structuredClone(edit.clips),
      { id: 'under', assetId: 'video', track: 'bg-1', start: 0, duration: 30, offset: 0 },
      { id: 'extra', assetId: 'video', track: 'audio-1', start: 5, duration: 20, offset: 0 },
    ],
    muted: ['audio-1'],
    locked: ['bg-1'],
    selectedTracks: ['audio-1', 'camera'],
  });

  it('opens legacy files with the four default tracks', () => {
    expect(parseProject(JSON.stringify(project())).edit.tracks).toEqual(DEFAULT_TRACKS);
  });

  it('saves a changed registry as version 4 and reopens order, roles, gains and toggles', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    try {
      const opened = parseProject(JSON.stringify(v4()));
      expect(opened.edit.tracks).toEqual(registry);
      const saved = await (
        await serializeProject(opened.edit, [{ ...asset, url }], opened.muted, {
          locked: opened.locked,
          selectedTracks: opened.selectedTracks,
        })
      ).file.text();
      expect(JSON.parse(saved)).toMatchObject({ version: 4, tracks: registry });
      const reopened = parseProject(saved);
      expect(reopened.edit).toEqual(opened.edit);
      expect(reopened).toMatchObject({
        muted: ['audio-1'],
        locked: ['bg-1'],
        selectedTracks: ['audio-1', 'camera'],
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it('keeps the legacy version when only toggles changed, and drops toggles of removed tracks', async () => {
    const url = URL.createObjectURL(
      new Blob([new Uint8Array([0, 1, 2, 255])], { type: 'video/mp4' }),
    );
    try {
      const saved = await (
        await serializeProject(edit, [{ ...asset, url }], ['music', 'audio-gone'], {
          locked: ['bg-gone', 'voice'],
          selectedTracks: ['bg-gone'],
        })
      ).file.text();
      expect(JSON.parse(saved)).toMatchObject({
        version: 2,
        muted: ['music'],
        locked: ['voice'],
        selectedTracks: [],
      });
      expect(JSON.parse(saved)).not.toHaveProperty('tracks');
    } finally {
      URL.revokeObjectURL(url);
    }
  });

  it.each([
    ['a v4 file without tracks', { tracks: undefined }, /tracks/i],
    ['tracks in a v2 file', { version: 2 }, /version 4/i],
    ['duplicate track IDs', { tracks: [...registry, registry[0]] }, /duplicate/i],
    [
      'an unknown role',
      { tracks: [{ ...registry[0], role: 'overlay' }, ...registry.slice(1)] },
      /role/i,
    ],
    [
      'a negative gain',
      { tracks: [...registry.slice(0, 5), { ...registry[5], gain: -1 }] },
      /gain/i,
    ],
    [
      'a non-numeric gain',
      { tracks: [...registry.slice(0, 5), { ...registry[5], gain: '1' }] },
      /gain/i,
    ],
    [
      'an unknown kind',
      { tracks: [...registry.slice(0, 5), { ...registry[5], kind: 'midi' }] },
      /kind/i,
    ],
    ['a clip on a missing track', { tracks: registry.slice(0, 5) }, /track/i],
    ['a mute of a missing track', { muted: ['nope'] }, /track/i],
    ['a lock of a missing track', { locked: ['nope'] }, /track/i],
  ])('rejects %s', (_name, change, error) => {
    expect(() => parseProject(JSON.stringify({ ...v4(), ...change }))).toThrow(error);
  });

  it('checks each clip against its track kind', () => {
    const opened = parseProject(JSON.stringify(v4())).edit;
    expect(() => validateSources(opened, [asset])).not.toThrow();
    expect(() => validateSources(opened, [{ ...asset, hasAudio: false }])).toThrow(/audio/i);
    expect(() => validateSources(opened, [{ ...asset, kind: 'audio' }])).toThrow(/video|image/i);
  });
});

describe('chapters', () => {
  const withChapters = (chapters: unknown) => JSON.stringify({ ...project(), chapters });
  const marks = (text: string) => parseProject(text).edit.chapters;

  it('keeps them in frame order with trimmed titles, whatever order the file lists them', () => {
    expect(
      marks(
        withChapters([
          { frame: 90, title: '  Wrap up ' },
          { frame: 0, title: 'Intro' },
          { frame: 59, title: 'Middle' },
        ]),
      ),
    ).toEqual([
      { frame: 0, title: 'Intro' },
      { frame: 59, title: 'Middle' },
      { frame: 90, title: 'Wrap up' },
    ]);
  });

  it('opens a file without chapters unchanged, with no chapters key at all', () => {
    expect('chapters' in parseProject(JSON.stringify(project())).edit).toBe(false);
    expect('chapters' in parseProject(withChapters([])).edit).toBe(false);
  });

  it('accepts a 200 character title and the last frame of 24 hours, and refuses one more of each', () => {
    const last = 24 * 60 * 60 * 30 - 1;
    expect(marks(withChapters([{ frame: last, title: 'x'.repeat(200) }]))).toHaveLength(1);
    expect(() => parseProject(withChapters([{ frame: last + 1, title: 'a' }]))).toThrow(/24 hours/);
    expect(() => parseProject(withChapters([{ frame: 0, title: 'x'.repeat(201) }]))).toThrow(
      /200 characters/,
    );
    // Spaces around a title do not count toward the 200.
    expect(marks(withChapters([{ frame: 0, title: ` ${'x'.repeat(200)} ` }]))).toHaveLength(1);
  });

  it.each([
    [
      'two at one frame',
      [
        { frame: 5, title: 'a' },
        { frame: 5, title: 'b' },
      ],
      /share a frame/,
    ],
    ['a fractional frame', [{ frame: 1.5, title: 'a' }], /integer/],
    ['a negative frame', [{ frame: -1, title: 'a' }], /frame/],
    ['an empty title', [{ frame: 1, title: '   ' }], /title/],
    ['a missing title', [{ frame: 1 }], /title/],
    ['a list that is not an array', { frame: 1, title: 'a' }, /array/],
  ])('refuses %s', (_name, chapters, message) => {
    expect(() => parseProject(withChapters(chapters))).toThrow(message);
  });

  it('saves and reopens them, and a second save is byte-identical to the first', async () => {
    const url = URL.createObjectURL(new Blob([new Uint8Array([0, 1])], { type: 'video/mp4' }));
    try {
      const chapters = [
        { frame: 0, title: 'Intro' },
        { frame: 45, title: 'Demo' },
      ];
      const first = await (
        await serializeProject({ ...edit, chapters }, [{ ...asset, url }], [])
      ).file.text();
      expect(JSON.parse(first).version).toBe(2);
      expect(JSON.parse(first).chapters).toEqual(chapters);
      const reopened = parseProject(first);
      expect(reopened.edit.chapters).toEqual(chapters);
      const second = await (
        await serializeProject(reopened.edit, [{ ...asset, url }], [])
      ).file.text();
      expect(second).toBe(first);
      // Without chapters, the file never mentions them.
      const plain = await (await serializeProject(edit, [{ ...asset, url }], [])).file.text();
      expect(plain).not.toContain('chapters');
    } finally {
      URL.revokeObjectURL(url);
    }
  });
});

describe('clip gain', () => {
  const gained = (gain: unknown) => {
    const value = project();
    Object.assign(value.clips[0], { gain });
    return JSON.stringify(value);
  };

  it('reopens a gain, and accepts both limits exactly', () => {
    for (const gain of [-24, -6, 0.5, 12])
      expect(parseProject(gained(gain)).edit.clips[0].gain).toBe(gain);
  });

  it.each([-24.5, 12.5, 100, '6', null, true])('refuses a gain of %j', (gain) => {
    expect(() => parseProject(gained(gain))).toThrow(/gain/);
  });

  it('leaves no gain key at 0 or when absent, so old files open and save unchanged', async () => {
    expect('gain' in parseProject(gained(0)).edit.clips[0]).toBe(false);
    expect('gain' in parseProject(JSON.stringify(project())).edit.clips[0]).toBe(false);
    const url = URL.createObjectURL(new Blob([new Uint8Array([0, 1])], { type: 'video/mp4' }));
    try {
      const saved = await (await serializeProject(edit, [{ ...asset, url }], [])).file.text();
      expect(saved).not.toContain('gain');
      const next = { ...edit, clips: [{ ...edit.clips[0], gain: -6 }] };
      const first = await (await serializeProject(next, [{ ...asset, url }], [])).file.text();
      expect(JSON.parse(first).clips[0].gain).toBe(-6);
      const again = parseProject(first).edit;
      expect(again.clips[0].gain).toBe(-6);
      expect(await (await serializeProject(again, [{ ...asset, url }], [])).file.text()).toBe(
        first,
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  });
});

describe('clip sizing', () => {
  const sized = (sizing: Record<string, unknown>) => {
    const value = project();
    Object.assign(value.clips[0], sizing);
    return JSON.stringify(value);
  };

  it('reopens fit and scale, accepts both scale limits, and keeps no keys for a legacy clip', () => {
    for (const scale of [0.1, 0.55, 4])
      expect(parseProject(sized({ fit: 'contain', scale })).edit.clips[0]).toMatchObject({
        fit: 'contain',
        scale,
      });
    expect(parseProject(sized({ fit: 'cover' })).edit.clips[0].fit).toBe('cover');
    const legacy = parseProject(JSON.stringify(project())).edit.clips[0];
    expect('fit' in legacy || 'scale' in legacy).toBe(false);
    expect('scale' in parseProject(sized({ scale: 1 })).edit.clips[0]).toBe(false);
  });

  it.each([
    { fit: 'stretch' },
    { fit: null },
    { scale: 0.09 },
    { scale: 4.01 },
    { scale: 0 },
    { scale: -1 },
    { scale: '1.5' },
    { scale: null },
  ])('refuses %j', (sizing) => {
    expect(() => parseProject(sized(sizing))).toThrow(/fit|scale/);
  });

  it('saves sizing and a second save is byte-identical', async () => {
    const url = URL.createObjectURL(new Blob([new Uint8Array([0, 1])], { type: 'video/mp4' }));
    try {
      const next = { ...edit, clips: [{ ...edit.clips[0], fit: 'contain' as const, scale: 0.5 }] };
      const first = await (await serializeProject(next, [{ ...asset, url }], [])).file.text();
      expect(JSON.parse(first).clips[0]).toMatchObject({ fit: 'contain', scale: 0.5 });
      const again = parseProject(first).edit;
      expect(await (await serializeProject(again, [{ ...asset, url }], [])).file.text()).toBe(
        first,
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  });
});
