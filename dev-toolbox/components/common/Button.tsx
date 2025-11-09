
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';

  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500 text-white shadow-indigo-600/30',
    secondary: 'bg-slate-700 hover:bg-slate-600 focus:ring-slate-500 text-slate-100',
    danger: 'bg-red-600 hover:bg-red-500 focus:ring-red-500 text-white shadow-red-600/30',
    ghost: 'bg-transparent hover:bg-slate-700/50 text-slate-300 hover:text-white',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
