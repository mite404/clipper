import { expect, it } from 'vitest';
import { prepareFraming, framingAt } from './framing';
import { cameraTransform, clipRect, cropPosition, maskRect, sourceToStage } from './stage';
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

// The scaled source must cover its mask on every frame: no empty mask at any edge.
function coversMask(camera: { scale: number; x: number; y: number }, source: Asset) {
  const mask = maskRect('screen', layout);
  const cover = clipRect(mask, source, cropPosition('screen', layout), {});
  const view = cameraTransform(mask, camera);
  const left = view.x + cover.x * view.scale;
  const top = view.y + cover.y * view.scale;
  return (
    left <= mask.x + 1e-6 &&
    top <= mask.y + 1e-6 &&
    left + cover.width * view.scale >= mask.x + mask.width - 1e-6 &&
    top + cover.height * view.scale >= mask.y + mask.height - 1e-6
  );
}

it('stops a fixed or follow zoom at the source edge instead of revealing empty mask', () => {
  // The owner's recording: 1.4x focused at 83%, 87% would leave about a quarter of the mask empty.
  const edge: Zoom = { id: 'e', start: 0, duration: 120, scale: 1.4, x: 83, y: 87 };
  const wide: Asset = { ...asset, id: 'w', width: 960, height: 540, cursor: undefined };
  for (const source of [asset, wide])
    for (const shot of [edge, { ...edge, follow: 'focused' as const }]) {
      const clips = [{ ...clip, assetId: source.id }];
      const paths = prepareFraming([shot], clips, [source], layout, DEFAULT_TRACKS);
      let previous = framingAt([shot], paths, 0);
      for (let frame = 0; frame <= 120; frame++) {
        const camera = framingAt([shot], paths, frame);
        expect(coversMask(camera, source)).toBe(true);
        // Ramps stay smooth: the clamp never makes the camera jump between frames.
        expect(Math.abs(camera.x - previous.x)).toBeLessThan(6);
        expect(Math.abs(camera.y - previous.y)).toBeLessThan(6);
        previous = camera;
      }
    }
  const hold = (source: Asset) =>
    framingAt(
      [edge],
      prepareFraming([edge], [{ ...clip, assetId: source.id }], [source], layout, DEFAULT_TRACKS),
      60,
    );
  // Cover equals the mask: the zoom stops at both mask edges, 20% for a 1.4x zoom.
  expect(hold({ ...asset, cursor: undefined })).toEqual({ scale: 1.4, x: -20, y: -20 });
  // A wide source overflows the mask sideways, so the zoom may pan into that overflow and centre x.
  const wideHold = hold(wide);
  expect(wideHold.x).toBeCloseTo(-46.2);
  expect(wideHold.y).toBeCloseTo(-20);
});

it('keeps a clip that leaves bars centred in its mask, with equal margins, under any zoom', () => {
  const edge: Zoom = { id: 'e', start: 0, duration: 120, scale: 1.4, x: 83, y: 87 };
  const hold = (source: Asset, sizing: Pick<Clip, 'fit' | 'scale'>, zoom: Zoom) => {
    const clips = [{ ...clip, ...sizing, assetId: source.id }];
    return framingAt([zoom], prepareFraming([zoom], clips, [source], layout, DEFAULT_TRACKS), 60);
  };
  const wide: Asset = { ...asset, id: 'w', width: 1920, height: 1080, cursor: undefined };
  const square: Asset = { ...asset, cursor: undefined };
  // Fit leaves bars above and below, so only y centres; x still stops at the source edge.
  const fitted = hold(wide, { fit: 'contain' }, edge);
  expect(fitted.x).toBeCloseTo(-20);
  expect(fitted.y).toBeCloseTo(0);
  // At 50% the clip leaves bars on all sides, wherever the zoom is focused.
  for (const zoom of [edge, { ...edge, x: 50, y: 50, scale: 1.25 }]) {
    const half = hold(square, { scale: 0.5 }, zoom);
    expect(half.x).toBeCloseTo(0);
    expect(half.y).toBeCloseTo(0);
  }
});

it('moves the clamp only where the owning clip changes between sources of different aspect', () => {
  const edge: Zoom = { id: 'e', start: 0, duration: 120, scale: 1.4, x: 83, y: 87 };
  const square: Asset = { ...asset, cursor: undefined };
  const wide: Asset = { ...asset, id: 'w', width: 960, height: 540, cursor: undefined };
  const clips: Clip[] = [
    { ...clip, duration: 60 },
    { ...clip, id: 'next', assetId: 'w', start: 60, duration: 60 },
  ];
  const paths = prepareFraming([edge], clips, [square, wide], layout, DEFAULT_TRACKS);
  const cameras = Array.from({ length: 120 }, (_, frame) => framingAt([edge], paths, frame));
  for (let frame = 1; frame < 120; frame++) {
    if (frame === 60) continue;
    expect(Math.abs(cameras[frame].x - cameras[frame - 1].x)).toBeLessThan(6);
    expect(Math.abs(cameras[frame].y - cameras[frame - 1].y)).toBeLessThan(6);
  }
  // At the cut the wide source's sideways overflow lets the hold pan further: the only jump.
  expect(cameras[59]).toEqual({ scale: 1.4, x: -20, y: -20 });
  expect(cameras[60].x).toBeCloseTo(-46.2);
  expect(cameras[60].y).toBeCloseTo(-20);
});

it('marks the mouse focus on the unzoomed frame, so a press maps straight to the source under it', () => {
  // A held mark renders with no zooms; the press's percent of the mask is the stored focus.
  const edge: Zoom = { id: 'e', start: 0, duration: 120, scale: 1.4, x: 83, y: 87 };
  const paths = prepareFraming([edge], [clip], [asset], layout, DEFAULT_TRACKS);
  for (const frame of [0, 60, 119])
    expect(framingAt([], paths, frame)).toEqual(zoomCamera([], frame));
  const mask = maskRect('screen', layout);
  const cover = clipRect(mask, asset, cropPosition('screen', layout), {});
  const press = { x: mask.x + 0.83 * mask.width, y: mask.y + 0.87 * mask.height };
  const source = {
    x: (0.83 * mask.width - cover.x) / cover.width,
    y: (0.87 * mask.height - cover.y) / cover.height,
  };
  const point = sourceToStage(source, mask, cover, framingAt([], paths, 60));
  expect(point.x).toBeCloseTo(press.x);
  expect(point.y).toBeCloseTo(press.y);
});
