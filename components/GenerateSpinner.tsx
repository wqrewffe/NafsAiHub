import React from 'react';

/**
 * Lightweight spinner used only on tool "Generate" buttons.
 * Uses a dedicated class so global `.animate-spin` disabling doesn't affect it.
 */
const GenerateSpinner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`inline-block w-5 h-5 rounded-full border-2 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent ${className} generate-spin`}
      aria-hidden="true"
    />
  );
};

export default GenerateSpinner;
