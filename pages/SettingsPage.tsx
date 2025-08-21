import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import ThemeSelector from '../components/ThemeSelector';
import { Cog6ToothIcon } from '../tools/Icons';
import { deleteUserAccount } from '../services/firebaseService';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { themes, setTheme, theme: currentTheme } = useTheme();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

      {/* Account Management */}
      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-light">Account Management</h2>
        <p className="text-light/80 mb-4">Deleting your account is permanent and will remove all your data, including history, referrals, badges, todos and notes.</p>
        {deleteError && (
          <p className="mb-3 text-red-400">{deleteError}</p>
        )}
        <button
          disabled={deleting}
          onClick={async () => {
            setDeleteError(null);
            if (!confirm('This action is permanent. Do you really want to delete your account?')) return;
            setDeleting(true);
            const result = await deleteUserAccount();
            setDeleting(false);
            if (!result.ok) {
              setDeleteError(result.message || 'Failed to delete account.');
              return;
            }
            // Redirect to home after deletion
            navigate('/');
          }}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {deleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;