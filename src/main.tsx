/// <reference types="vite/client" />
/**
 * main.tsx
 *
 * Application entry point. Mounts the React app into the DOM root element,
 * registers global error handlers, and sets up keyboard-navigation detection
 * for accessible focus management.
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

/**
 * Logs unhandled promise rejections to the console.
 *
 * Registered as a global `unhandledrejection` listener and removed during
 * Vite HMR module disposal to avoid duplicate handlers on hot reload.
 *
 * Design decision: Unhandled rejections are logged but not surfaced to the
 * user. All async operations in the app have dedicated error handling via
 * useAppError/onError callbacks. This global handler serves only as a safety
 * net for unexpected rejections that bypass the normal error flow.
 *
 * @param event - The unhandled rejection event containing the rejection reason.
 */
const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason);
};

window.addEventListener('unhandledrejection', handleUnhandledRejection);

// Track whether the user is navigating by keyboard so focus traps can
// conditionally auto-focus the first interactive element (see useFocusTrap).
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    document.documentElement.setAttribute('data-keyboard-nav', '');
  }
});
document.addEventListener('pointerdown', () => {
  document.documentElement.removeAttribute('data-keyboard-nav');
});

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  });
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
