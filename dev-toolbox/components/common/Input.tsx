import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  addon?: string;
}

export const Input: React.FC<InputProps> = ({ className = '', label, addon, ...props }) => {
  const baseClasses = 'w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors';
  
  const inputElement = <input className={`${baseClasses} ${addon ? 'rounded-l-none' : ''} ${className}`} {...props} />;

  const finalInput = addon ? (
    <div className="flex">
        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-700 text-slate-400 text-sm">{addon}</span>
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
