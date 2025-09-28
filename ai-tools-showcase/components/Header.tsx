import React from 'react';
import { AppUser } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface HeaderProps {
  user: AppUser | null;
  isAdmin: boolean;
  onLogout: () => void;
  onSubmitClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, isAdmin, onLogout, onSubmitClick }) => {
  return (
    <header className="bg-card/50 backdrop-blur-lg sticky top-0 z-50 border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-accent">
          AI Tools Showcase
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { window.location.href = window.location.origin + '/'; }}
            title="Go to root"
            className="hidden sm:inline-block bg-transparent hover:bg-accent/10 text-accent font-medium py-2 px-3 rounded-lg transition-colors duration-200"
          >
            Go to Root
          </button>
          <button
            onClick={onSubmitClick}
            className="flex items-center gap-2 bg-primary hover:bg-secondary text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300"
          >
            <PlusIcon />
            Submit a Tool
          </button>
          {user && (
            <button
              onClick={onLogout}
              className="bg-gray-700 hover:bg-gray-600 text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              {`Logout ${isAdmin ? '(Admin)' : ''}`}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;