import { createRoot } from 'react-dom/client';
import { CircleCheck } from 'lucide-react';
import { Toast, ToastRegion, ToastTitle } from '@ui-sdk/react/toast';
import { App } from './App';

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <>
      <App />
      <ToastRegion side="bottom" align="end" maxVisible={3}>
        {() => (
          <Toast className="toast">
            <CircleCheck size={14} aria-hidden="true" />
            <ToastTitle />
          </Toast>
        )}
      </ToastRegion>
    </>,
  );
