import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ClipperHardware } from './ClipperHardware';

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <ClipperHardware>
      <App />
    </ClipperHardware>,
  );
