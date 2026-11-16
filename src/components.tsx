import { useId, useMemo, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown, Film, Music2, Plus, Upload } from 'lucide-react';
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from '@ui-sdk/react/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIcon,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue,
  SelectValueIcon,
} from '@ui-sdk/react/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui-sdk/react/tooltip';
import type { Asset } from './media';
import { FPS } from './timeline-model';

/** Format a composition frame as minutes, seconds, and frames at 30fps. */
export function timecode(frame: number): string {
  return [Math.floor(frame / FPS / 60), Math.floor(frame / FPS) % 60, Math.floor(frame) % FPS]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

/** Native icon button with the same label visible on hover and keyboard focus. */
export function IconButton({
  label,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip type="label" delay={400} disabled={props.disabled}>
      <TooltipTrigger
        type="button"
        className="icon-button"
        aria-label={label}
        {...props}
        title={undefined}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className="icon-button-tooltip" sideOffset={8} collisionPadding={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/** One choice in a SelectField; the icon previews it beside its name without joining the name. */
export type SelectOption<T extends string> = { value: T; label: string; icon?: ReactNode };

/**
 * ui-sdk Select named by `label`, for a short fixed list of choices. Its popup renders in place,
 * so never wrap it in a `<label>`: a click on an option would bubble up and reopen the trigger.
 * `caption` is visible text only: the trigger keeps `label` as its name, which ui-sdk's
 * SelectLabel would replace through aria-labelledby.
 */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onValueChange,
  caption,
}: {
  label: string;
  caption?: string;
  value: T;
  options: readonly SelectOption<T>[];
  onValueChange: (value: T) => void;
}) {
  return (
    <div className="select-field">
      <Select
        value={value}
        items={options.map(({ value, label }) => ({ value, label }))}
        onValueChange={(next) => {
          const chosen = options.find((option) => option.value === next);
          if (chosen) onValueChange(chosen.value);
        }}
      >
        {caption && <span aria-hidden="true">{caption}</span>}
        <SelectTrigger className="select-trigger" aria-label={label}>
          <SelectValueIcon />
          <SelectValue />
          <ChevronDown size={13} aria-hidden="true" />
        </SelectTrigger>
        <SelectContent className="select-popup" sideOffset={4} collisionPadding={8}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="select-item">
              {option.icon && <SelectItemIcon>{option.icon}</SelectItemIcon>}
              {option.label}
              <SelectItemIndicator className="select-item-check">✓</SelectItemIndicator>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Labelled number field with its unit inside the value and step buttons beside it. */
export function NumberField({
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
      <label htmlFor={id}>{label}</label>
      <NumberInput
        {...limits}
        value={value}
        format={{ style: 'unit', unit, unitDisplay: 'narrow' }}
        onValueChange={(next) => {
          if (next !== null) onValueChange(next);
        }}
      >
        <NumberInputGroup>
          <NumberInputDecrement aria-label={`Decrease ${label}`}>−</NumberInputDecrement>
          <NumberInputControl
            id={id}
            role="spinbutton"
            aria-label={name}
            aria-valuenow={value}
            aria-valuemin={limits.min}
            aria-valuemax={limits.max}
          />
          <NumberInputIncrement aria-label={`Increase ${label}`}>+</NumberInputIncrement>
        </NumberInputGroup>
      </NumberInput>
    </div>
  );
}

/** Decoded waveform with the played region highlighted by the current timeline position. */
export function Waveform({
  peaks,
  progress = 0,
  offset = 0,
  duration = peaks.length,
}: {
  peaks: number[];
  progress?: number;
  offset?: number;
  duration?: number;
}) {
  const bars = useMemo(() => {
    const maximum = peaks.reduce((max, peak) => Math.max(max, peak), 0.01);
    return Array.from({ length: 120 }, (_, index) => {
      const from = Math.floor(offset + (index / 120) * duration);
      const to = Math.max(from + 1, Math.floor(offset + ((index + 1) / 120) * duration));
      const peak = peaks.slice(from, to).reduce((max, value) => Math.max(max, value), 0);
      const amplitude = Math.max(0.5, (peak / maximum) * 21);
      return `M${index * 4 + 2},${24 - amplitude}v${amplitude * 2}`;
    }).join(' ');
  }, [peaks, offset, duration]);
  return (
    <svg
      data-waveform="true"
      viewBox="0 0 480 48"
      preserveAspectRatio="none"
      aria-label="Decoded audio waveform"
    >
      <path d={bars} fill="none" stroke="currentColor" strokeWidth="2" opacity=".5" />
      <svg width={`${Math.max(0, Math.min(1, progress)) * 100}%`} overflow="hidden">
        <path d={bars} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </svg>
  );
}

/** Media library with local-file import and source selection. */
export function MediaLibrary({
  assets,
  selected,
  onSelect,
  onImport,
  busy,
}: {
  assets: Asset[];
  selected: string;
  onSelect: (id: string) => void;
  onImport: (files: FileList) => void;
  busy: boolean;
}) {
  return (
    <aside className="library">
      <div className="section-title">
        <span>Project media</span>
        <span className="count">{assets.length}</span>
      </div>
      <label className="import-button">
        <Upload size={15} /> Import media
        <input
          aria-label="Import local media"
          type="file"
          multiple
          accept="video/*,audio/*"
          disabled={busy}
          onChange={(event) => {
            if (event.target.files) onImport(event.target.files);
            event.target.value = '';
          }}
        />
        <span>↗</span>
      </label>
      <div className="library-note">Files stay on your device</div>
      <div className="asset-list">
        {assets.map((asset, index) => (
          <button
            key={asset.id}
            className={`asset ${selected === asset.id ? 'selected' : ''}`}
            aria-label={`Select ${asset.name}`}
            aria-pressed={selected === asset.id}
            onClick={() => onSelect(asset.id)}
          >
            <div className={`asset-image asset-image-${asset.kind}`}>
              {asset.kind === 'video' ? (
                asset.thumbnail ? (
                  <img src={asset.thumbnail} alt="" />
                ) : (
                  <Film size={28} role="img" aria-label="Video preview unavailable" />
                )
              ) : (
                <Waveform peaks={asset.peaks} />
              )}
              <span className="asset-duration">{timecode(asset.duration).slice(0, 5)}</span>
              <span className="asset-number">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="asset-name">
              {asset.kind === 'video' ? <Film size={13} /> : <Music2 size={13} />}
              <span title={asset.name}>{asset.name}</span>
              <Plus size={13} />
            </div>
            <div className="asset-meta">
              {asset.kind === 'video'
                ? `${asset.width} × ${asset.height} · Video`
                : 'Audio · decoded waveform'}
            </div>
          </button>
        ))}
      </div>
      <div className="library-footer">
        <span className="status-dot" />{' '}
        <span data-testid="media-status">
          {busy
            ? 'Processing media…'
            : `${assets.length} ${assets.length === 1 ? 'asset' : 'assets'} ready`}
        </span>
        <a href="/media/ATTRIBUTION.md" target="_blank" rel="noreferrer">
          Credits ↗
        </a>
      </div>
    </aside>
  );
}
