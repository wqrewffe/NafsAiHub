import React from 'react';
import { Theme } from '../hooks/useTheme';
import { CheckCircleIcon } from '../tools/Icons';

interface ThemeSelectorProps {
  theme: Theme;
  isActive: boolean;
  onClick: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, isActive, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`relative border-2 rounded-lg p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary ${isActive ? 'border-accent' : 'border-slate-600 hover:border-slate-500'}`}
      aria-label={`Select ${theme.name} theme`}
      aria-pressed={isActive}
    >
      <div className="flex space-x-1 h-16 rounded-md overflow-hidden">
        <div className="w-1/4 h-full" style={{ backgroundColor: theme.colors.primary }}></div>
        <div className="w-1/4 h-full" style={{ backgroundColor: theme.colors.secondary }}></div>
        <div className="w-1/4 h-full" style={{ backgroundColor: theme.colors.accent }}></div>
        <div className="w-1/4 h-full" style={{ backgroundColor: theme.colors.light }}></div>
      </div>
      <p className="text-sm font-medium text-light mt-2 text-center">{theme.name}</p>
      {isActive && (
        <div className="absolute top-1 right-1 bg-primary rounded-full">
            <CheckCircleIcon className="h-5 w-5 text-accent" />
        </div>
      )}
    </button>
  );
};

export default ThemeSelector;