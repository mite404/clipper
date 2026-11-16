import { useLayoutEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PanelResizeHandle } from './PanelResizeHandle';
import './styles.css';

function ResizeRecord({ horizontal = false }: { horizontal?: boolean }) {
  const surface = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(240);
  const axis = horizontal
    ? ({
        variable: '--timeline-height',
        name: 'Timeline',
        width: '100%',
        height: 'var(--timeline-height)',
        orientation: 'horizontal',
        direction: -1,
        max: 360,
        className: 'panel-resize-timeline',
      } as const)
    : ({
        variable: '--media-width',
        name: 'Side panel',
        width: 'var(--media-width)',
        height: '100%',
        orientation: 'vertical',
        direction: 1,
        max: 480,
        className: 'panel-resize-left',
      } as const);
  const variable = axis.variable;
  useLayoutEffect(() => {
    surface.current?.style.setProperty(variable, `${size}px`);
    if (!horizontal) surface.current?.style.setProperty('--timeline-height', '0px');
  }, [size, horizontal, variable]);
  return (
    <main style={{ padding: 24 }}>
      <h1>{axis.name} divider</h1>
      <p>Drag, arrows, Shift + arrows, Home/End. Escape cancels. Double-click resets.</p>
      <div
        ref={surface}
        style={{
          position: 'relative',
          height: 440,
          width: 800,
          maxWidth: '100%',
          background: '#141711',
          border: '1px solid #ffffff20',
        }}
      >
        <section
          id="resized-panel"
          aria-label="Resizable panel"
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: axis.width,
            height: axis.height,
            padding: 16,
            background: '#252729',
            overflow: 'auto',
          }}
        >
          <p>Committed {size}px</p>
          <button className="secondary-button" onClick={() => setSize(240)}>
            Reset panel
          </button>
        </section>
        <PanelResizeHandle
          label="Resize demonstration panel"
          controls="resized-panel"
          orientation={axis.orientation}
          direction={axis.direction}
          range={{ min: 170, max: axis.max, value: size }}
          className={axis.className}
          onPreview={(px) => surface.current?.style.setProperty(variable, `${px ?? size}px`)}
          onCommit={setSize}
          onReset={() => setSize(240)}
        />
      </div>
    </main>
  );
}

const meta = { title: 'UI/PanelResizeHandle', component: ResizeRecord } satisfies Meta<
  typeof ResizeRecord
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SidePanel: Story = {};
export const TimelinePanel: Story = { args: { horizontal: true } };
