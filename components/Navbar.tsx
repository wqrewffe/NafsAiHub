import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase/config';
import { Cog6ToothIcon, ClipboardDocumentCheckIcon, PencilIcon } from '../tools/Icons';

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