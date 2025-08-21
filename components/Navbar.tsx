import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { auth } from '../firebase/config';
import { Cog6ToothIcon, ClipboardDocumentCheckIcon, PencilIcon, UserGroupIcon } from '../tools/Icons';

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
  const { currentUser } = useAuth();
  const { authSettings } = useSettings();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // NavLinks (no To-do & Notes here)
  const navLinks = (
    <>
      {currentUser ? (
        <>
          {currentUser.email === ADMIN_EMAIL && (
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
            to="/profile"
            className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
          >
            {getGreeting()}
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
            <UserGroupIcon className="h-5 w-5 md:hidden" /> Refer & Earn
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
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser && desktopIconLinks}
            {navLinks}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">{mobileMenuLinks}</div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;