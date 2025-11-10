// Preloader for critical resources (avoid preloading HTML itself)
const criticalResources = [
  '/styles.css',
  '/critical.css',
  '/instant.css',
  '/fav.png'
];

// Preload critical resources with correct `as` values and cache-busting
criticalResources.forEach(resource => {
  const link = document.createElement('link');
  link.rel = 'preload';
  if (resource.endsWith('.css')) {
    link.as = 'style';
    // Add cache-busting to CSS files
    link.href = resource + '?v=1.0.2&_t=' + Date.now();
  } else if (resource.match(/\.(png|jpg|jpeg|webp|avif|gif)$/i)) {
    link.as = 'image';
    link.href = resource;
  } else if (resource.endsWith('.js')) {
    link.as = 'script';
    link.href = resource;
  } else {
    link.as = 'fetch';
    link.href = resource;
  }
  document.head.appendChild(link);
});

// Instant page transitions
// Prefetch internal links when the user interacts (hover or touchstart)
const addPrefetch = (href) => {
  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    const prefetchLink = document.createElement('link');
    prefetchLink.rel = 'prefetch';
    prefetchLink.href = url.pathname;
    document.head.appendChild(prefetchLink);
  } catch (e) {
    // ignore malformed urls
  }
};

document.addEventListener('mouseover', e => {
  const a = e.target.closest && e.target.closest('a');
  if (a && a.href) addPrefetch(a.href);
});

document.addEventListener('touchstart', e => {
  const a = e.target.closest && e.target.closest('a');
  if (a && a.href) addPrefetch(a.href);
});