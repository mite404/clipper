import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Video,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { useMemo } from 'react';
import type { Asset } from './media';
import { cameraTransform, coverRect, cropPosition, maskRect, STAGE, type Layout } from './stage';
import { paintOrder, type Clip, type Track, type TrackDef, type Zoom } from './timeline-model';
import { cursorFrame } from './cursor-render';
import { prepareFraming, framingAt } from './framing';

export type CompositionProps = {
  clips: Clip[];
  assets: Asset[];
  zooms: Zoom[];
  layout: Layout;
  /** The ordered registry: visual tracks paint back to front, audio tracks mix at their gains. */
  tracks: TrackDef[];
  muted: Track[];
};

/** Frame-driven video masks, source trims, audio and camera motion share Remotion's clock. */
export function Composition({ clips, assets, zooms, layout, tracks, muted }: CompositionProps) {
  const frame = useCurrentFrame();
  const size = useVideoConfig();
  const scale = size.width / STAGE.width;
  const paths = useMemo(
    () => prepareFraming(zooms, clips, assets, layout, tracks),
    [zooms, clips, assets, layout, tracks],
  );
  const camera = framingAt(zooms, paths, frame);
  const cursor = cursorFrame(clips, assets, frame, layout, tracks, size);
  const gains = new Map(tracks.flatMap((t) => (t.kind === 'audio' ? [[t.id, t.gain]] : [])));
  return (
    <AbsoluteFill
      style={{
        background: '#172324',
        color: '#fff',
      }}
    >
      {paintOrder(tracks, layout.mode === 'pip').map(({ id, role, placeholder }) => {
        const mask = maskRect(role, layout, size); // → actual render-pixel rect
        const view = cameraTransform(mask, role === 'screen' ? camera : undefined); // → affine
        const crop = cropPosition(role, layout); // → percent
        return (
          <div
            key={id}
            data-testid={`${id}-mask`}
            data-role={role}
            style={{
              position: 'absolute',
              left: mask.x,
              top: mask.y,
              width: mask.width,
              height: mask.height,
              borderRadius: role === 'background' ? 0 : layout.radius * scale,
              overflow: 'hidden',
              ...(placeholder && { background: '#10181b' }),
            }}
          >
            <div
              data-testid={`${id}-content`}
              style={{
                width: '100%',
                height: '100%',
                transform: `translate(${view.x - mask.x}px, ${view.y - mask.y}px) scale(${view.scale})`,
                transformOrigin: '0 0',
              }}
            >
              {clips
                .filter((clip) => clip.track === id)
                .map((clip) => {
                  const asset = assets.find((a) => a.id === clip.assetId);
                  if (!asset) return null;
                  const cover = coverRect(mask, asset, crop);
                  const style = {
                    position: 'absolute' as const,
                    left: cover.x,
                    top: cover.y,
                    width: cover.width,
                    height: cover.height,
                  };
                  return (
                    <Sequence
                      key={clip.id}
                      from={clip.start}
                      durationInFrames={clip.duration}
                      premountFor={30}
                      postmountFor={30}
                    >
                      {asset.kind === 'image' ? (
                        <Img src={asset.url} alt="" style={style} />
                      ) : (
                        <Video
                          src={asset.url}
                          trimBefore={clip.offset}
                          muted
                          pauseWhenBuffering
                          style={style}
                        />
                      )}
                    </Sequence>
                  );
                })}
              {cursor?.track === id && (
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
                    transform: `rotate(${cursor.rotation}deg)`,
                    transformOrigin: `${cursor.hotspotX}px ${cursor.hotspotY}px`,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
      {clips
        .filter((clip) => gains.has(clip.track))
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
                  volume={muted.includes(clip.track) ? 0 : gains.get(clip.track)}
                />
              </Sequence>
            )
          );
        })}
    </AbsoluteFill>
  );
}
