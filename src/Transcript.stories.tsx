import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { TranscriptPanel } from './components';
import './styles.css';

const segments = [
  {
    start: 0,
    end: 7.74,
    text: 'And so my fellow Americans ask not what your country can do for you',
  },
  { start: 7.74, end: 10.64, text: 'ask what you can do for your country.' },
];
// Worst case: long unbroken words, non-Latin text, emoji and over an hour of segments.
const worst = Array.from({ length: 420 }, (_, i) => ({
  start: i * 9,
  end: i * 9 + 8,
  text:
    i % 3 === 0
      ? 'Supercalifragilisticexpialidocious_NoSpacesAtAllInThisVeryLongTranscribedToken_'.repeat(2)
      : i % 3 === 1
        ? '字幕のテスト 👩🏽‍💻 مرحبا بالعالم — a mixed-script line that wraps across several rows'
        : 'ok',
}));

const meta = {
  title: 'Clipper/Transcript',
  component: TranscriptPanel,
  args: { onTranscribe: fn(), onCancel: fn(), onSeek: fn() },
  decorators: [
    (Story) => (
      <main style={{ width: 260, padding: 16, background: '#17181a' }}>
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof TranscriptPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
export const Running: Story = {
  args: { job: { label: 'Transcribing 2:30 of 6:12', ratio: 0.4 } },
};
export const Done: Story = { args: { transcript: { model: 'whisper', segments } } };
export const NoSpeech: Story = { args: { transcript: { model: 'whisper', segments: [] } } };
export const NoAudio: Story = { args: { unavailable: 'This source has no audio track.' } };
export const WorstCase: Story = { args: { transcript: { model: 'whisper', segments: worst } } };
