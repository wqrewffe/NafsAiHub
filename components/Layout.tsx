import React, { ReactNode, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { UltraFastLoader } from './UltraFastLoader';
import { useRoutePrefetch } from '../hooks/useRoutePrefetch';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Prefetch routes early for smoother transitions
  useRoutePrefetch();

  return (
    <div className="relative flex-grow">
      {/* Main content container — Navbar & Footer are rendered at the app root so
          this component focuses only on children and suspense fallbacks. */}
      <main
        id="main-content"
        className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Suspense ensures fallback during lazy loading */}
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-[60vh]">
              <UltraFastLoader mode="replace">{null}</UltraFastLoader>
            </div>
          }
        >
          <UltraFastLoader mode="overlay">
            <div className="content-stable force-gpu">{children}</div>
          </UltraFastLoader>
        </Suspense>
      </main>
    </div>
  );
};

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
