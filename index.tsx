import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");

// Remove skeleton immediately when React starts mounting
const removeEl = (selector: string) => {
  const el = document.querySelector(selector);
  if (el && el.parentNode) el.parentNode.removeChild(el);
};

// Hide skeleton immediately - React will render content
const hideSkeleton = () => {
  const skeleton = document.querySelector('.initial-root');
  if (skeleton) {
    (skeleton as HTMLElement).style.display = 'none';
  }
};

// Hide skeleton immediately
hideSkeleton();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove skeleton elements once React has mounted
(() => {
  const removeElById = (id: string) => {
    const el = document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  };

  // Check immediately and then periodically
  const checkAndRemove = () => {
    if (document.getElementById('app-navbar') || document.getElementById('root')?.children.length > 0) {
      removeElById('initial-loader');
      removeEl('.initial-root');
      removeElById('initial-nav');
      removeElById('initial-footer');
      // Ensure the real footer remains in the document flow after React mounts
      const realFooter = document.querySelector('footer:not(#initial-footer)') as HTMLElement | null;
      if (realFooter) {
        try { realFooter.style.position = 'static'; realFooter.style.zIndex = 'auto'; } catch (e) { /* ignore */ }
      }
      return true;
    }
    return false;
  };

  // Try immediately
  if (checkAndRemove()) return;

  // Check periodically with shorter interval
  const CHECK_INTERVAL = 16;
  const MAX_WAIT = 1000; // Reduced from 3000ms
  let waited = 0;

  const interval = window.setInterval(() => {
    if (checkAndRemove()) {
      clearInterval(interval);
      return;
    }

    waited += CHECK_INTERVAL;
    if (waited >= MAX_WAIT) {
      // Force remove after timeout
      removeElById('initial-loader');
      removeEl('.initial-root');
      removeElById('initial-nav');
      removeElById('initial-footer');
      
      const realFooter = document.querySelector('footer:not(#initial-footer)') as HTMLElement | null;
      if (realFooter) {
        try { realFooter.style.position = 'static'; realFooter.style.zIndex = 'auto'; } catch (e) { }
      }
      clearInterval(interval);
    }
  }, CHECK_INTERVAL);
})();
