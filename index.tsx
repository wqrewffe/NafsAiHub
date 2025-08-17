import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Firebase is initialized within firebase/config.ts and is imported by components
// throughout the app. Initializing it here again is redundant and can cause errors.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
