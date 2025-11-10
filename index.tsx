import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Cleanup function to remove broken localStorage entries from previous broken deployments
const cleanupBrokenLocalStorage = () => {
  try {
    const allKeys = Object.keys(localStorage);
    
    // Only remove keys that are clearly broken (source file references from the 404 errors)
    // Be conservative - only remove keys that are definitely problematic
    allKeys.forEach(key => {
      // Remove keys that are exact matches to the broken source file paths
      if (key === '/App.tsx' || key === '/components/Layout.tsx' || key === '/hooks/useAuth.tsx' ||
          key.includes('/App.tsx') || key.includes('/components/Layout.tsx') || key.includes('/hooks/useAuth.tsx')) {
        console.log('Removing broken localStorage key:', key);
        localStorage.removeItem(key);
        return;
      }
      
      // Remove keys that look like they're trying to cache source file paths
      // But be very specific to avoid removing valid data
      if ((key.startsWith('/') && (key.endsWith('.tsx') || key.endsWith('.ts'))) ||
          (key.includes('/App.tsx') || key.includes('/components/Layout.tsx') || key.includes('/hooks/useAuth.tsx'))) {
        console.log('Removing broken localStorage key:', key);
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error during localStorage cleanup:', error);
  }
};

// Run cleanup before React initializes
cleanupBrokenLocalStorage();

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
