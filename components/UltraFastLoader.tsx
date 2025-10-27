import React, { useState, useEffect } from 'react';

interface UltraFastLoaderProps {
  children: React.ReactNode;
}

export const UltraFastLoader: React.FC<UltraFastLoaderProps> = ({ children }) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    const spinnerTimeout = setTimeout(() => setShowSpinner(true), 5); // Show spinner after 5ms if content isn't ready
    setContent(children);
    return () => clearTimeout(spinnerTimeout);
  }, [children]);

  if (!content) {
    return showSpinner ? (
      <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-50">
        <div 
          className="w-5 h-5 border-2 rounded-full" 
          style={{
            borderTopColor: '#3b82f6',
            borderRightColor: 'transparent',
            borderBottomColor: '#3b82f6',
            borderLeftColor: 'transparent',
            animation: 'spin 0.4s linear infinite'
          }}
        />
      </div>
    ) : null;
  }

  return <div className="animate-fastFade">{content}</div>;
};