import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routePrefetchMap: Record<string, () => Promise<any>> = {
  '/': () => import('../pages/HomePage'),
  '/login': () => import('../pages/LoginPage'),
  '/signup': () => import('../pages/SignUpPage'),
  '/profile': () => import('../pages/ProfilePage'),
  // Add other routes as needed
};

export const useRoutePrefetch = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Prefetch the current route immediately
    if (routePrefetchMap[pathname]) {
      routePrefetchMap[pathname]();
    }

    // Prefetch adjacent routes after a short delay
    const timeoutId = setTimeout(() => {
      Object.entries(routePrefetchMap).forEach(([path, prefetchFn]) => {
        if (path !== pathname) {
          prefetchFn();
        }
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [pathname]);
};