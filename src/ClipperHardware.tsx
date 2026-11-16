import type { ReactNode } from 'react';
import { Hardware } from '@/components/ui/hardware';

// The skin's root rule sets inherited text paint (font, colour, engraved text shadow, thin
// scrollbars) meant for a light panel. Clipper keeps its own; controls set their own panel.
const INHERIT_APP_PAINT = {
  font: 'inherit',
  color: 'inherit',
  background: 'none',
  textShadow: 'none',
  scrollbarWidth: 'auto',
  scrollbarColor: 'auto',
} as const;

/** The Hardware skin root for the editor and its stories, keyed to Clipper's lime accent. */
export function ClipperHardware({ children }: { children: ReactNode }) {
  return (
    <Hardware keyColor={{ l: 0.9, c: 0.17, h: 118 }} style={INHERIT_APP_PAINT}>
      {children}
    </Hardware>
  );
}
