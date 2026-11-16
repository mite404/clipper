import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Play, SkipForward, Trash2 } from 'lucide-react';
import { IconButton } from './components';
import './styles.css';

function ButtonRecord({ stress = false }: { stress?: boolean }) {
  const [presses, setPresses] = useState(0);
  const [submits, setSubmits] = useState(0);
  const label = stress
    ? '播放_👩🏽‍💻_ReviewRecordingWithAnUnbrokenVeryLongControlName_再生'.repeat(3)
    : 'Play';
  return (
    <main style={{ padding: 24, maxWidth: stress ? 240 : 560 }}>
      <h1>Icon button</h1>
      <p>Hover or Tab to read labels. Escape dismisses without moving focus.</p>
      <form
        style={{ paddingTop: stress ? 160 : 48 }}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmits((count) => count + 1);
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton label={label} onClick={() => setPresses((count) => count + 1)}>
            <Play size={16} aria-hidden="true" />
          </IconButton>
          <IconButton label="Next frame" onClick={() => setPresses((count) => count + 1)}>
            <SkipForward size={16} aria-hidden="true" />
          </IconButton>
          <IconButton label="Delete unavailable" disabled>
            <Trash2 size={16} aria-hidden="true" />
          </IconButton>
        </div>
      </form>
      <p role="status" style={{ marginTop: 24 }}>
        {presses} presses, {submits} submits
      </p>
    </main>
  );
}

const meta = { title: 'UI/IconButton', component: ButtonRecord } satisfies Meta<
  typeof ButtonRecord
>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Enabled neighbors and a natively disabled control in the editor's dark theme. */
export const Normal: Story = {};

/** Long multilingual label in a narrow container; also inspect at a narrow viewport. */
export const Stress: Story = { args: { stress: true } };
