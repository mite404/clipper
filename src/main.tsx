import { createRoot } from 'react-dom/client';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { Toast, ToastClose, ToastRegion, ToastTitle } from '@ui-sdk/react/toast';
import { App } from './App';

const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <>
      <App />
      <ToastRegion side="bottom" align="end" maxVisible={3}>
        {({ type }) => (
          <Toast className="toast">
            {type === 'error' ? (
              <CircleAlert size={14} aria-hidden="true" />
            ) : (
              <CircleCheck size={14} aria-hidden="true" />
            )}
            <ToastTitle />
            {/* Errors stay until dismissed, so they need a way out besides Escape and swipe. */}
            {type === 'error' && (
              <ToastClose className="toast-close" aria-label="Dismiss">
                <X size={14} aria-hidden="true" />
              </ToastClose>
            )}
          </Toast>
        )}
      </ToastRegion>
    </>,
  );
