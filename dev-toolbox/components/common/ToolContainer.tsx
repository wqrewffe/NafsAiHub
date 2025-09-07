import React from 'react';

interface ToolContainerProps {
  children: React.ReactNode;
}

export const ToolContainer: React.FC<ToolContainerProps> = ({ children }) => {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl px-4 space-y-6">
        {children}
      </div>
    </div>
  );
};
