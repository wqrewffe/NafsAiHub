import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { usePoints } from '../hooks/usePoints';
import { useProfile } from '../hooks/useProfile';
import { auth } from '../firebase/config';
import { Cog6ToothIcon, ClipboardDocumentCheckIcon, PencilIcon, UserGroupIcon, SparklesIcon } from '../tools/Icons';
import { ExtendedUser } from '../types/auth';
import { db } from '../firebase/config';
import './Navbar.css';

const ADMIN_EMAIL = 'nafisabdullah424@gmail.com';

const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Navbar: React.FC = () => {
  const { currentUser } = useAuth() as { currentUser: ExtendedUser | null };
  const { profile } = useProfile(currentUser?.uid || '');
  const { authSettings } = useSettings();
  const { points, isInfinite } = usePoints();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debug logs
  useEffect(() => {
    console.log('Navbar Profile:', profile);
    console.log('Current User:', currentUser);
    console.log('Avatar URL:', profile?.avatarUrl);
  }, [profile, currentUser]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const getGreeting = () => {
    if (!currentUser) return '';
    if (currentUser.displayName) {
      return `Hi, ${currentUser.displayName.split(' ')[0]}`;
    }
    return currentUser.email;
  };

  const isLoggedIn = !!currentUser;
  const isVerified = !!currentUser?.emailVerified;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Load optional admin banner configuration from localStorage (prototype)
  const [bannerCfg, setBannerCfg] = useState<null | {
    visible: boolean;
    text: string;
    imageUrl: string;
    bgColor: string;
    textColor: string;
    linkUrl: string;
    openInNewTab: boolean;
  }>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nafs_admin_banner_config_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        setBannerCfg(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Subscribe to Firestore admin/bannerConfig so changes are visible to all users.
  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      unsub = db.collection('admin').doc('bannerConfig').onSnapshot((doc) => {
        const data = doc.exists ? doc.data() : null;
        if (data) {
          // If config is meant to be private, only set it for admin users
          const isPublic = !!data.public;
          if (isPublic) {
            setBannerCfg(data as any);
            localStorage.setItem('nafs_admin_banner_config_v1', JSON.stringify(data));
          } else {
            // private: show only to admin
            if (currentUser && currentUser.email === ADMIN_EMAIL) {
              setBannerCfg(data as any);
              localStorage.setItem('nafs_admin_banner_config_v1', JSON.stringify(data));
            } else {
              // Clear banner for non-admins
              setBannerCfg(null);
            }
          }
        }
      });
    } catch (e) {
      // ignore subscription errors
    }
    return () => { if (unsub) unsub(); };
  }, [currentUser]);

  // NavLinks (no To-do & Notes here)
  const navLinks = (
    <>
      {isVerified ? (
        <>
          {currentUser && currentUser.email === ADMIN_EMAIL && (
            <Link
              onClick={closeMobileMenu}
              to="/admin"
              className="text-yellow-400 hover:bg-yellow-400/10 border border-yellow-400/50 px-3 py-2 rounded-md text-sm font-medium transition-colors block"
            >
              Admin
            </Link>
          )}
          <Link
            onClick={closeMobileMenu}
            to={currentUser ? `/profile/${currentUser.displayName}-${currentUser.uid}` : '/profile'}
            className="hidden md:flex items-center space-x-2 text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            <div 
                className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary"
                data-initials={profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              >
              {profile?.avatarUrl ? (
                <img
                  key={profile.avatarUrl}
                  src={profile.avatarUrl.startsWith('/') ? profile.avatarUrl : `/avatars/${profile.avatarUrl}`}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load avatar:', profile.avatarUrl);
                    e.currentTarget.onerror = null;
                    // Don't fallback to Google photo URL, show initials instead
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('fallback-avatar');
                  }}
                />
              ) : currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load photo URL:', currentUser.photoURL);
                    e.currentTarget.onerror = null;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white">
                  {(profile?.displayName?.[0] || currentUser?.displayName?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>
            <span>{getGreeting()}</span>
          </Link>
          <Link
            onClick={closeMobileMenu}
            to="/settings"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <Cog6ToothIcon className="h-5 w-5 md:hidden" /> Settings
          </Link>
          {!authSettings.featureFlags?.hideNavbarReferral && (
          <Link
            onClick={closeMobileMenu}
            to="/referral"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <UserGroupIcon className="h-5 w-5 md:hidden" /> Earn & Buy
          </Link>
          )}
          {!authSettings.featureFlags?.hideNavbarLeaderboard && (
          <Link
            onClick={closeMobileMenu}
            to="/leaderboard"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <svg className="h-5 w-5 md:hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
            </svg>
            Leaderboard
          </Link>
          )}
          {!authSettings.featureFlags?.hideNavbarBadges && (
          <Link
            onClick={closeMobileMenu}
            to="/badges"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <svg className="h-5 w-5 md:hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5l3-3 3 3M3.75 6.75h16.5M6 21l6-3 6 3V6.75H6V21z" />
            </svg>
            Badges
          </Link>
          )}
          {!authSettings.featureFlags?.hideNavbarSupport && (
          <Link
            onClick={closeMobileMenu}
            to="/support"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <svg className="h-5 w-5 md:hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            Support
          </Link>
          )}
          {!authSettings.featureFlags?.hideNavbarContact && (
          <Link
            onClick={closeMobileMenu}
            to="/contact"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <svg className="h-5 w-5 md:hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Contact
          </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full md:w-auto bg-sky-500 text-white px-3 py-2 rounded-md text-sm font-medium btn-animated text-left"
          >
            Logout
          </button>
        </>
      ) : isLoggedIn ? (
        // User is signed in but hasn't verified their email yet.
        // Show a minimal menu with a link to the verify page and logout.
        <>
          <Link
            onClick={closeMobileMenu}
            to={currentUser ? `/profile/${currentUser.displayName}-${currentUser.uid}` : '/profile'}
            className="flex items-center space-x-2 text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            <div 
                className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary"
                data-initials={profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              >
              {(profile?.displayName?.[0] || currentUser?.displayName?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
            </div>
            <span>{getGreeting()}</span>
          </Link>
          <Link
            onClick={closeMobileMenu}
            to="/verify-email"
            className="text-yellow-300 hover:bg-yellow-400/10 border border-yellow-400/50 px-3 py-2 rounded-md text-sm font-medium transition-colors block"
          >
            Verify Email
          </Link>
          <button
            onClick={handleLogout}
            className="w-full md:w-auto bg-sky-500 text-white px-3 py-2 rounded-md text-sm font-medium btn-animated text-left"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            onClick={closeMobileMenu}
            to="/login"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            Login
          </Link>
          <Link
            onClick={closeMobileMenu}
            to="/signup"
            className="bg-sky-500 text-white px-3 py-2 rounded-md text-sm font-medium btn-animated"
          >
            Sign Up
          </Link>
        </>
      )}
    </>
  );

  // Desktop icons only
  const desktopIconLinks = (
    <>
      <Link
        to="/todo"
        aria-label="Open To-do List"
        title="To-do List"
        className="text-slate-300 hover:bg-slate-700 hover:text-white p-2 rounded-full transition-colors"
      >
        <ClipboardDocumentCheckIcon className="h-5 w-5" />
      </Link>
      <Link
        to="/notes"
        aria-label="Open Notes"
        title="Notes"
        className="text-slate-300 hover:bg-slate-700 hover:text-white p-2 rounded-full transition-colors"
      >
        <PencilIcon className="h-5 w-5" />
      </Link>
    </>
  );

  // Mobile menu includes To-do & Notes (text links)
  const mobileMenuLinks = (
    <>
      {currentUser && (
        <>
          <Link
            onClick={closeMobileMenu}
            to="/todo"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            To-do List
          </Link>
          <Link
            onClick={closeMobileMenu}
            to="/notes"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            Notes
          </Link>
        </>
      )}
      {navLinks}
    </>
  );

  return (
    <nav className="bg-secondary shadow-lg sticky top-0 z-50">
      {/* Top banner: can be overridden by admin config saved in localStorage */}
      {bannerCfg ? (
        bannerCfg.visible && (
          <div
            className="palestine-banner"
            role="region"
            aria-label={bannerCfg.text || 'Top banner'}
            style={{ background: bannerCfg.bgColor || 'transparent', color: bannerCfg.textColor || undefined }}
          >
            {bannerCfg.imageUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <img src={bannerCfg.imageUrl} className="palestine-flag-svg" style={{ width: 38, height: 23, borderRadius: 3 }} />
            ) : (
              <span className="palestine-flag" aria-hidden>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 36" className="palestine-flag-svg" role="img" aria-label="Palestinian flag">
                  <defs>
                    <clipPath id="pflag-clip"><rect width="60" height="36" rx="2" ry="2"/></clipPath>
                  </defs>
                  <g clipPath="url(#pflag-clip)">
                    <rect width="60" height="12" y="0" fill="#000" />
                    <rect width="60" height="12" y="12" fill="#fff" />
                    <rect width="60" height="12" y="24" fill="#007a3d" />
                    <polygon points="0,0 24,18 0,36" fill="#ce1126" />
                  </g>
                </svg>
              </span>
            )}

            {bannerCfg.linkUrl ? (
              <a href={bannerCfg.linkUrl} target={bannerCfg.openInNewTab ? '_blank' : '_self'} rel="noreferrer" className="palestine-text" style={{ color: bannerCfg.textColor }}>{bannerCfg.text}</a>
            ) : (
              <span className="palestine-text" style={{ color: bannerCfg.textColor }}>{bannerCfg.text}</span>
            )}
          </div>
        )
      ) : (
        /* Default static banner shown when no admin config exists */
        <div className="palestine-banner" role="region" aria-label="Stand with Palestine banner">
          <span className="palestine-flag" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 36" className="palestine-flag-svg" role="img" aria-label="Palestinian flag">
              <defs>
                <clipPath id="pflag-clip"><rect width="60" height="36" rx="2" ry="2"/></clipPath>
              </defs>
              <g clipPath="url(#pflag-clip)">
                <rect width="60" height="12" y="0" fill="#000" />
                <rect width="60" height="12" y="12" fill="#fff" />
                <rect width="60" height="12" y="24" fill="#007a3d" />
                <polygon points="0,0 24,18 0,36" fill="#ce1126" />
              </g>
            </svg>
          </span>
          <span className="palestine-text">Stand with Palestine</span>
        </div>
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="text-accent font-bold text-2xl hover:opacity-80 transition-opacity"
            >
              Naf's AI Hub
            </Link>

            {/* left side: brand only on mobile; quick actions are rendered on the right beside the menu button */}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center px-3 py-1 bg-accent/10 rounded-full text-accent">
                  <SparklesIcon className="w-5 h-5 mr-1" />
                  <span className="font-semibold">
                    {isInfinite ? '∞' : points.toLocaleString()}
                  </span>
                </div>
                {desktopIconLinks}
              </div>
            )}
            {navLinks}
            {/* Link to AI Tools Showcase */}
            <Link
              to="/showcase"
              onClick={closeMobileMenu}
              className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Tools
            </Link>
          </div>

          {/* Mobile right-side: if logged in show avatar + menu button, else show Login/Sign Up buttons */}
          <div className="md:hidden flex items-center gap-2">
            {currentUser ? (
              <>
                <Link
                  to={currentUser ? `/profile/${currentUser.displayName}-${currentUser.uid}` : '/profile'}
                  onClick={closeMobileMenu}
                  className="flex items-center"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-primary">
                    {profile?.avatarUrl ? (
                      <img
                        key={profile.avatarUrl}
                        src={profile.avatarUrl.startsWith('/') ? profile.avatarUrl : `/avatars/${profile.avatarUrl}`}
                        alt={profile.displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }}
                      />
                    ) : currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center text-white text-sm">
                        {(profile?.displayName?.[0] || currentUser?.displayName?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMobileMenu}
                  className="bg-sky-500 text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          {currentUser && (
            <div className="px-4 py-2 border-b border-gray-700">
              <div className="flex items-center px-3 py-1 bg-accent/10 rounded-full text-accent w-fit">
                <SparklesIcon className="w-5 h-5 mr-1" />
                <span className="font-semibold">
                  {isInfinite ? '∞' : points.toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">{mobileMenuLinks}</div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
