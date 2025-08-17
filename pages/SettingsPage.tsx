import React from 'react';
import { useTheme } from '../hooks/useTheme';
import ThemeSelector from '../components/ThemeSelector';
import { Cog6ToothIcon } from '../tools/Icons';

const SettingsPage: React.FC = () => {
  const { themes, setTheme, theme: currentTheme } = useTheme();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Cog6ToothIcon className="h-10 w-10 text-accent" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-400 mt-1">Customize your experience.</p>
        </div>
      </div>
      
      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Color Themes</h2>
        <p className="text-slate-400 mb-6">Select a theme to change the application's color scheme. Your choice will be saved for your next visit.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {themes.map((themeOption) => (
                <ThemeSelector
                    key={themeOption.name}
                    theme={themeOption}
                    isActive={currentTheme.name === themeOption.name}
                    onClick={() => setTheme(themeOption)}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;