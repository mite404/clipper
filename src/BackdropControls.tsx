import { useLayoutEffect, useRef, useState } from 'react';
import { Choice } from './components';
import {
  DEFAULT_FILL,
  DEFAULT_GRADIENT,
  SHADOW_MAX,
  withBackdropStyle,
  withShadow,
  type Layout,
} from './stage';

const GRADIENT_PRESETS = [
  { name: 'aurora', label: 'Aurora', fill: '#123b5a', fillTo: '#53d6b6', angle: 90 },
  { name: 'ember', label: 'Ember', fill: '#4d2547', fillTo: '#f18b5d', angle: 135 },
  { name: 'tidal', label: 'Tidal', fill: '#123d4a', fillTo: '#7bbbd1', angle: 35 },
  { name: 'dusk', label: 'Dusk', fill: '#362c67', fillTo: '#c66b9b', angle: 160 },
] as const;
type GradientPreset = 'custom' | (typeof GRADIENT_PRESETS)[number]['name'];
const GRADIENT_PRESET_OPTIONS: {
  value: GradientPreset;
  label: string;
  disabled?: boolean;
}[] = [
  { value: 'custom', label: 'Custom', disabled: true },
  ...GRADIENT_PRESETS.map(({ name, label }) => ({ value: name, label })),
];

/**
 * A colour field: the browser's picker with its hex beside it. A pick commits once, when the
 * picker applies it or the field loses focus, so dragging through the picker is one undo step.
 */
function ColorField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (color: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [previous, setPrevious] = useState(value);
  if (previous !== value) {
    setPrevious(value);
    setDraft(value);
  }
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef({ value, onCommit });
  useLayoutEffect(() => {
    latest.current = { value, onCommit };
  });
  useLayoutEffect(() => {
    const element = input.current!;
    // Not React's onChange, which reports every colour the picker passes through.
    const apply = () => {
      const { value, onCommit } = latest.current;
      if (element.value !== value) onCommit(element.value);
    };
    element.addEventListener('change', apply);
    return () => element.removeEventListener('change', apply);
  }, []);
  return (
    <label className="backdrop-color">
      {label}
      <span>
        <input
          ref={input}
          type="color"
          aria-label={label}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => draft !== value && onCommit(draft)}
        />
        <output>{draft}</output>
      </span>
    </label>
  );
}

/** A slider with its value beside the label, like Corner radius. */
function Slider({
  label,
  value,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider-label">
      {label}{' '}
      <output>
        {value}
        {unit}
      </output>
      <input
        aria-label={label}
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function GradientPresetField({
  layout,
  onLayout,
}: {
  layout: Layout;
  onLayout: (layout: Layout) => void;
}) {
  const { fillTo, fillAngle = DEFAULT_GRADIENT.angle } = layout;
  const activePreset = GRADIENT_PRESETS.find(
    (preset) =>
      preset.fill === layout.fill && preset.fillTo === fillTo && preset.angle === fillAngle,
  );
  return (
    <label className="slider-label choice-row">
      Gradient preset
      <Choice
        label="Gradient preset"
        value={activePreset?.name ?? 'custom'}
        options={GRADIENT_PRESET_OPTIONS}
        onChange={(name) => {
          const preset = GRADIENT_PRESETS.find((candidate) => candidate.name === name);
          if (preset)
            onLayout({
              ...layout,
              fill: preset.fill,
              fillTo: preset.fillTo,
              fillAngle: preset.angle,
            });
        }}
      />
    </label>
  );
}

// The colours and angle that belong to the current style: one colour, or a gradient's two and angle.
function BackdropColors({
  layout,
  onLayout,
}: {
  layout: Layout;
  onLayout: (layout: Layout) => void;
}) {
  const { fillTo, fillAngle = DEFAULT_GRADIENT.angle } = layout;
  if (fillTo === undefined)
    return (
      <ColorField
        label="Background colour"
        value={layout.fill ?? DEFAULT_FILL}
        onCommit={(color) => onLayout({ ...layout, fill: color })}
      />
    );
  return (
    <>
      <GradientPresetField layout={layout} onLayout={onLayout} />
      <ColorField
        label="Gradient start"
        value={layout.fill ?? DEFAULT_GRADIENT.from}
        onCommit={(color) => onLayout({ ...layout, fill: color })}
      />
      <ColorField
        label="Gradient end"
        value={fillTo}
        onCommit={(color) => onLayout({ ...layout, fillTo: color })}
      />
      <Slider
        label="Gradient angle"
        value={fillAngle}
        max={360}
        unit="°"
        onChange={(angle) => onLayout({ ...layout, fillAngle: angle })}
      />
    </>
  );
}

/** The stage behind the panels: a solid colour or a gradient, and the panels' shadow. */
export function BackdropControls({
  layout,
  onLayout,
}: {
  layout: Layout;
  onLayout: (layout: Layout) => void;
}) {
  return (
    <>
      <label className="slider-label">
        Background
        <Choice
          label="Background style"
          value={layout.fillTo === undefined ? 'solid' : 'gradient'}
          options={[
            { value: 'solid', label: 'Solid colour' },
            { value: 'gradient', label: 'Gradient' },
          ]}
          onChange={(style) => onLayout(withBackdropStyle(layout, style))}
        />
      </label>
      <BackdropColors layout={layout} onLayout={onLayout} />
      <Slider
        label="Panel shadow"
        value={layout.shadow ?? 0}
        max={SHADOW_MAX}
        unit=""
        onChange={(strength) => onLayout(withShadow(layout, strength))}
      />
    </>
  );
}
