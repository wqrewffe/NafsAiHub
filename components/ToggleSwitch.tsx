import React from 'react';

interface ToggleSwitchProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isEnabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-accent ${
        isEnabled ? 'bg-accent' : 'bg-slate-600'
      }`}
      aria-pressed={isEnabled}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
          isEnabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default ToggleSwitch;
