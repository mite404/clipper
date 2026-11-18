import { expect, it } from 'vitest';
import { prepareFraming, framingAt } from './framing';
import { cursorFixture } from './cursor.fixture';
import type { Asset } from './media';
import { DEFAULT_TRACKS, zoomCamera, type Clip, type TrackDef, type Zoom } from './timeline-model';

const layout = { radius: 22, screenX: 50, screenY: 50, cameraX: 50, cameraY: 50 };
const clip: Clip = { id: 's', assetId: 'a', track: 'screen', start: 0, offset: 30, duration: 120 };
const asset: Asset = {
  id: 'a',
  name: 'Synthetic',
  kind: 'video',
  url: '',
  size: 0,
  width: 880,
  height: 700,
  duration: 300,
  thumbnail: '',
  peaks: [],
  hasAudio: false,
  cursor: {
    offsetMs: 100,
    recording: {
      ...cursorFixture,
      samples: [
        { timeMs: 900, cx: 0.5, cy: 0.5 },
        { timeMs: 1400, cx: 0.52, cy: 0.48 },
        { timeMs: 1900, cx: 0.9, cy: 0.1 },
        { timeMs: 2400, cx: 0.1, cy: 0.9, visible: false },
      ],
    },
  },
};
const zoom: Zoom = { id: 'z', start: 0, duration: 120, scale: 2, x: 50, y: 50, follow: 'focused' };

it('holds small motion, follows source-time activity and seeks deterministically', () => {
  const paths = prepareFraming([zoom], [clip], [asset], layout, DEFAULT_TRACKS);
  expect(framingAt([zoom], paths, 29).x).toBe(0);
  expect(framingAt([zoom], paths, 30).x).toBe(0);
  expect(framingAt([zoom], paths, 36).x).toBeCloseTo(-37.5);
  expect(framingAt([zoom], paths, 36).y).toBeCloseTo(37.5);
  const later = framingAt([zoom], paths, 60);
  expect(later.x).toBeLessThan(-49);
  for (const frame of [110, 2, 75, 36, 1]) framingAt([zoom], paths, frame);
  expect(framingAt([zoom], paths, 60)).toEqual(later);
  const smooth = { ...zoom, follow: 'smooth' as const };
  const fluid = prepareFraming([smooth], [clip], [asset], layout, DEFAULT_TRACKS);
  expect(framingAt([smooth], fluid, 36).x).toBeGreaterThan(-25);
});

it('resets at cuts, ignores camera clips and clamps every ramp frame within source edges', () => {
  const cuts = [
    { ...clip, duration: 60 },
    { ...clip, id: 'next', start: 60, offset: 0, duration: 60 },
  ];
  const paths = prepareFraming(
    [zoom],
    [...cuts, { ...clip, id: 'face', track: 'camera' }],
    [asset],
    layout,
    DEFAULT_TRACKS,
  );
  expect(framingAt([zoom], paths, 59).x).toBeLessThan(-49);
  expect(framingAt([zoom], paths, 60).x).toBe(0);
  for (let frame = 0; frame < 120; frame++) {
    const camera = framingAt([zoom], paths, frame);
    expect(Math.abs(camera.x)).toBeLessThanOrEqual((camera.scale - 1) * 50 + 1e-8);
    expect(Math.abs(camera.y)).toBeLessThanOrEqual((camera.scale - 1) * 50 + 1e-8);
  }
  expect(framingAt([zoom], paths, 120)).toEqual({ scale: 1, x: 0, y: 0 });
});

it('preserves fixed manual motion and falls back without telemetry', () => {
  const manual = { ...zoom, follow: undefined };
  for (const shot of [manual, zoom]) {
    const paths = prepareFraming(
      [shot],
      [clip],
      [{ ...asset, cursor: undefined }],
      layout,
      DEFAULT_TRACKS,
    );
    expect(framingAt([shot], paths, 42)).toEqual(zoomCamera([shot], 42));
  }
});

it('follows the front screen-role clip where V1 and V3 overlap, and V1 elsewhere', () => {
  const tracks: TrackDef[] = [
    ...DEFAULT_TRACKS,
    { id: 's2', label: 'Screen 2 · Masked', kind: 'visual', role: 'screen' },
  ];
  // V3's take moves the other way, so following the wrong sidecar pans the other way.
  const mirror: Asset = {
    ...asset,
    id: 'b',
    cursor: {
      ...asset.cursor!,
      recording: {
        ...asset.cursor!.recording,
        samples: asset.cursor!.recording.samples.map((s) => ({ ...s, cx: 1 - s.cx, cy: 1 - s.cy })),
      },
    },
  };
  const top: Clip = { ...clip, id: 'top', assetId: 'b', track: 's2', start: 40, duration: 40 };
  const both = prepareFraming([zoom], [clip, top], [asset, mirror], layout, tracks);
  const front = prepareFraming([zoom], [top], [asset, mirror], layout, tracks);
  const back = prepareFraming([zoom], [clip], [asset, mirror], layout, tracks);
  for (const frame of [40, 60, 79])
    expect(framingAt([zoom], both, frame)).toEqual(framingAt([zoom], front, frame));
  // By frame 79 V3's mirrored cursor is at the left, so the camera pans right, unlike V1's.
  expect(framingAt([zoom], both, 79).x).toBeGreaterThan(40);
  expect(framingAt([zoom], back, 79).x).toBeLessThan(-40);
  // V1's path restarts after V3 ends, as at any cut, and V1 alone frames the start.
  for (const frame of [0, 36, 39])
    expect(framingAt([zoom], both, frame)).toEqual(framingAt([zoom], back, frame));
  expect(framingAt([zoom], both, 80).x).toBe(0);
});
