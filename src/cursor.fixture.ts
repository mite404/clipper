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

export const motionCursorFixture: CursorRecording = {
  version: 2,
  provider: 'native',
  samples: Array.from({ length: 350 }, (_, i) => ({
    timeMs: i * 43,
    cx: 0.5 + Math.sin(i / 30) * 0.22,
    cy: 0.5 + Math.sin(i / 45) * 0.2,
    assetId: 'arrow',
    visible: true,
    interactionType: i % 100 === 0 ? 'click' : i % 100 === 1 ? 'mouseup' : undefined,
  })),
  assets: [
    {
      id: 'arrow',
      platform: 'synthetic',
      width: 24,
      height: 32,
      hotspotX: 2,
      hotspotY: 2,
      scaleFactor: 1,
      imageDataUrl:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAgEAQAAADyx6zwAAACCklEQVRIx72WP0hbURTGvzyUUAXNIUWLBkdL23RpqINQG0HUIh1sAl1KN4ciydKWQKfMbSFkKghOLgoiiH/AKbRIpFIndShkcijUQitpSKmlOR1OLu/lj+9/PfB4l3sf5zvf97vDAy6jiAInRHEQadN+99bkdX8IKPCVz/sPiEJX/4ODOIiY9efmE58dSC3dVavjpXD/7KHvAqEasDcn69r5WnTw0euEL1xURLsTzMzMZ3+Zp88kroHTT3kvXLR2m70asPUdeP4U+HU9lgZ+fPPEpdmBsTYndfhuuGhWH8zs+MDFzIEqt1wsHfjCxY4Dt1xsO/DExakDJ1xcOXDMxa0DO1w6nE7NY0Ax2LofArARAx4eKC5vEtVCJudYoBiUJlZVLbxcBbYDpgJq2tHfQOCD7N25AeAA6Nw6vf1n5vGRucz7kwsZ1O4xP/soma5XGvPOQOU9HLFy0vYW8Rgw/xZYrt/sV4sAfurnc2l5d4+8+GIrV6MD4+SRdyvXIlMLGhFzKW2wUGa+lVcuusYdCRiby9/GcIRIYjHWeqV+JXPJrG2B5uZyhp6+4tcoEXM1pQtUU/KtnKHHlkBzc1XhXDLrCbYSaNdczrvGiSR3LusCpXR9qKkFzUJA/dm1NlflC2zzIQywyyKkR8RMFPfUvwG2PrVAFkYXu7ddCrbKXVxZ3CBnLhQr+3n/AxkoiVWe6MFCAAAAAElFTkSuQmCC',
    },
  ],
};
