import React, { useState, useEffect } from 'react';

interface SmartLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minimumLoadTime?: number;
  cachePath?: string;
  immediate?: boolean;
}

export const SmartLoader: React.FC<SmartLoaderProps> = ({ 
  children, 
  fallback = null,
  minimumLoadTime = 10, // Ultra-fast loading time
  immediate = true // Skip loading state if possible
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const startTime = Date.now();
    const loadContent = async () => {
      try {
        // Immediately set the actual content (JSX).
        setContent(children);

        // Calculate remaining time to meet minimum load time
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumLoadTime - elapsed);

        // Use timeout to ensure minimum loading time
        timeoutId = setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } catch (error) {
        console.error('Error in SmartLoader:', error);
        setIsLoading(false);
      }
    };

    loadContent();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [children, minimumLoadTime]);

  if (isLoading && !immediate) {
    return (
      <div className="transition-opacity duration-50">
        {fallback || (
          <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
            <div 
              className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500" 
              style={{ 
                animationDuration: '0.5s',
                borderTopColor: 'transparent',
                borderRightColor: 'transparent'
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return <>{content}</>;
};