import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary/50 text-light mt-auto border-t border-secondary/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/fav.png" alt="Naf's AI Hub logo" className="brand-logo" />
              <h3 className="text-lg font-semibold">Naf's AI Hub</h3>
            </div>
            <p className="text-light/80 mb-4">
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
            links={[
              { to: '/', label: 'Home' },
              { to: '/referral', label: 'Refer & Earn' },
              { to: '/leaderboard', label: 'Leaderboard' },
              { to: '/badges', label: 'Badges' },
            ]}
          />

          {/* Support */}
          <FooterLinks
            title="Support"
            links={[
              { to: '/support', label: 'Help Center' },
              { to: '/contact', label: 'Contact Us' },
              { to: '/policies', label: 'Policies' },
              { href: 'mailto:support@nafsaihub.com', label: 'Email Support' },
            ]}
          />
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-secondary pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-light/70 mb-4 md:mb-0">&copy; {new Date().getFullYear()} Naf's AI Hub. All rights reserved.</p>
            <div className="flex flex-wrap gap-6 text-sm">
              {[
                'Terms of Service',
                'Privacy Policy',
                'Community Guidelines',
                'AI Ethics',
                'Referral Rules',
              ].map((item) => (
                <Link key={item} to="/policies" className="text-light/70 hover:text-accent">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ href, label }: { href: string; label: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-light/70 hover:text-accent transition-colors" aria-label={label}>
    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" opacity="0.2" />
      <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Z" />
    </svg>
  </a>
);

const FooterLinks = ({ title, links }: { title: string; links: { to?: string; href?: string; label: string }[] }) => (
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

export default Footer;
