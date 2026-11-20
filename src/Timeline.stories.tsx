import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline, type TrackToggles } from './Timeline';
import { WAVE_RATE, type Asset } from './media';
import { DEFAULT_TRACKS as TRACKS, FPS, type Clip, type Track } from './timeline-model';
import './styles.css';

const CASES = {
  'Demo data': { count: 4, duration: 360, length: 360 },
  'Worst case': { count: 8, duration: 3600 * FPS, length: 1800 * FPS },
  Empty: { count: 0, duration: 1, length: 1 },
  One: { count: 1, duration: 1, length: 1 },
  '1,000 clips': { count: 1000, duration: 3000, length: 12 },
  // UI-14: per lane a long region, a start-trimmed one and one- and two-frame slivers.
  Regions: { count: 16, duration: 900, length: 0 },
};
const REGIONS = [
  { start: 0, duration: 420, offset: 0 },
  { start: 420, duration: 300, offset: 1800 },
  { start: 720, duration: 1, offset: 0 },
  { start: 760, duration: 2, offset: 0 },
];
const NAMES = [
  'Q3_Board_Review_Platform_Infrastructure_Walkthrough_v12_approved_by_legal.mp4',
  'J',
  'Đặng Thị Ngọc Hân - 录音_👩🏽‍💻_review_final.wav',
  'Ambient bed',
];
const THUMBNAIL = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#40576c"/></svg>')}`;
// An hour of speech-like waveform bins: syllables under a slower phrase envelope.
const PEAKS = Float32Array.from({ length: 3600 * WAVE_RATE }, (_, bin) =>
  Math.abs(Math.sin(bin * 0.09) * Math.sin(bin * 0.0013) * (0.6 + 0.4 * Math.sin(bin * 1.7))),
);
const ASSETS: Asset[] = TRACKS.map(({ id }, index) => ({
  id,
  name: NAMES[index],
  kind: index < 2 ? 'video' : 'audio',
  url: '',
  size: 0,
  duration: 3600 * FPS,
  width: 1920,
  height: 1080,
  peaks: PEAKS,
  hasAudio: index > 1,
  thumbnail: THUMBNAIL,
}));

function TimelineOverflow() {
  const [mode, setMode] = useState(
    () =>
      Object.entries(CASES).find(
        ([name]) => name === new URLSearchParams(location.search).get('data'),
      )?.[1] ?? CASES['Demo data'],
  );
  const [selected, setSelected] = useState('');
  const [frame, setFrame] = useState(0);
  const [tracks, setTracks] = useState<TrackToggles>({
    muted: [],
    solo: [],
    locked: [],
    selected: [],
  });
  const { count, duration, length } = mode;
  const clips: Clip[] = Array.from({ length: count }, (_, index) => ({
    id: `clip-${index}`,
    assetId: mode === CASES['Worst case'] && index === 7 ? 'missing' : TRACKS[index % 4].id,
    track: TRACKS[index % 4].id,
    start: Math.floor(index / 4) * length,
    duration: length,
    offset: 0,
    ...(mode === CASES.Regions && REGIONS[Math.floor(index / 4)]),
  }));
  return (
    <>
      <section className="sequence-area" style={{ height: 300, marginBottom: 70 }}>
        <Timeline
          headers={{
            registry: TRACKS,
            tracks,
            onToggleTrack: (list, track: Track) =>
              setTracks((previous) => ({
                ...previous,
                [list]: previous[list].includes(track)
                  ? previous[list].filter((item) => item !== track)
                  : [...previous[list], track],
              })),
            onMoveTrack: () => {},
          }}
          clips={clips}
          assets={
            mode === CASES['Demo data']
              ? ASSETS.map((asset, index) => ({ ...asset, name: TRACKS[index].label }))
              : ASSETS
          }
          zooms={
            count > 1 ? [{ id: 'zoom', start: 0, duration: length, scale: 2, x: 50, y: 50 }] : []
          }
          duration={duration}
          frame={frame}
          selected={selected}
          onSelect={setSelected}
          onSeek={setFrame}
        />
      </section>
      <div
        role="group"
        aria-label="Timeline data"
        style={{
          position: 'fixed',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          width: 'max-content',
          maxWidth: '95%',
          padding: 6,
          borderRadius: 8,
          background: '#444',
          zIndex: 20,
        }}
      >
        {Object.entries(CASES).map(([name, choice]) => (
          <button
            key={name}
            aria-pressed={mode === choice}
            onClick={() => {
              setMode(choice);
              setFrame(0);
              setSelected('');
              const url = new URL(location.href);
              url.searchParams.set('data', name);
              history.replaceState(null, '', url);
            }}
            style={{
              padding: '8px 10px',
              background: mode === choice ? '#fff' : '#555',
              color: mode === choice ? '#111' : '#eee',
              borderRadius: 5,
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </>
  );
}

const meta = {
  title: 'Editor/Timeline overflow',
  component: TimelineOverflow,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TimelineOverflow>;
export default meta;
/** Dev-only realistic names, hour-long tracks, missing media and dense edit stress cases. */
export const Stress: StoryObj<typeof meta> = {};
