import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = memo(() => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const quickLinks = useMemo(() => [
    { to: '/', label: 'Home' },
    { to: '/referral', label: 'Refer & Earn' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/badges', label: 'Badges' },
  ], []);

  const supportLinks = useMemo(() => [
    { to: '/support', label: 'Help Center' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/policies', label: 'Policies' },
    { href: 'mailto:support@nafsaihub.com', label: 'Email Support' },
  ], []);

  const policyLinks = useMemo(() => [
    'Terms of Service',
    'Privacy Policy',
    'Community Guidelines',
    'AI Ethics',
    'Referral Rules',
  ], []);

  return (
    <footer className="bg-secondary/50 text-light mt-auto border-t border-secondary/50 relative overflow-hidden" style={{ position: 'static' as const, zIndex: 'auto' as const }}>
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4 group">
              <img src="/fav.png" alt="Naf's AI Hub logo" className="brand-logo transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" width={28} height={28} />
              <h3 className="text-lg font-semibold transition-colors duration-300 group-hover:text-accent">Naf's AI Hub</h3>
            </div>
            <p className="text-light/80 mb-4 leading-relaxed">
              Empowering users with cutting-edge AI tools for creativity,
              productivity, and learning. Join our community and discover the
              future of AI-powered assistance.
            </p>
            <div className="flex space-x-4">
              <SocialIcon href="https://twitter.com/nafsaihub" label="Twitter" />
              <SocialIcon href="https://linkedin.com/company/nafsaihub" label="LinkedIn" />
              <SocialIcon href="https://discord.gg/nafsaihub" label="Discord" />
            </div>
          </div>

          {/* Quick Links */}
          <FooterLinks
            title="Quick Links"
            links={quickLinks}
          />

          {/* Support */}
          <FooterLinks
            title="Support"
            links={supportLinks}
          />
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-secondary/50 pt-6 flex flex-col md:flex-row md:justify-between items-center gap-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <a
              href="https://twelve.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110"
            >
              <img
                src="https://twelve.tools/badge0-white.svg"
                alt="Featured on Twelve Tools"
                width={200}
                height={54}
                className="shadow-lg rounded-md"
              />
            </a>
            <a
              href="https://startupfa.me/s/nafsaihub.vercel.app?utm_source=nafsaihub.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-transform duration-300 hover:scale-110"
            >
              <img
                src="https://startupfa.me/badges/featured-badge-small.webp"
                alt="nafsaihub.vercel.app - Featured on Startup Fame"
                width={224}
                height={36}
                className="shadow-lg rounded-md"
              />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-light/70 transition-colors duration-300 hover:text-accent">
            &copy; {currentYear} Naf's AI Hub. All rights reserved.
          </p>

          {/* Policy Links */}
          <div className="flex flex-wrap gap-6 text-sm justify-center md:justify-end">
            {policyLinks.map((item) => (
              <Link
                key={item}
                to="/policies"
                className="text-light/70 hover:text-accent transition-all duration-300 relative group"
              >
                <span className="relative z-10">{item}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

const SocialIcon = memo(({ href, label }: { href: string; label: string }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer" 
    className="text-light/70 hover:text-accent transition-all duration-300 p-2 rounded-full hover:bg-accent/10 hover:scale-110 group" 
    aria-label={label}
  >
    <svg className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" opacity="0.2" className="group-hover:opacity-0.4 transition-opacity" />
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Z" />
    </svg>
  </a>
));

const FooterLinks = memo(({ title, links }: { title: string; links: { to?: string; href?: string; label: string }[] }) => (
  <div>
    <h4 className="text-md font-semibold mb-4 transition-colors duration-300 hover:text-accent">{title}</h4>
    <ul className="space-y-2">
      {links.map(({ to, href, label }) =>
        to ? (
          <li key={label}>
            <Link to={to} className="text-light/80 hover:text-accent transition-all duration-300 relative group inline-block">
              <span className="relative z-10">{label}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
            </Link>
          </li>
        ) : (
          <li key={label}>
            <a href={href} className="text-light/80 hover:text-accent transition-all duration-300 relative group inline-block">
              <span className="relative z-10">{label}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
            </a>
          </li>
        )
      )}
    </ul>
  </div>
));

Footer.displayName = 'Footer';
export default Footer;
