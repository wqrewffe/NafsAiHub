import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { usePoints } from '../hooks/usePoints';
import { useProfile } from '../hooks/useProfile';
import { auth } from '../firebase/config';
import { Cog6ToothIcon, ClipboardDocumentCheckIcon, PencilIcon, UserGroupIcon, SparklesIcon } from '../tools/Icons';
import { ExtendedUser } from '../types/auth';
import { db } from '../firebase/config';
import { tools } from '../tools/index';
import GlobalSearch from './GlobalSearch';
import { useToolHistory } from '../hooks/useToolHistory';
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

// Three dots menu icon
const EllipsisVerticalIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);

const Navbar: React.FC = memo(() => {
  const { currentUser } = useAuth() as { currentUser: ExtendedUser | null };
  const { profile } = useProfile(currentUser?.uid || '');
  const { authSettings } = useSettings();
  const { points, isInfinite } = usePoints();
  const { toolHistory } = useToolHistory();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      setMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }, [navigate]);

  const getGreeting = useMemo(() => {
    if (!currentUser) {
      // Try to get cached greeting from localStorage
      try {
        const keys = Object.keys(localStorage);
        const profileKey = keys.find(k => k.startsWith('profile_'));
        if (profileKey) {
          const cached = localStorage.getItem(profileKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.data?.displayName) {
              return `Hi, ${parsed.data.displayName.split(' ')[0]}`;
            }
          }
        }
      } catch (e) {
        // Ignore
      }
      return '';
    }
    if (currentUser.displayName) {
      return `Hi, ${currentUser.displayName.split(' ')[0]}`;
    }
    return currentUser.email || '';
  }, [currentUser, profile]);

  const isLoggedIn = !!currentUser;
  const isVerified = !!currentUser?.emailVerified;

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const closeDesktopMenu = useCallback(() => setDesktopMenuOpen(false), []);
  
  // Close desktop menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (desktopMenuOpen && !target.closest('.desktop-menu-dropdown')) {
        setDesktopMenuOpen(false);
      }
    };
    if (desktopMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [desktopMenuOpen]);

  // Handle keyboard shortcut for global search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Admin banner (prototype) removed — it previously used Firestore/localStorage
  // and caused stale content flashes for some users. If you need a top banner in
  // future, implement a server-driven solution and avoid rendering cached snapshots.

  // NavLinks (no To-do & Notes here)
  const navLinks = (
    <>
      {isVerified ? (
        <>
          {currentUser && currentUser.email === ADMIN_EMAIL && (
            <Link
              onClick={closeMobileMenu}
              to="/admin"
              className="text-yellow-400 hover:bg-yellow-400/10 border border-yellow-400/50 px-3 py-2 rounded-md text-base font-medium transition-colors block"
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
            <span>{getGreeting}</span>
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
            <span>{getGreeting}</span>
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
      <button
        onClick={() => setIsSearchOpen(true)}
        title="Global Search"
        aria-label="Open Global Search"
        className="text-slate-300 hover:bg-slate-700 hover:text-white p-2 rounded-full transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.5 5.5a7.5 7.5 0 0010.5 10.5z" />
        </svg>
      </button>
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
    <nav id="app-navbar" className="navbar-glass fixed top-0 left-0 right-0 bg-primary/80 backdrop-blur-sm py-2 z-50">
      {/* Top banner removed to avoid rendering stale admin-controlled content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" onClick={closeMobileMenu} className="brand flex items-center gap-3">
              <img src="/fav.png" alt="Naf's AI Hub logo" className="brand-logo" style={{ height: 28, width: 28, objectFit: 'contain' }} />
              <span className="brand-title font-bold text-2xl hover:opacity-80 transition-opacity" style={{ color: '#ff0000' }}>Naf's AI Hub</span>
            </Link>

            {/* left side: brand only on mobile; quick actions are rendered on the right beside the menu button */}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Show points immediately with placeholder if loading */}
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center px-3 py-1 bg-accent/10 rounded-full text-accent">
                  <SparklesIcon className="w-5 h-5 mr-1" />
                  <span className="font-semibold">
                    {isInfinite ? '∞' : points.toLocaleString()}
                  </span>
                </div>
                {desktopIconLinks}
              </div>
            ) : null}
            
            {/* Profile link and essential items */}
            {isVerified && currentUser && (
              <Link
                to={currentUser ? `/profile/${currentUser.displayName}-${currentUser.uid}` : '/profile'}
                className="flex items-center space-x-2 text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
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
                        e.currentTarget.onerror = null;
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
                        e.currentTarget.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-white">
                      {(profile?.displayName?.[0] || currentUser?.displayName?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                </div>
                <span>{getGreeting}</span>
              </Link>
            )}
            
            {/* Three dots menu for desktop */}
            {isVerified && (
              <div className="relative desktop-menu-dropdown">
                <button
                  onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                  className={`p-2 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200 ${
                    desktopMenuOpen ? 'bg-slate-700/50 text-white' : ''
                  }`}
                  aria-label="More options"
                  aria-expanded={desktopMenuOpen}
                >
                  <EllipsisVerticalIcon className="h-6 w-6 transition-transform duration-200" />
                </button>
                
                {/* Dropdown menu with smooth animations */}
                {desktopMenuOpen && (
                  <div className="desktop-dropdown-menu absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-secondary/95 backdrop-blur-xl border border-slate-600/50 py-2 z-50 overflow-hidden">
                    {/* Admin section */}
                    {currentUser && currentUser.email === ADMIN_EMAIL && (
                      <>
                        <Link
                          to="/admin"
                          onClick={closeDesktopMenu}
                          className="desktop-menu-item group flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300 transition-all duration-200"
                        >
                          <div className="flex items-center justify-center w-5 h-5">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>Admin Dashboard</span>
                        </Link>
                        <div className="h-px bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent my-1"></div>
                      </>
                    )}
                    
                    {/* Main menu items */}
                    <Link
                      to="/settings"
                      onClick={closeDesktopMenu}
                      className="desktop-menu-item group flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all duration-200"
                    >
                      <div className="flex items-center justify-center w-5 h-5">
                        <Cog6ToothIcon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
                      </div>
                      <span>Settings</span>
                    </Link>
                    
                    {!authSettings.featureFlags?.hideNavbarReferral && (
                      <Link
                        to="/referral"
                        onClick={closeDesktopMenu}
                        className="desktop-menu-item group flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all duration-200"
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          <UserGroupIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                        </div>
                        <span>Earn & Buy</span>
                      </Link>
                    )}
                    
                    {!authSettings.featureFlags?.hideNavbarLeaderboard && (
                      <Link
                        to="/leaderboard"
                        onClick={closeDesktopMenu}
                        className="desktop-menu-item group flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all duration-200"
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                          </svg>
                        </div>
                        <span>Leaderboard</span>
                      </Link>
                    )}
                    
                    {!authSettings.featureFlags?.hideNavbarBadges && (
                      <Link
                        to="/badges"
                        onClick={closeDesktopMenu}
                        className="desktop-menu-item group flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all duration-200"
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5l3-3 3 3M3.75 6.75h16.5M6 21l6-3 6 3V6.75H6V21z" />
                          </svg>
                        </div>
                        <span>Badges</span>
                      </Link>
                    )}
                    
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent my-1"></div>
                    
                    {!authSettings.featureFlags?.hideNavbarSupport && (
                      <Link
                        to="/support"
                        onClick={closeDesktopMenu}
                        className="desktop-menu-item group flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all duration-200"
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                          </svg>
                        </div>
                        <span>Support</span>
                      </Link>
                    )}
                    
                    {!authSettings.featureFlags?.hideNavbarContact && (
                      <Link
                        to="/contact"
                        onClick={closeDesktopMenu}
                        className="desktop-menu-item group flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all duration-200"
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <span>Contact</span>
                      </Link>
                    )}
                    
            <Link
              to="/showcase"
                      onClick={closeDesktopMenu}
                      className="desktop-menu-item group flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all duration-200"
                    >
                      <div className="flex items-center justify-center w-5 h-5">
                        <SparklesIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                      </div>
                      <span>Tools Showcase</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* Logout button */}
            {isVerified && (
              <button
                onClick={handleLogout}
                className="bg-sky-500 text-white px-3 py-2 rounded-md text-sm font-medium btn-animated"
              >
                Logout
              </button>
            )}
            
            {/* Show login/signup for non-authenticated users */}
            {!isLoggedIn && (
              <>
                <Link
                  to="/login"
              className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-sky-500 text-white px-3 py-2 rounded-md text-sm font-medium btn-animated"
                >
                  Sign Up
            </Link>
              </>
            )}
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
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 md:hidden"
                  aria-label="Search"
                  title="Global Search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.5 5.5a7.5 7.5 0 0010.5 10.5z" />
                  </svg>
                </button>
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

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        allTools={tools}
        toolHistory={toolHistory}
      />
    </nav>
  );
});

Navbar.displayName = 'Navbar';
export default Navbar;
