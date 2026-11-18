import { bindDrag } from '@ui-sdk/core';
import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';

// Adapted with the owner's permission from mite404/yaklabs at
// 1ccdae55a5f26e96c042a322f980db9e226b3c41, apps/web/src/shell/sidebar-resize.tsx.
// Keep direct CSS movement; ui-sdk's bindDrag follows the pointer. Cancellation restores.
type Range = { min: number; max: number; value: number };
type Panel = 'left' | 'right' | 'timeline';
type TimelineHeight = { mode: 'default' | 'custom'; remembered: number | null };
const AXES = {
  horizontal: {
    coordinate: 'clientY',
    hint: 'clientX',
    origin: 'left',
    cursor: 'row',
    unit: 'high',
    before: 'ArrowUp',
    after: 'ArrowDown',
  },
  vertical: {
    coordinate: 'clientX',
    hint: 'clientY',
    origin: 'top',
    cursor: 'column',
    unit: 'wide',
    before: 'ArrowLeft',
    after: 'ArrowRight',
  },
} as const;
const PANELS = {
  left: {
    label: 'Resize media pool',
    controls: 'media-drawer',
    orientation: 'vertical',
    direction: 1,
    variable: '--media-width',
  },
  right: {
    label: 'Resize inspector',
    controls: 'inspector-pane',
    orientation: 'vertical',
    direction: -1,
    variable: '--inspector-width',
  },
  timeline: {
    label: 'Resize timeline',
    controls: 'sequence-pane',
    orientation: 'horizontal',
    direction: -1,
    variable: '--timeline-height',
  },
} as const;
type Drag = {
  from: number;
  reached: number;
  handle: HTMLHRElement;
  // Ends bindDrag's gesture without its onEnd.
  stop: () => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function mainPress(event: PointerEvent<HTMLHRElement>) {
  return event.button === 0 && event.isPrimary && !document.documentElement.dataset.panelDrag;
}

function sizeForKey(
  key: string,
  shift: boolean,
  range: Range,
  orientation: keyof typeof AXES,
  direction: number,
) {
  const axis = AXES[orientation];
  const step = shift ? 64 : 16;
  const sizes: Partial<Record<string, number>> = {
    [axis.before]: range.value - direction * step,
    [axis.after]: range.value + direction * step,
    Home: range.min,
    End: range.max,
  };
  return sizes[key];
}

function defaultWidths(viewport: number) {
  if (viewport >= 1650) return { left: 240, right: 264 };
  if (viewport <= 1250) return { left: 185, right: 210 };
  return { left: 220, right: 236 };
}

function timelineHeight(height: TimelineHeight, fallback: number) {
  return height.mode === 'custom' ? (height.remembered ?? fallback) : fallback;
}

/** A captured-pointer splitter. Movement is provisional until release; cancellation restores it. */
export function PanelResizeHandle({
  label,
  controls,
  orientation,
  direction,
  range,
  onPreview,
  onCommit,
  onReset,
  className = '',
  disabled = false,
}: {
  /** Accessible action name. */
  label: string;
  /** ID of the resized panel landmark. */
  controls: string;
  /** Orientation of the divider, not its movement axis. */
  orientation: 'vertical' | 'horizontal';
  /** Whether increasing pointer coordinates enlarge or reduce the panel. */
  direction: 1 | -1;
  /** Effective size and feasible bounds, in CSS pixels. */
  range: Range;
  /** Applies provisional geometry without committing layout state. */
  onPreview: (px: number | null) => void;
  /** Keeps a changed size after release or a keyboard resize. */
  onCommit: (px: number) => void;
  /** Returns to the responsive default without forgetting a custom size. */
  onReset: () => void;
  /** Position within its owner's layout. */
  className?: string;
  /** Disables interaction and cancels any provisional movement. */
  disabled?: boolean;
}) {
  const drag = useRef<Drag | null>(null);
  const [dragging, setDragging] = useState(false);
  const axis = AXES[orientation];
  const finish = (commit: boolean) => {
    const done = drag.current;
    if (!done) return;
    drag.current = null;
    done.stop();
    delete document.documentElement.dataset.panelDrag;
    onPreview(null);
    done.handle.setAttribute('aria-valuenow', String(range.value));
    done.handle.setAttribute('aria-valuetext', `${range.value} pixels ${axis.unit}`);
    setDragging(false);
    if (commit && done.reached !== done.from) onCommit(done.reached);
  };
  const finishRef = useRef(finish);
  useLayoutEffect(() => {
    finishRef.current = finish;
  });
  useLayoutEffect(() => {
    if (disabled) finishRef.current(false);
    const cancel = () => finishRef.current(false);
    window.addEventListener('blur', cancel);
    window.addEventListener('resize', cancel);
    return () => {
      cancel();
      window.removeEventListener('blur', cancel);
      window.removeEventListener('resize', cancel);
    };
  }, [disabled]);
  return (
    <hr
      aria-label={label}
      aria-controls={controls}
      aria-orientation={orientation}
      aria-valuemin={range.min}
      aria-valuemax={range.max}
      aria-valuenow={range.value}
      aria-valuetext={`${range.value} pixels ${axis.unit}`}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      className={`panel-resize ${className}`}
      data-dragging={dragging || undefined}
      onPointerDown={(event) => {
        if (disabled || drag.current || !mainPress(event)) return;
        event.preventDefault();
        event.currentTarget.focus();
        const handle = event.currentTarget;
        const start = event[axis.coordinate];
        const now: Drag = { from: range.value, reached: range.value, handle, stop: () => {} };
        drag.current = now;
        document.documentElement.dataset.panelDrag = axis.cursor;
        setDragging(true);
        now.stop = bindDrag(handle, event.nativeEvent, {
          cancelOnEscape: true,
          onMove: (sample) => {
            if (drag.current !== now) return;
            const at = orientation === 'horizontal' ? sample.y : sample.x;
            now.reached = clamp(
              Math.round(now.from + direction * (at - start)),
              range.min,
              range.max,
            );
            onPreview(now.reached);
            handle.setAttribute('aria-valuenow', String(now.reached));
            handle.setAttribute('aria-valuetext', `${now.reached} pixels ${axis.unit}`);
          },
          onEnd: (_up, canceled) => {
            if (drag.current === now) finish(!canceled);
          },
        });
      }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          '--hint-position',
          `${event[axis.hint] - rect[axis.origin]}px`,
        );
      }}
      // bindDrag ends on pointercancel and Escape, not a lost capture; that restores too. Its stop()
      // releases capture just before onEnd commits, so the check waits for onEnd in case a browser
      // fires lostpointercapture synchronously.
      onLostPointerCapture={() =>
        queueMicrotask(() => {
          if (drag.current) finishRef.current(false);
        })
      }
      onDoubleClick={() => {
        if (!disabled) onReset();
      }}
      onKeyDown={(event) => {
        const target = sizeForKey(event.key, event.shiftKey, range, orientation, direction);
        if (target === undefined || disabled) return;
        event.preventDefault();
        event.stopPropagation();
        finish(false);
        const next = clamp(target, range.min, range.max);
        if (next !== range.value) onCommit(next);
      }}
    />
  );
}

