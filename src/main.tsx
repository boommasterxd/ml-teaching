/// <reference types="vite/client" />
/**
 * Entry point for the React application. Renders the App component into the root element.
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  console.error('Unhandled promise rejection:', event.reason);
};

window.addEventListener('unhandledrejection', handleUnhandledRejection);

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
