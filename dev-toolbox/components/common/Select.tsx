

import React from 'react';

// FIX: Add optional label prop for consistency with Input component.
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children: React.ReactNode;
  label?: string;
}

export const Select: React.FC<SelectProps> = ({ className = '', children, label, ...props }) => {
  const baseClasses = 'w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-colors';
  const selectElement = (
    <div className="relative w-full">
      <select className={`${baseClasses} ${className}`} {...props}>
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );

  return label ? (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-1 block">{label}</label>
      {selectElement}
    </div>
  ) : selectElement;
};
