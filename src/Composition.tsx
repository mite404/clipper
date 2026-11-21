import {
  AbsoluteFill,
  Audio,
  Img,
  Internals,
  Sequence,
  Video,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { useContext, useEffect, useMemo } from 'react';
import type { Asset } from './media';
import {
  cameraTransform,
  clipRect,
  cropPosition,
  fillCss,
  maskRect,
  maskShadowCss,
  stageSize,
  type Layout,
} from './stage';
import {
  audible,
  gainFactor,
  paintOrder,
  type Clip,
  type Track,
  type TrackDef,
  type Zoom,
} from './timeline-model';
import { cursorFrame } from './cursor-render';
import { prepareFraming, framingAt } from './framing';
import { tapMeter } from './audio-meter';

export type CompositionProps = {
  clips: Clip[];
  assets: Asset[];
  zooms: Zoom[];
  layout: Layout;
  /** The ordered registry: visual tracks paint back to front, audio tracks mix at their gains. */
  tracks: TrackDef[];
  muted: Track[];
  /** Solo audio tracks; any solo narrows the mix to them, mute still wins. Absent, all sound. */
  solo?: Track[];
  /** The whole-recording gain in dB; absent plays at unity. */
  gain?: number;
  /** Receives the meter's tap on the preview mix, null when it lets go. */
  onMeter?: (analyser: AnalyserNode | null) => void;
};

// The meter's ear on the preview's shared audio path: one AnalyserNode listening on the player
// mix's master gain. Listening changes nothing about routing, and a rendering pass has no audio
// context to tap.
function MeterTap({ onMeter }: { onMeter?: (analyser: AnalyserNode | null) => void }) {
  const shared = useContext(Internals.SharedAudioContext);
  useEffect(() => tapMeter(shared?.audioContext, shared?.gainNode, onMeter), [onMeter, shared]);
  return null;
}

/** Frame-driven video masks, source trims, audio and camera motion share Remotion's clock. */
export function Composition({
  clips,
  assets,
  zooms,
  layout,
  tracks,
  muted,
  solo = [],
  gain,
  onMeter,
}: CompositionProps) {
  const frame = useCurrentFrame();
  const size = useVideoConfig();
  const scale = size.width / stageSize(layout).width;
  const paths = useMemo(
    () => prepareFraming(zooms, clips, assets, layout, tracks),
    [zooms, clips, assets, layout, tracks],
  );
  const camera = framingAt(zooms, paths, frame);
  const cursor = cursorFrame(clips, assets, frame, layout, tracks, size);
  const master = gainFactor(gain ?? 0);
  const gains = new Map(
    tracks.flatMap((t) => (t.kind === 'audio' ? [[t.id, t.gain * master]] : [])),
  );
  return (
    <AbsoluteFill
      style={{
        background: fillCss(layout),
        color: '#fff',
      }}
    >
      <MeterTap onMeter={onMeter} />
      {paintOrder(tracks, layout.mode === 'pip').map(({ id, role, placeholder }) => {
        const mask = maskRect(role, layout, size); // → actual render-pixel rect
        const view = cameraTransform(mask, role === 'screen' ? camera : undefined); // → affine
        const crop = cropPosition(role, layout); // → percent
        const contentTransform = () =>
          role === 'camera' && layout.cameraMirrored
            ? 'translateX(100%) scaleX(-1)'
            : `translate(${view.x - mask.x}px, ${view.y - mask.y}px) scale(${view.scale})`;
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
              boxShadow: maskShadowCss(role, layout, scale),
              ...(placeholder && { background: '#10181b' }),
            }}
          >
            <div
              data-testid={`${id}-content`}
              style={{
                width: '100%',
                height: '100%',
                transform: contentTransform(),
                transformOrigin: '0 0',
              }}
            >
              {clips
                .filter((clip) => clip.track === id)
                .map((clip) => {
                  const asset = assets.find((a) => a.id === clip.assetId);
                  if (!asset) return null;
                  const cover = clipRect(mask, asset, crop, clip);
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
                  // Amplification above 1 needs the Web Audio path; every clip takes it so a pooled
                  // audio element never changes route.
                  useWebAudioApi
                  volume={
                    audible(clip.track, muted, solo)
                      ? gains.get(clip.track)! * gainFactor(clip.gain)
                      : 0
                  }
                />
              </Sequence>
            )
          );
        })}
    </AbsoluteFill>
  );
}
