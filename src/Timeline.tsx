import { Camera, Film, Mic, Music2, Volume2, VolumeX, ZoomIn } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Asset } from './media';
import { FPS, trimClip, type Clip, type Track, type Zoom } from './timeline-model';
import { IconButton, Waveform, timecode } from './components';

export const TRACKS = [
  { id: 'screen', label: 'Screen recording', detail: 'V1', Icon: Film },
  { id: 'camera', label: 'Talking head', detail: 'V2', Icon: Camera },
  { id: 'voice', label: 'Voiceover', detail: 'A1', Icon: Mic },
  { id: 'music', label: 'Music', detail: 'A2', Icon: Music2 },
] satisfies { id: Track; label: string; detail: string; Icon: typeof Film }[];

// Report a trim only when it moved the edge. trimClip only shortens, so an equal duration means
// nothing moved: a plain click on a grip, or an arrow key in the direction it cannot go.
function commitTrim(
  onTrim: ((clip: Clip) => void) | undefined,
  clip: Clip,
  edge: 'left' | 'right',
  delta: number,
): void {
  const next = trimClip(clip, edge, delta); // → Clip
  if (next.duration !== clip.duration) onTrim?.(next);
}

function useTimelineScale(seconds: number) {
  const viewport = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, label: 152 });
  const [chosenScale, setScale] = useState(40);
  const minScale = dimensions.width ? (dimensions.width - dimensions.label) / seconds : 20;
  const maxScale = minScale * 32;
  const scale = Math.max(minScale, Math.min(maxScale, chosenScale));
  if (scale !== chosenScale) setScale(scale);
  useLayoutEffect(() => {
    const scroll = viewport.current!;
    const heading = label.current!;
    const measure = () => {
      const style = getComputedStyle(scroll);
      const width =
        scroll.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const label = heading.getBoundingClientRect().width;
      setDimensions({ width, label });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroll);
    observer.observe(heading);
    return () => observer.disconnect();
  }, []);
  return {
    viewport,
    label,
    minScale,
    maxScale,
    scale,
    setScale,
    width: dimensions.label + seconds * scale,
  };
}

