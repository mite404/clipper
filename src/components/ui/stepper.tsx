import { useId } from 'react';
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from '@ui-sdk/react/number-input';

// Adapted from the registry, which shipped an uncontrolled 0-999 stepper with
// Carbon plus and minus icons and a tick on every value change. Here the value
// is controlled, carries its unit, and keeps the accessible names the editor's
// tests rely on. The step buttons keep the skin's key press through
// data-kit="button". Typed and keyboard edits stay silent: they repeat too
// often for feedback.
function Stepper({
  label,
  name,
  unit,
  value,
  onValueChange,
  ...limits
}: {
  label: string;
  name: string;
  unit: 'second' | 'millisecond' | 'percent';
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  largeStep?: number;
}) {
  const id = useId();
  return (
    <div className="number-field">
      <label data-kit="label" htmlFor={id}>
        {label}
      </label>
      <NumberInput
        {...limits}
        value={value}
        format={{ style: 'unit', unit, unitDisplay: 'narrow' }}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
      >
        <NumberInputGroup data-kit="stepper">
          <NumberInputDecrement
            data-kit="button"
            data-tone="secondary"
            aria-label={`Decrease ${label}`}
          >
            −
          </NumberInputDecrement>
          <NumberInputControl
            id={id}
            data-kit="stepper-input"
            role="spinbutton"
            aria-label={name}
            aria-valuenow={value}
            aria-valuemin={limits.min}
            aria-valuemax={limits.max}
          />
          <NumberInputIncrement
            data-kit="button"
            data-tone="secondary"
            aria-label={`Increase ${label}`}
          >
            +
          </NumberInputIncrement>
        </NumberInputGroup>
      </NumberInput>
    </div>
  );
}

export { Stepper };
