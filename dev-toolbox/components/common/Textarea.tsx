

import React from 'react';

// FIX: Add optional label prop for consistency with Input component.
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ className = '', label, ...props }) => {
  const baseClasses = 'w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors';
  const textareaElement = <textarea className={`${baseClasses} ${className}`} {...props} />;

  return label ? (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-1 block">{label}</label>
      {textareaElement}
    </div>
  ) : textareaElement;
};
