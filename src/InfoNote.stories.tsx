import type { Meta, StoryObj } from '@storybook/react-vite';
import { InfoNote } from './components';
import './styles.css';

const NOTE = 'None steps at recorded sample times. Raw motion still interpolates between them.';

function NoteRecord({ stress = false }: { stress?: boolean }) {
  return (
    <main style={{ padding: 24, maxWidth: stress ? 240 : 560 }}>
      <h1>Info note</h1>
      <p>Press the info button to open or close its note. Escape or an outside press closes it.</p>
      <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        Animation
        <InfoNote label="About cursor animation">
          {stress
            ? '再生_NoneStepsAtRecordedSampleTimes_👩🏽‍💻_RawMotionStillInterpolatesBetweenThemWithAnUnbrokenVeryLongWord_再生'.repeat(
                2,
              )
            : NOTE}
        </InfoNote>
      </p>
    </main>
  );
}

const meta = { title: 'UI/InfoNote', component: NoteRecord } satisfies Meta<typeof NoteRecord>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The toggleable info button in the editor's dark theme. */
export const Normal: Story = {};

/** A long multilingual note in a narrow container; also inspect at a narrow viewport. */
export const Stress: Story = { args: { stress: true } };
