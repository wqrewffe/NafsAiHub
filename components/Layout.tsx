import React, { ReactNode, Suspense, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UltraFastLoader } from './UltraFastLoader';
import { useRoutePrefetch } from '../hooks/useRoutePrefetch';
import { ScrollToTop } from './ScrollToTop';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = memo(({ children }) => {
  // Prefetch routes early for smoother transitions
  useRoutePrefetch();
  const location = useLocation();

  // Handle scroll reveal animations - reset and re-initialize on route change
  useEffect(() => {
    // Reset all scroll-reveal elements when route changes
    const resetScrollReveals = () => {
      const allRevealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger, .stagger-item');
      allRevealElements.forEach(el => {
        el.classList.remove('visible');
        // Force opacity to 0 to ensure reset
        (el as HTMLElement).style.opacity = '0';
      });
    };

    // Reset immediately when route changes
    resetScrollReveals();

    // Check if mobile device (simple check)
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // On mobile, show everything immediately to avoid scroll jank
      const allRevealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger, .stagger-item');
      allRevealElements.forEach(el => {
        el.classList.add('visible');
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'none';
        (el as HTMLElement).style.animation = 'none';
        (el as HTMLElement).style.transition = 'none';
      });
      return; // Exit early, no observer needed
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Remove inline style to allow CSS to take over
            (entry.target as HTMLElement).style.opacity = '';
            // For stagger containers, also trigger child animations
            if (entry.target.classList.contains('scroll-reveal-stagger')) {
              const children = entry.target.children;
              Array.from(children).forEach((child, index) => {
                setTimeout(() => {
                  child.classList.add('visible');
                  (child as HTMLElement).style.opacity = '';
                  // Also handle nested stagger items
                  if (child.classList.contains('stagger-item')) {
                    (child as HTMLElement).style.opacity = '';
                  }
                }, index * 50);
              });
            }

            // Also handle stagger items that are direct children of visible scroll-reveal containers
            if (entry.target.classList.contains('scroll-reveal')) {
              const staggerContainers = entry.target.querySelectorAll('.scroll-reveal-stagger');
              staggerContainers.forEach(container => {
                if (container.getBoundingClientRect().top < window.innerHeight + 200) {
                  container.classList.add('visible');
                  (container as HTMLElement).style.opacity = '';
                  const staggerItems = container.querySelectorAll('.stagger-item');
                  staggerItems.forEach((item, idx) => {
                    setTimeout(() => {
                      item.classList.add('visible');
                      (item as HTMLElement).style.opacity = '';
                    }, idx * 50);
                  });
                }
              });
            }
          }
        });
      },
      {
        threshold: 0.01, // Lower threshold to catch more elements
        rootMargin: '100px' // Larger margin to catch elements earlier
      }
    );

    // Check if elements are already in viewport and show them immediately
    const checkInitialVisibility = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;

      // Check if element is in viewport (with generous margins)
      const isVisible =
        rect.top < windowHeight + 100 &&
        rect.bottom > -100 &&
        rect.left < windowWidth + 100 &&
        rect.right > -100;

      if (isVisible) {
        element.classList.add('visible');
        (element as HTMLElement).style.opacity = '';

        // For stagger containers, also trigger child animations
        if (element.classList.contains('scroll-reveal-stagger')) {
          const children = element.children;
          Array.from(children).forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('visible');
              (child as HTMLElement).style.opacity = '';
              // Also handle nested stagger items
              if (child.classList.contains('stagger-item')) {
                (child as HTMLElement).style.opacity = '';
              }
            }, index * 50);
          });
        }

        // Also handle scroll-reveal containers that have nested stagger containers
        if (element.classList.contains('scroll-reveal')) {
          const staggerContainers = element.querySelectorAll('.scroll-reveal-stagger');
          staggerContainers.forEach(container => {
            const containerRect = container.getBoundingClientRect();
            if (containerRect.top < windowHeight + 200 && containerRect.bottom > -100) {
              container.classList.add('visible');
              (container as HTMLElement).style.opacity = '';
              const staggerItems = container.querySelectorAll('.stagger-item');
              staggerItems.forEach((item, idx) => {
                setTimeout(() => {
                  item.classList.add('visible');
                  (item as HTMLElement).style.opacity = '';
                }, idx * 50);
              });
            }
          });
        }

        return true;
      }
      return false;
    };

    // Observe all scroll-reveal elements
    const observeElements = () => {
      // First, reset all elements to ensure clean state
      resetScrollReveals();

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Observe container elements
        const containers = document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger');
        containers.forEach(el => {
          // Check initial visibility first - if already visible, don't observe
          if (!checkInitialVisibility(el)) {
            // Unobserve first to avoid duplicates, then observe
            observer.unobserve(el);
            observer.observe(el);
          }
        });

        // Also observe individual stagger items that might be standalone
        // But also observe nested stagger items inside scroll-reveal-stagger containers
        const staggerItems = document.querySelectorAll('.stagger-item');
        staggerItems.forEach(el => {
          // Check if it's inside a scroll-reveal-stagger container
          const parentStagger = el.closest('.scroll-reveal-stagger');
          if (parentStagger) {
            // If parent is visible, show this item
            if (parentStagger.classList.contains('visible')) {
              el.classList.add('visible');
              (el as HTMLElement).style.opacity = '';
            } else if (!checkInitialVisibility(el)) {
              // Only observe if parent isn't visible yet
              observer.unobserve(el);
              observer.observe(el);
            }
          } else {
            // Standalone stagger item
            if (!checkInitialVisibility(el)) {
              observer.unobserve(el);
              observer.observe(el);
            }
          }
        });
      });
    };

    // Initial observation with multiple delays to catch all elements
    // Use requestAnimationFrame for the first check
    requestAnimationFrame(() => {
      observeElements();
    });

    const timeoutId = setTimeout(observeElements, 100);
    const timeoutId2 = setTimeout(observeElements, 300);
    const timeoutId3 = setTimeout(observeElements, 600);
    const timeoutId4 = setTimeout(observeElements, 1000); // Final check for any late-loading elements

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      clearTimeout(timeoutId4);
      const elements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-stagger, .stagger-item');
      elements.forEach(el => {
        observer.unobserve(el);
        // Clean up inline styles
        (el as HTMLElement).style.opacity = '';
      });
      observer.disconnect();
    };
  }, [location.pathname]); // Re-run when route changes

  return (
    <div className="relative flex-grow">
      <ScrollToTop />
      {/* Main content container — Navbar & Footer are rendered at the app root so
          this component focuses only on children and suspense fallbacks. */}
      <main
        id="main-content"
        className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{ paddingTop: '6rem' }}
      >
        {/* Suspense ensures fallback during lazy loading - use minimal fallback */}
        <Suspense
          fallback={null}
        >
          <div className="content-stable force-gpu page-transition-enter-active">
            {children}
          </div>
        </Suspense>
      </main>
    </div>
  );
});

Layout.displayName = 'Layout';

// 🔧 Small helper component for social icons
const SocialIcon = ({
  href,
  label,
}: {
  href: string;
  label: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-light/70 hover:text-accent transition-colors"
    aria-label={label}
  >
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Z" />
    </svg>
  </a>
);

// 🔧 Footer links generator
const FooterLinks = ({
  title,
  links,
}: {
  title: string;
  links: { to?: string; href?: string; label: string }[];
}) => (
  <div>
    <h4 className="text-md font-semibold mb-4">{title}</h4>
    <ul className="space-y-2">
      {links.map(({ to, href, label }) =>
        to ? (
          <li key={label}>
            <Link to={to} className="text-light/80 hover:text-accent">
              {label}
            </Link>
          </li>
        ) : (
          <li key={label}>
            <a href={href} className="text-light/80 hover:text-accent">
              {label}
            </a>
          </li>
        )
      )}
    </ul>
  </div>
);

export default Layout;
