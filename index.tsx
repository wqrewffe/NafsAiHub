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
  Object.entries(link).forEach(([key, value]) => linkElement.setAttribute(key, value));
  document.head.appendChild(linkElement);
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove initial loader after first paint
(() => {
  const removeEl = (id: string) => {
    const el = document.getElementById(id);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  };

  // Only remove the static placeholders once the real React navbar mounts.
  // The placeholder also uses `.navbar-glass`, so check for `#app-navbar` which
  // is added by the React Navbar component to avoid removing the placeholder
  // prematurely during initial paint.
  if (document.getElementById('app-navbar')) {
    removeEl('initial-loader');
    removeEl('initial-nav');
    removeEl('initial-root');
    removeEl('initial-footer');
    return;
  }

  const CHECK_INTERVAL = 16;
  const MAX_WAIT = 3000;
  let waited = 0;

  const interval = window.setInterval(() => {
    if (document.getElementById('app-navbar')) {
      removeEl('initial-loader');
      removeEl('initial-nav');
      removeEl('initial-root');
      removeEl('initial-footer');
      clearInterval(interval);
      return;
    }

    waited += CHECK_INTERVAL;
    if (waited >= MAX_WAIT) {
      removeEl('initial-loader');
      clearInterval(interval);
    }
  }, CHECK_INTERVAL);
})();
