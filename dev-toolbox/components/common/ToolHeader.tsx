
import React from 'react';

interface ToolHeaderProps {
  title: string;
  description: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{title}</h1>
      <p className="mt-2 text-lg text-slate-300 max-w-2xl">{description}</p>
    </div>
  );
};
