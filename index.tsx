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
