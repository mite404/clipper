import { AbsoluteFill, Audio, Sequence, Video, useCurrentFrame } from 'remotion';
import type { Asset } from './media';
import { type Clip, type Track, type Zoom, zoomCamera } from './timeline';

export type Layout = {
  swapped?: boolean;
  radius: number;
  screenX: number;
  screenY: number;
  cameraX: number;
  cameraY: number;
};
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
  return (
    <AbsoluteFill
      style={{
        background: '#172324',
        color: '#fff',
      }}
    >
      {(['screen', 'camera'] as const).map((track) => (
        <div
          key={track}
          data-testid={`${track}-mask`}
          style={{
            position: 'absolute',
            left: layout.swapped ? (track === 'screen' ? 390 : 10) : track === 'screen' ? 10 : 908,
            top: 10,
            width: track === 'screen' ? 880 : 362,
            height: 700,
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
              transform:
                track === 'screen'
                  ? `translate(${camera.x}%, ${camera.y}%) scale(${camera.scale})`
                  : 'scale(1)',
              transformOrigin: '50% 50%',
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
                          objectPosition:
                            track === 'screen'
                              ? `${layout.screenX}% ${layout.screenY}%`
                              : `${layout.cameraX}% ${layout.cameraY}%`,
                        }}
                      />
                    </Sequence>
                  )
                );
              })}
          </div>
        </div>
      ))}
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
