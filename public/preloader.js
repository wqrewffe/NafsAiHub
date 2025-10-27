// Preloader for critical resources
const criticalResources = [
  '/index.html',
  '/styles.css',
  '/critical.css',
  '/instant.css',
  '/og-image.png'
];

// Preload critical resources
criticalResources.forEach(resource => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = resource.endsWith('.css') ? 'style' : 
            resource.endsWith('.png') ? 'image' : 
            'fetch';
  link.href = resource;
  document.head.appendChild(link);
});

// Instant page transitions
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (link && link.href && link.href.startsWith(window.location.origin)) {
    const url = new URL(link.href);
    // Prefetch on hover/touch
    const prefetchLink = document.createElement('link');
    prefetchLink.rel = 'prefetch';
    prefetchLink.href = url.pathname;
    document.head.appendChild(prefetchLink);
  }
});