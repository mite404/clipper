import { crosses, haptic } from '@/lib/haptics';
import { Field, FieldLabel } from '@ui-sdk/react/field';
import {
  Slider as SdkSlider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from '@ui-sdk/react/slider';

// Adapted from the registry: the value is always controlled and the range always given, which
// removes the registry's uncontrolled fallbacks. `display` replaces the printed value to carry
// its unit.
function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onValueChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: string;
  onValueChange: (value: number) => void;
}) {
  // A tick each time the thumb passes a twentieth of the range.
  const change = (next: number) => {
    if (crosses(value - min, next - min, (max - min) / 20)) haptic('selection');
    onValueChange(next);
  };
  return (
    <Field data-kit="field">
      <SdkSlider
        data-kit="slider"
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => change(next as number)}
      >
        <div data-kit="row">
          <FieldLabel data-kit="label">{label}</FieldLabel>
          <SliderValue data-kit="value">{display}</SliderValue>
        </div>
        <SliderControl data-kit="slider-control">
          <span data-kit="slider-scale" aria-hidden />
          <SliderTrack data-kit="slider-track">
            <SliderIndicator data-kit="slider-indicator" />
            <SliderThumb data-kit="slider-thumb" />
          </SliderTrack>
        </SliderControl>
      </SdkSlider>
    </Field>
  );
}

export { Slider };