// Widths share one budget: the two side minima plus a 480px editing area always fit together.
function panelRanges(
  width: number,
  height: number,
  pinned: boolean,
  left: number,
  right: number,
  timeline: number,
) {
  const budget = width - 480;
  const leftMax = Math.min(480, Math.floor(width * 0.35), budget - 210);
  const l = clamp(left, 170, leftMax);
  const rightMax = Math.min(480, Math.floor(width * 0.35), budget - (pinned ? l : 0));
  const r = clamp(right, 210, rightMax);
  return {
    left: { min: 170, max: Math.min(leftMax, budget - r), value: Math.min(l, budget - r) },
    right: {
      min: 210,
      max: Math.min(480, Math.floor(width * 0.35), budget - (pinned ? Math.min(l, budget - r) : 0)),
      value: r,
    },
    timeline: {
      min: 320,
      max: Math.max(320, height - 240),
      value: clamp(timeline, 320, Math.max(320, height - 240)),
    },
  };
}

/** Visit-only pane geometry. No project/history state or persistent storage is changed. */
export function usePanelLayout(pinned: boolean, blocked: boolean) {
  const workspace = useRef<HTMLDivElement>(null);
  const preview = useRef<Partial<Record<Panel, number>>>({});
  const [dimensions, setDimensions] = useState({ width: 1440, height: 800, viewport: 1440 });
  const [widths, setWidths] = useState<{ left: number | null; right: number | null }>({
    left: null,
    right: null,
  });
  const [height, setHeight] = useState<TimelineHeight>({ mode: 'default', remembered: null });
  const [open, setOpen] = useState(true);
  const desktop = dimensions.viewport > 960;
  const compact = dimensions.height < 560;
  const defaults = defaultWidths(dimensions.viewport);
  const ranges = panelRanges(
    dimensions.width,
    dimensions.height,
    pinned,
    widths.left ?? defaults.left,
    widths.right ?? defaults.right,
    timelineHeight(height, Math.round(dimensions.height * 0.6)),
  );
  useLayoutEffect(() => {
    const element = workspace.current;
    if (!element) return;
    const editor = element.closest('.editor');
    if (!editor) return;
    const measure = () => {
      const chrome = Array.from(editor.children)
        .filter((child) => child !== element && child.tagName !== 'DIALOG')
        .reduce((sum, child) => sum + child.getBoundingClientRect().height, 0);
      const next = {
        width: element.clientWidth,
        height: window.innerHeight - chrome,
        viewport: window.innerWidth,
      };
      setDimensions((old) =>
        old.width === next.width && old.height === next.height && old.viewport === next.viewport
          ? old
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(editor);
    observer.observe(element);
    for (const child of Array.from(editor.children)) observer.observe(child);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  const apply = (panel: Panel, value: number | null) => {
    const element = workspace.current;
    if (!element) return;
    const px = value ?? preview.current[panel] ?? ranges[panel].value;
    element.style.setProperty(PANELS[panel].variable, `${px}px`);
  };
  useLayoutEffect(() => {
    for (const panel of ['left', 'right', 'timeline'] satisfies Panel[]) {
      if (desktop) apply(panel, null);
      else workspace.current?.style.removeProperty(PANELS[panel].variable);
    }
  });
  const enabled = { left: pinned, right: true, timeline: open && !compact };
  const handle = (panel: Panel) => ({
    label: PANELS[panel].label,
    controls: PANELS[panel].controls,
    orientation: PANELS[panel].orientation,
    direction: PANELS[panel].direction,
    className: `panel-resize-${panel}`,
    range: ranges[panel],
    disabled: blocked || !desktop || !enabled[panel],
    onPreview: (px: number | null) => {
      if (px === null) delete preview.current[panel];
      else preview.current[panel] = px;
      apply(panel, px);
    },
    onCommit: (px: number) =>
      panel === 'timeline'
        ? setHeight({ mode: 'custom', remembered: px })
        : setWidths((old) => ({ ...old, [panel]: px })),
    onReset: () =>
      panel === 'timeline'
        ? setHeight((old) => ({ ...old, mode: 'default' }))
        : setWidths((old) => ({ ...old, [panel]: null })),
  });
  const toggleOpen = () => {
    // Keep geometry measurable while hidden so Timeline's ResizeObserver never sees zero width.
    if (open)
      workspace.current?.style.setProperty(
        '--hidden-timeline-height',
        `${workspace.current.querySelector('#sequence-pane')?.getBoundingClientRect().height ?? ranges.timeline.value}px`,
      );
    setOpen(!open);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>(`[aria-label="${open ? 'Show' : 'Hide'} timeline"]`)
        ?.focus(),
    );
  };
  return {
    workspace,
    open,
    compact,
    handle,
    toggleOpen,
    custom: height.mode === 'custom',
    hasCustom: height.remembered !== null,
    toggleHeight: () =>
      setHeight((old) => ({
        ...old,
        mode: old.mode === 'default' && old.remembered !== null ? 'custom' : 'default',
      })),
  };
}
