import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  addon?: string;
}

export const Input: React.FC<InputProps> = ({ className = '', label, addon, ...props }) => {
  const baseClasses = 'w-full px-3 py-2 rounded-lg text-light placeholder-slate-400 bg-secondary/30 border border-accent/20 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 hover:bg-secondary/40 transition-all duration-300';
  
  const inputElement = <input className={`${baseClasses} ${addon ? 'rounded-l-none' : ''} ${className}`} {...props} />;

  const finalInput = addon ? (
    <div className="flex">
        <span className="inline-flex items-center px-3 rounded-l-md text-slate-300 text-sm bg-secondary/50 border border-accent/20 border-r-0">{addon}</span>
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
