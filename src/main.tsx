import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Recover from stale lazy-chunk loads after a new deploy: if a dynamic import
// fails (old chunk hash no longer on the server), hard-reload once to fetch the
// fresh index.html + chunks. The sessionStorage guard prevents a reload loop.
function recoverFromStaleChunk() {
  if (sessionStorage.getItem('chunk-reloaded')) return;
  sessionStorage.setItem('chunk-reloaded', '1');
  window.location.reload();
}
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  recoverFromStaleChunk();
});
window.addEventListener('error', (e) => {
  const msg = e?.message || '';
  if (/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) {
    recoverFromStaleChunk();
  }
});
// Clear the guard once the app has loaded successfully.
window.addEventListener('load', () => {
  setTimeout(() => sessionStorage.removeItem('chunk-reloaded'), 5000);
});

// Register Service Worker for PWA (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // When a new SW is found, activate it immediately so users get fresh assets.
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            sw.postMessage('SKIP_WAITING');
          }
        });
      });
    }).catch(() => { });

    let refreshed = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return;
      refreshed = true;
      window.location.reload();
    });
  });
}
