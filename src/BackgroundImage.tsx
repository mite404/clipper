import { useId } from 'react';
import { Image } from 'lucide-react';
import type { Asset } from './media';
import type { BackgroundImage as Current } from './timeline-model';

const ACCEPT = '.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp';

// What the row says is there when it is not an image: nothing, or that the timeline owns the track.
const OTHER = { none: 'None', busy: 'Background track in use' };

// The image's name, or what stands in for one.
const currentName = (current: Current, asset?: Asset): string =>
  current.kind === 'image' ? (asset?.name ?? 'Image') : OTHER[current.kind];

// The file chooser, drawn as a button. The input itself is disabled, since aria-disabled on its
// label would not stop the chooser from opening.
function PickFile({
  verb,
  disabled,
  describedBy,
  onChoose,
}: {
  verb: 'Choose' | 'Replace';
  disabled: boolean;
  describedBy: string;
  onChoose: (file: File) => void;
}) {
  return (
    <label className="text-button" aria-disabled={disabled}>
      {verb}
      <input
        type="file"
        aria-label={`${verb} background image`}
        aria-describedby={describedBy}
        accept={ACCEPT}
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onChoose(file);
        }}
      />
    </label>
  );
}

/**
 * The composition's background image: Choose one, Replace it, or Remove it. A Background track
 * holding a video or several clips is the timeline's, so the control stands aside and says so.
 */
export function BackgroundImageControl({
  current,
  asset,
  busy,
  onChoose,
  onRemove,
}: {
  current: Current;
  /** The asset of the current image, for its name. */
  asset?: Asset;
  busy: boolean;
  /** A picked file; the caller reads it and swaps the background only once it decodes. */
  onChoose: (file: File) => void;
  onRemove: () => void;
}) {
  const id = useId();
  return (
    <div className="backdrop-image" role="group" aria-label="Background image">
      <span className="backdrop-image-name" id={`${id}-name`}>
        <Image size={12} aria-hidden="true" /> {currentName(current, asset)}
      </span>
      <span className="backdrop-image-actions">
        <PickFile
          verb={current.kind === 'image' ? 'Replace' : 'Choose'}
          disabled={busy || current.kind === 'busy'}
          describedBy={`${id}-name`}
          onChoose={onChoose}
        />
        <button
          type="button"
          className="text-button"
          disabled={current.kind !== 'image'}
          onClick={onRemove}
        >
          Remove
        </button>
      </span>
    </div>
  );
}
