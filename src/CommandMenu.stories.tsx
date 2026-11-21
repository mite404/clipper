import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CommandMenu } from './CommandMenu';
import './styles.css';

const actions = [
  { id: 'save', label: 'Save project' },
  { id: 'open', label: 'Open project' },
  { id: 'export', label: 'Export video' },
  { id: 'split', label: 'Split at playhead' },
  { id: 'undo', label: 'Undo', disabled: true },
];

function CommandMenuDemo() {
  const [open, setOpen] = useState(false);
  const [runs, setRuns] = useState<string[]>([]);
  return (
    <main style={{ padding: 24, maxWidth: 380, display: 'grid', gap: 12 }}>
      <h1>Editor actions</h1>
      <p>Try the command menu. Selected actions are recorded here without changing a project.</p>
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        commands={actions.map((action) => ({
          ...action,
          run: () => setRuns((previous) => [...previous, action.label]),
        }))}
      />
      <h2>Actions run</h2>
      <div role="log" aria-label="Actions run">
        {runs.map((name, index) => (
          <p key={index}>{name}</p>
        ))}
      </div>
    </main>
  );
}

const meta = { title: 'UI/CommandMenu', component: CommandMenuDemo } satisfies Meta<
  typeof CommandMenuDemo
>;
export default meta;

/** Search and run sample editor actions without changing a project. */
export const EditorActions: StoryObj<typeof meta> = {};
