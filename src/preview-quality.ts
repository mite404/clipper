/** How much smaller than the output the editor preview is laid out: 1, 2 or 4 times. */
export const PREVIEW_DIVISORS = { full: 1, half: 2, quarter: 4 } as const;
export type PreviewQuality = keyof typeof PREVIEW_DIVISORS;

const KEY = 'clipper.previewQuality';

/** Whether `value` names a preview quality. */
export const isPreviewQuality = (value: unknown): value is PreviewQuality =>
  typeof value === 'string' && Object.hasOwn(PREVIEW_DIVISORS, value);

/** The quality the user last chose on this device; Full when none, or when storage is blocked. */
export function savedPreviewQuality(): PreviewQuality {
  try {
    const saved = localStorage.getItem(KEY);
    return isPreviewQuality(saved) ? saved : 'full';
  } catch {
    return 'full';
  }
}

/** Remember a choice for next time. A blocked store only loses the memory, never the choice. */
export function savePreviewQuality(quality: PreviewQuality): void {
  try {
    localStorage.setItem(KEY, quality);
  } catch {
    // Private browsing or a full quota: the choice still holds for this session.
  }
}
