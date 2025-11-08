import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Preload critical resources
const preloadLinks = [
  { rel: 'modulepreload', href: '/App.tsx' },
  { rel: 'modulepreload', href: '/components/Layout.tsx' },
  { rel: 'modulepreload', href: '/hooks/useAuth.tsx' }
];

preloadLinks.forEach(link => {
  const linkElement = document.createElement('link');
  Object.entries(link).forEach(([key, value]) => {
    linkElement.setAttribute(key, value);
  });
  document.head.appendChild(linkElement);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
// Use createRoot for concurrent features
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the initial loader DOM node once React has mounted and painted.
// Use requestAnimationFrame to ensure the first paint has a chance to occur
// so the removal doesn't cause a flash.
// Remove the initial loader DOM node once React has mounted and painted.
// Keep the static navbar placeholder until the real navbar component
// (which uses the `.navbar-glass` class) appears in the DOM. This avoids
// removing the placeholder too early and prevents a brief disappearance.
(() => {
  const removeEl = (id: string) => {
    const el = document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  };

  // If the real navbar is already present, remove both immediately.
  if (document.querySelector('.navbar-glass')) {
    removeEl('initial-loader');
    removeEl('initial-nav');
    return;
  }

  // Poll for the real navbar; once found, remove both placeholders.
  const CHECK_INTERVAL = 16; // ms
  const MAX_WAIT = 3000; // ms, fallback
  let waited = 0;

  const interval = window.setInterval(() => {
    if (document.querySelector('.navbar-glass')) {
      removeEl('initial-loader');
      removeEl('initial-nav');
      clearInterval(interval);
      return;
    }

    waited += CHECK_INTERVAL;
    // After MAX_WAIT we remove only the loader so the user can interact with the
    // app; keep the placeholder nav visible to avoid blank header.
    if (waited >= MAX_WAIT) {
      removeEl('initial-loader');
      clearInterval(interval);
    }
  }, CHECK_INTERVAL);
})();
