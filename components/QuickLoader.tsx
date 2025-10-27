import React, { useEffect, useState } from 'react';

interface QuickLoaderProps {
  children: React.ReactNode;
  delay?: number;
}

export const QuickLoader: React.FC<QuickLoaderProps> = ({ 
  children, 
  delay = 20 // Ultra-short delay
}) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!show) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-[spin_0.3s_linear_infinite] transform-gpu"></div>
      </div>
    );
  }

  return <>{children}</>;
};