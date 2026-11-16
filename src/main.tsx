import { createRoot } from 'react-dom/client';
import { Hardware } from '@/components/ui/hardware';
import { App } from './App';

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

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <Hardware keyColor={{ l: 0.9, c: 0.17, h: 118 }} style={INHERIT_APP_PAINT}>
      <App />
    </Hardware>,
  );