/** Multitrack timeline with a frame-accurate ruler and waveform playback highlighting. */
export function Timeline({
  clips,
  assets,
  zooms,
  frame,
  duration,
  selected,
  onSelect,
  onSeek,
  muted,
  onMute,
  onZoomSelect,
  onTrim,
}: {
  clips: Clip[];
  assets: Asset[];
  zooms: Zoom[];
  frame: number;
  duration: number;
  selected: string;
  onSelect: (id: string) => void;
  onSeek: (frame: number) => void;
  muted: Track[];
  onMute: (track: Track) => void;
  onZoomSelect: (id: string) => void;
  onTrim?: (clip: Clip) => void;
}) {
  const seconds = duration / FPS;
  const { viewport, label, minScale, maxScale, scale, setScale, width } = useTimelineScale(seconds);
  const ticks = Math.max(2, Math.min(9, Math.floor((seconds * scale) / 64) + 1));
  // A drag names its clip by ID and trims the clip as it is now, so a split, undo or delete made
  // while a grip is held is never overwritten by a copy taken at pointerdown.
  const [drag, setDrag] = useState<{
    clipId: string;
    edge: 'left' | 'right';
    x: number;
    width: number;
    delta: number;
  }>();
  return (
    <>
      <label className="timeline-scale">
        Timeline scale
        <input
          aria-label="Timeline scale"
          type="range"
          min={minScale}
          max={maxScale}
          step="any"
          value={scale}
          disabled={!clips.length}
          aria-valuetext={`${(scale / minScale).toFixed(1)} times fit`}
          onChange={(event) => setScale(Number(event.target.value))}
        />
        <output>{Number(scale.toFixed(2))} px/s</output>
      </label>
      <div
        className="timeline-scroll"
        ref={viewport}
        data-testid="timeline-scroll"
        tabIndex={0}
        role="region"
        aria-label="Scrollable timeline"
        onKeyDown={(event) => {
          if (
            event.target === event.currentTarget &&
            [
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'ArrowDown',
              'Home',
              'End',
              'PageUp',
              'PageDown',
            ].includes(event.key)
          )
            event.stopPropagation();
        }}
      >
        <div className="timeline-grid" style={{ width, minWidth: '100%' }}>
          <div className="ruler-label" ref={label}>
            <span>TRACKS</span>
            <span>30 FPS</span>
          </div>
          <div className="ruler">
            {Array.from({ length: ticks }, (_, i) => (
              <span key={i} style={{ left: `${(i / (ticks - 1)) * 100}%` }}>
                {timecode(Math.round((i / (ticks - 1)) * duration)).slice(0, 5)}
              </span>
            ))}
            <input
              aria-label="Timeline playhead"
              type="range"
              min="0"
              max={duration - 1}
              value={frame}
              onChange={(event) => onSeek(Number(event.target.value))}
            />
          </div>
          <div className="track-label zoom-label">
            <ZoomIn size={14} />
            <span>Zooms</span>
          </div>
          <div className="zoom-lane timeline-lane">
            {zooms.map((zoom) => (
              <button
                key={zoom.id}
                aria-label="Select zoom"
                className={`zoom-block ${selected === zoom.id ? 'selected' : ''}`}
                style={{
                  left: `${(zoom.start / duration) * 100}%`,
                  width: `${(zoom.duration / duration) * 100}%`,
                }}
                onClick={() => onZoomSelect(zoom.id)}
              >
                <ZoomIn size={12} />
                <span>{zoom.scale.toFixed(1)}× zoom</span>
              </button>
            ))}
            {!zooms.length && (
              <span className="lane-hint">Add a zoom to bring the details closer</span>
            )}
          </div>
          {TRACKS.map(({ id, label, detail, Icon }) => (
            <div className={`track-row track-${id}`} key={id}>
              <div className="track-label">
                <span className="track-code">{detail}</span>
                <Icon size={14} />
                <span>{label}</span>
                {(id === 'voice' || id === 'music') && (
                  <IconButton
                    label={`${muted.includes(id) ? 'Unmute' : 'Mute'} ${label}`}
                    onClick={() => onMute(id)}
                  >
                    {muted.includes(id) ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </IconButton>
                )}
              </div>
              <div
                className="timeline-lane"
                data-testid={`track-${id}`}
                onDoubleClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  onSeek(
                    Math.min(
                      duration - 1,
                      Math.max(
                        0,
                        Math.round(((event.clientX - rect.left) / rect.width) * duration),
                      ),
                    ),
                  );
                }}
              >
                {clips
                  .filter((c) => c.track === id)
                  .map((originalClip) => {
                    const clip =
                      drag?.clipId === originalClip.id
                        ? trimClip(originalClip, drag.edge, drag.delta)
                        : originalClip;
                    const asset = assets.find((a) => a.id === clip.assetId);
                    const audio = id === 'voice' || id === 'music';
                    return (
                      <button
                        key={clip.id}
                        className={`timeline-clip ${selected === clip.id ? 'selected' : ''}`}
                        aria-label={`${asset?.name ?? 'Missing media'} at ${(clip.start / FPS).toFixed(1)} seconds`}
                        aria-pressed={selected === clip.id}
                        onClick={() => onSelect(clip.id)}
                        style={{
                          left: `${(clip.start / duration) * 100}%`,
                          width: `${(clip.duration / duration) * 100}%`,
                        }}
                      >
                        <span className="clip-title">
                          {audio ? <Music2 size={12} /> : <Film size={12} />}
                          {asset?.name ?? 'Missing media'}
                        </span>
                        {audio ? (
                          <Waveform
                            peaks={asset?.peaks ?? []}
                            offset={clip.offset}
                            duration={clip.duration}
                            progress={(frame - clip.start) / clip.duration}
                          />
                        ) : (
                          <div className="filmstrip">
                            {Array.from(
                              {
                                length: Math.min(
                                  12,
                                  Math.max(1, Math.ceil(clip.duration / FPS / 2)),
                                ),
                              },
                              (_, i) => (
                                <img key={i} src={asset?.thumbnail} alt="" />
                              ),
                            )}
                          </div>
                        )}
                        {(['left', 'right'] as const).map((edge) => (
                          <span
                            key={edge}
                            className={`clip-grip ${edge}`}
                            role="slider"
                            tabIndex={0}
                            aria-label={`Trim ${edge} edge`}
                            aria-valuemin={0}
                            aria-valuemax={clip.start + clip.duration}
                            aria-valuenow={
                              edge === 'left' ? clip.start : clip.start + clip.duration
                            }
                            onKeyDown={(event) => {
                              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                              event.preventDefault();
                              event.stopPropagation();
                              commitTrim(
                                onTrim,
                                clip,
                                edge,
                                (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 10 : 1),
                              );
                            }}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              event.currentTarget.setPointerCapture(event.pointerId);
                              const lane = event.currentTarget.closest('.timeline-lane');
                              if (lane)
                                setDrag({
                                  clipId: clip.id,
                                  edge,
                                  x: event.clientX,
                                  width: lane.getBoundingClientRect().width,
                                  delta: 0,
                                });
                              onSelect(clip.id);
                            }}
                            onPointerMove={(event) => {
                              if (drag)
                                setDrag({
                                  ...drag,
                                  delta: ((event.clientX - drag.x) / drag.width) * duration,
                                });
                            }}
                            onPointerUp={(event) => {
                              if (!drag) return;
                              setDrag(undefined);
                              // Pointer capture means this grip is the one the drag started on.
                              commitTrim(
                                onTrim,
                                originalClip,
                                drag.edge,
                                ((event.clientX - drag.x) / drag.width) * duration,
                              );
                            }}
                            onPointerCancel={() => setDrag(undefined)}
                          />
                        ))}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
          <div className="playhead-area">
            <div className="playhead" style={{ left: `${(frame / duration) * 100}%` }}>
              <span />
            </div>
          </div>
          <div className="timeline-end">
            {seconds.toFixed(1)} seconds · Stereo · Local workspace
          </div>
        </div>
      </div>
    </>
  );
}
