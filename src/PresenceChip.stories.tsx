import type { Meta, StoryObj } from '@storybook/react-vite';
import { PresenceChip } from './components';
import './styles.css';

function ChipRecord({ stress = false }: { stress?: boolean }) {
  return (
    <main style={{ padding: 24, maxWidth: stress ? 240 : 560 }}>
      <h1>Presence chip</h1>
      <p>The connected agent's entry point. Press it to open the session popover.</p>
      <p>
        <PresenceChip
          name={
            stress ? '再生_ClaudeSonnet5.5WithAnUnbrokenVeryLongName_👩🏽‍💻_再生' : 'Claude Sonnet 5.5'
          }
          calls={stress ? 12345 : 2}
          onOpenAssistant={() => {}}
        />
      </p>
    </main>
  );
}

const meta = { title: 'UI/PresenceChip', component: ChipRecord } satisfies Meta<typeof ChipRecord>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The connected agent's chip in the editor's dark theme. */
export const Normal: Story = {};

/** A long multilingual name and a huge count in a narrow container; also inspect at a narrow viewport. */
export const Stress: Story = { args: { stress: true } };
