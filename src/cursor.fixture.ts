import type { CursorRecording } from './cursor';

// Synthetic telemetry only. No private recording or native cursor bitmap.
export const cursorFixture = {
  version: 2,
  provider: 'native',
  futureMetadata: { display: 'synthetic' },
  samples: [
    { timeMs: 0, cx: 0.2, cy: 0.7, assetId: 'arrow', visible: true },
    {
      timeMs: 0,
      cx: 0.3,
      cy: 0.6,
      assetId: 'arrow',
      cursorType: 'pointer',
      interactionType: 'click',
      futureSampleField: { button: 'synthetic' },
    },
    { timeMs: 43, cx: 0.8, cy: 0.1, assetId: null, visible: false, interactionType: 'mouseup' },
    { timeMs: 152, cx: 0.9, cy: 0.4, assetId: 'arrow', interactionType: 'mouseup' },
    { timeMs: 34422, cx: 0.5, cy: 0.6, assetId: 'arrow', interactionType: 'click' },
  ],
  assets: [
    {
      id: 'arrow',
      platform: 'darwin',
      imageDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      width: 1,
      height: 1,
      hotspotX: 0.25,
      hotspotY: 0.5,
      scaleFactor: 1,
      futureAssetField: 'preserved',
    },
  ],
} satisfies CursorRecording;
