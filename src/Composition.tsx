import { AbsoluteFill, Audio, Img, Sequence, Video, useCurrentFrame } from 'remotion';
import type { Asset } from './media';
import { cameraTransform, cropPosition, maskRect, type Layout } from './stage';
import { type Clip, type Track, type Zoom, zoomCamera } from './timeline';
import { cursorFrame } from './cursor-render';

export type CompositionProps = {
  clips: Clip[];
  assets: Asset[];
  zooms: Zoom[];
  layout: Layout;
  muted: Track[];
};

/** Frame-driven video masks, source trims, audio and camera motion share Remotion's clock. */
export function Composition({ clips, assets, zooms, layout, muted }: CompositionProps) {
  const frame = useCurrentFrame();
  const camera = zoomCamera(zooms, frame);
  const cursor = cursorFrame(clips, assets, frame, layout);
  return (
    <AbsoluteFill
      style={{
        background: '#172324',
        color: '#fff',
      }}
    >
      {(['screen', 'camera'] as const).map((track) => {
        const mask = maskRect(track, layout); // → stage rect
        const view = cameraTransform(mask, track === 'screen' ? camera : undefined); // → affine
        const crop = cropPosition(track, layout); // → percent
        return (
          <div
            key={track}
            data-testid={`${track}-mask`}
            style={{
              position: 'absolute',
              left: mask.x,
              top: mask.y,
              width: mask.width,
              height: mask.height,
              borderRadius: layout.radius,
              overflow: 'hidden',
              background: '#10181b',
              boxShadow: '0 25px 65px #0005',
            }}
          >
            <div
              data-testid={`${track}-content`}
              style={{
                width: '100%',
                height: '100%',
                transform: `translate(${view.x - mask.x}px, ${view.y - mask.y}px) scale(${view.scale})`,
                transformOrigin: '0 0',
              }}
            >
              {clips
                .filter((clip) => clip.track === track)
                .map((clip) => {
                  const asset = assets.find((a) => a.id === clip.assetId);
                  return (
                    asset && (
                      <Sequence
                        key={clip.id}
                        from={clip.start}
                        durationInFrames={clip.duration}
                        premountFor={30}
                        postmountFor={30}
                      >
                        <Video
                          src={asset.url}
                          trimBefore={clip.offset}
                          muted
                          pauseWhenBuffering
                          style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: `${crop.x}% ${crop.y}%`,
                          }}
                        />
                      </Sequence>
                    )
                  );
                })}
              {track === 'screen' && cursor && (
                <Img
                  data-testid="cursor-preview"
                  src={cursor.imageDataUrl}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: cursor.x,
                    top: cursor.y,
                    width: cursor.width,
                    height: cursor.height,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
      {clips
        .filter((clip) => clip.track === 'voice' || clip.track === 'music')
        .map((clip) => {
          const asset = assets.find((a) => a.id === clip.assetId);
          return (
            asset &&
            asset.hasAudio && (
              <Sequence
                key={clip.id}
                from={clip.start}
                durationInFrames={clip.duration}
                layout="none"
              >
                <Audio
                  src={asset.url}
                  trimBefore={clip.offset}
                  volume={muted.includes(clip.track) ? 0 : clip.track === 'music' ? 0.22 : 1}
                />
              </Sequence>
            )
          );
        })}
    </AbsoluteFill>
  );
}
