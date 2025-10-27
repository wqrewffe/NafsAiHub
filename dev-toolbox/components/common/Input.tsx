import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  addon?: string;
}

export const Input: React.FC<InputProps> = ({ className = '', label, addon, ...props }) => {
  const baseClasses = 'w-full px-3 py-2 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 glass-bg hover:glass-bg-darker transition-all duration-300';
  
  const inputElement = <input className={`${baseClasses} ${addon ? 'rounded-l-none' : ''} ${className}`} {...props} />;

  const finalInput = addon ? (
    <div className="flex">
        <span className="inline-flex items-center px-3 rounded-l-md text-slate-300 text-sm glass-bg-darker">{addon}</span>
        {inputElement}
    </div>
  ) : inputElement;

  return label ? (
    <div>
        <label className="text-sm font-medium text-slate-300 mb-1 block">{label}</label>
        {finalInput}
    </div>
  ) : finalInput;
};
