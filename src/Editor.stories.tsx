import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player } from '@remotion/player';
import { Play, Scissors, Trash2, ZoomIn } from 'lucide-react';
import { userEvent, within } from 'storybook/test';
import { App, INITIAL_EDIT, Inspector, SourceMonitor } from './App';
import { Composition } from './Composition';
import { IconButton, MediaLibrary, Waveform } from './components';
import { Timeline } from './Timeline';
import { loadDemo, type Asset } from './media';
import { CursorControls } from './CursorControls';
import { AutoZoomControls } from './AutoZoomControls';
import { ZoomMotionControls } from './ZoomMotionControls';
import { cursorFixture, motionCursorFixture, behaviorCursorFixture } from './cursor.fixture';
import type { CursorTrack } from './cursor';
import type { Clip, Zoom } from './timeline-model';

function CursorRecord({ preview = false }: { preview?: boolean }) {
  const fixture = preview ? motionCursorFixture : cursorFixture;
  const [zooms, setZooms] = useState<Zoom[]>([]);
  const clips: Clip[] = [
    { id: 'screen', assetId: 'synthetic', track: 'screen', start: 0, duration: 360, offset: 0 },
  ];
  const [mode, setMode] = useState('Demo data');
  const [cursor, setCursor] = useState<CursorTrack | undefined>({
    recording: fixture,
    offsetMs: 0,
  });
  const asset: Asset = {
    id: 'synthetic',
    kind: 'video',
    duration: 9000,
    width: 960,
    height: 540,
    name:
      mode === 'Worst case'
        ? '录屏_👩🏽‍💻_Developer_Relations_Platform_Walkthrough_Review_v12_screen_recording_final.mp4'
        : 'Synthetic recording.mp4',
    url: '/media/landscape.mp4',
    peaks: [],
    thumbnail: '',
    hasAudio: false,
    cursor,
  };
  const choose = (next: string) => {
    setMode(next);
    setZooms([]);
    const counts: Record<string, number> = {
      'Demo data': fixture.samples.length,
      'Worst case': 8001,
      Empty: 0,
      One: 1,
    };
    const selected = next === 'Idle and shakes' ? behaviorCursorFixture : fixture;
    const samples = Array.from({ length: counts[next] ?? selected.samples.length }, (_, i) => ({
      ...selected.samples[i % selected.samples.length],
      timeMs: i * 43,
    }));
    setCursor({
      recording: { ...selected, samples },
      offsetMs: next === 'Worst case' ? -9007199254740991 : 0,
    });
  };
  return (
    <div style={{ maxWidth: 760, paddingBlock: 24 }}>
      {preview && (
        <Player
          component={Composition}
          inputProps={{
            assets: [asset],
            clips,
            layout: INITIAL_EDIT.layout,
            zooms,
            muted: [],
          }}
          compositionWidth={1280}
          compositionHeight={720}
          durationInFrames={360}
          fps={30}
          controls
          loop
          style={{ width: '100%' }}
        />
      )}
      <AutoZoomControls
        edit={{ ...INITIAL_EDIT, clips, zooms }}
        assets={[asset]}
        onChange={setZooms}
      />
      {zooms.slice(0, 1).map((first) => (
        <ZoomMotionControls
          key={first.id}
          zoom={first}
          onChange={(zoom) => setZooms([zoom, ...zooms.slice(1)])}
        />
      ))}
      <CursorControls key={mode} asset={asset} onChange={setCursor} />
      <div
        role="group"
        aria-label="Cursor stress dataset"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: 22 }}
      >
        {['Demo data', 'Worst case', 'Empty', 'One', 'Idle and shakes'].map((value) => (
          <button
            className="text-button"
            key={value}
            aria-pressed={mode === value}
            onClick={() => choose(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function LibraryRecord({ view, worst = false }: { view: string; worst?: boolean }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [mode, setMode] = useState(
    () => new URLSearchParams(location.search).get('stress') ?? (worst ? 'worst' : 'demo'),
  );
  const [selected, setSelected] = useState('s1');
  const [frame, setFrame] = useState(90);
  const [clips, setClips] = useState(INITIAL_EDIT.clips);
  const [layout, setLayout] = useState(INITIAL_EDIT.layout);
  const [zoom, setZoom] = useState({
    id: 'zoom',
    start: 30,
    duration: 120,
    scale: 1.8,
    x: 50,
    y: 50,
  });
  useEffect(() => {
    let current = true;
    let demo: Asset[] = [];
    void loadDemo().then((result) => {
      demo = result;
      if (current) setAssets(result);
      else result.forEach((a) => URL.revokeObjectURL(a.url));
    });
    return () => {
      current = false;
      demo.forEach((a) => URL.revokeObjectURL(a.url));
    };
  }, []);
  const names = [
    '2026-11-15_Developer_Relations_Platform_Walkthrough_Review_v12_screen_recording_final.mp4',
    '录屏_👩🏽‍💻_开发者演示_最终版本.mp4',
    'X',
    'Quarterly product launch / voiceover / Aleksandra Wiśniewska-Kowalczyk.wav',
  ];
  const difficult = assets.map((a, i) => ({
    ...a,
    name: names[i],
    thumbnail: i === 1 ? '' : a.thumbnail,
    peaks: i === 2 ? [] : a.peaks,
  }));
  const data =
    mode === 'empty'
      ? []
      : mode === 'one'
        ? difficult.slice(0, 1)
        : mode === 'many' && assets.length
          ? Array.from({ length: 1000 }, (_, i) => ({
              ...difficult[i % difficult.length],
              id: `asset-${i}`,
            }))
          : mode === 'worst'
            ? difficult
            : assets;
  const toggle = (
    <div
      role="group"
      aria-label="Stress dataset"
      style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 3,
        padding: 4,
        background: '#424242',
        borderRadius: 6,
        zIndex: 10,
      }}
    >
      {['demo', 'worst', 'empty', 'one', 'many'].map((value, i) => (
        <button
          key={value}
          aria-pressed={mode === value}
          onClick={() => {
            setMode(value);
            const url = new URL(location.href);
            url.searchParams.set('stress', value);
            history.replaceState(null, '', url);
          }}
          style={{
            padding: '7px 9px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            background: mode === value ? '#fff' : 'transparent',
            color: mode === value ? '#111' : '#fff',
            font: '11px system-ui',
          }}
        >
          {['Demo data', 'Worst case', 'Empty', 'One', '1,000'][i]}
        </button>
      ))}
    </div>
  );
  if (view === 'library')
    return (
      <div style={{ width: 240, height: 800 }}>
        {toggle}
        <MediaLibrary
          assets={data}
          selected={selected}
          onSelect={setSelected}
          onImport={() => {}}
          busy={!assets.length && mode !== 'empty'}
        />
      </div>
    );
  if (view === 'source')
    return (
      <div style={{ width: 300, padding: 20 }}>
        <SourceMonitor asset={data[0]} onInsert={() => {}} />
      </div>
    );
  if (view === 'inspector')
    return (
      <div style={{ width: 260 }}>
        <Inspector
          layout={layout}
          onLayout={setLayout}
          zoom={zoom}
          onZoom={setZoom}
          onRemoveZoom={() => {}}
          onAddZoom={() => {}}
          duration={360}
        />
      </div>
    );
  if (view === 'composition')
    return assets.length ? (
      <Player
        component={Composition}
        inputProps={{ ...INITIAL_EDIT, assets, zooms: [zoom], muted: [] }}
        compositionWidth={1280}
        compositionHeight={720}
        durationInFrames={360}
        fps={30}
        controls
        style={{ width: '100%' }}
      />
    ) : (
      <p>Decoding demo media…</p>
    );
  if (view === 'timeline')
    return (
      <div style={{ padding: 20 }}>
        {toggle}
        <Timeline
          clips={clips}
          assets={data}
          zooms={[zoom]}
          frame={frame}
          duration={360}
          selected={selected}
          onSelect={setSelected}
          onSeek={setFrame}
          muted={[]}
          onMute={() => {}}
          onZoomSelect={setSelected}
          onTrim={(clip) =>
            setClips((previous) => previous.map((c) => (c.id === clip.id ? clip : c)))
          }
        />
      </div>
    );
  if (view === 'waveform')
    return (
      <div style={{ width: 640, maxWidth: '100%', padding: 30, color: '#95cbb2' }}>
        <Waveform peaks={assets[2]?.peaks ?? []} progress={0.35} />
      </div>
    );
  return (
    <div style={{ padding: 30, display: 'flex', gap: 15 }}>
      <IconButton label="Play">
        <Play size={16} />
      </IconButton>
      <IconButton label="Split">
        <Scissors size={16} />
      </IconButton>
      <IconButton label="Zoom">
        <ZoomIn size={16} />
      </IconButton>
      <IconButton label="Delete unavailable" disabled>
        <Trash2 size={16} />
      </IconButton>
    </div>
  );
}

const meta = { title: 'Clipper/Shared library', component: LibraryRecord } satisfies Meta<
  typeof LibraryRecord
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const MediaBin: Story = { args: { view: 'library' } };
export const Source: Story = { args: { view: 'source' } };
export const CropAndZoomInspector: Story = { args: { view: 'inspector' } };
export const SideBySideComposition: Story = { args: { view: 'composition' } };
export const MultitrackTimeline: Story = { args: { view: 'timeline' } };
export const DecodedWaveform: Story = { args: { view: 'waveform' } };
export const IconButtons: Story = { args: { view: 'buttons' } };
export const WorstCaseMediaBin: Story = { args: { view: 'library', worst: true } };
export const WorstCaseTimeline: Story = { args: { view: 'timeline', worst: true } };
export const WholeEditor: Story = { args: { view: 'editor' }, render: () => <App /> };
export const MouseCenteredZoom: Story = {
  args: { view: 'editor' },
  render: () => <App />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('4 assets ready', {}, { timeout: 30000 });
    await userEvent.click(canvas.getAllByRole('button', { name: 'Add zoom at playhead' })[0]);
    await userEvent.click(canvas.getByRole('button', { name: 'Mark mouse position' }));
  },
};
export const PortableProjectAndExport: Story = { args: { view: 'editor' }, render: () => <App /> };
export const CursorSidecar: Story = { args: { view: 'cursor' }, render: () => <CursorRecord /> };
export const CursorMotion: Story = {
  args: { view: 'cursor' },
  render: () => <CursorRecord preview />,
};
export const AutomaticZooms: Story = {
  args: { view: 'cursor' },
  render: () => <CursorRecord preview />,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Generate zooms' }));
  },
};
