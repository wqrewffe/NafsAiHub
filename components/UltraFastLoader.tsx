import React, { useState, useEffect, useRef } from 'react';

interface UltraFastLoaderProps {
  children: React.ReactNode;
  loading?: boolean | null;
  mode?: 'overlay' | 'replace';
  blockInteraction?: boolean;
  enabled?: boolean;
  delayMs?: number;
  minVisibleMs?: number;
}

export const UltraFastLoader: React.FC<UltraFastLoaderProps> = ({
  children,
  loading = null,
  mode = 'overlay',
  blockInteraction = false,
  enabled = true,
  delayMs = 40,
  minVisibleMs = 150,
}) => {
  const [visible, setVisible] = useState(false);
  const internalLoading = useRef(false);
  const delayRef = useRef<number | null>(null);
  const minRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const start = performance.now();

    const showSpinner = () => {
      internalLoading.current = true;
      setVisible(true);

      if (minRef.current) clearTimeout(minRef.current);
      minRef.current = window.setTimeout(() => {
        internalLoading.current = false;
        if (loading === true) return;
        setVisible(false);
      }, minVisibleMs);
    };

    if (delayRef.current) cancelAnimationFrame(delayRef.current);
    if (minRef.current) clearTimeout(minRef.current);

    if (loading === null) {
      const check = (time: number) => {
        if (time - start >= delayMs) showSpinner();
        else delayRef.current = requestAnimationFrame(check);
      };
      delayRef.current = requestAnimationFrame(check);
    } else if (loading) {
      delayRef.current = requestAnimationFrame(() => showSpinner());
    } else if (!internalLoading.current) {
      setVisible(false);
    }

    return () => {
      if (delayRef.current) cancelAnimationFrame(delayRef.current);
      if (minRef.current) clearTimeout(minRef.current);
    };
  }, [children, loading, delayMs, minVisibleMs, enabled]);

  if (mode === 'replace' && visible) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative">
      {children}
      {enabled && (
        <div
          className={`absolute inset-0 flex items-center justify-center 
            transition-all duration-200 ease-in-out
            ${visible ? 'opacity-100 z-40' : 'opacity-0 z-0'}
            ${blockInteraction ? 'pointer-events-auto' : 'pointer-events-none'}
            bg-primary/20 backdrop-blur-sm`}
          aria-hidden={!visible}
        >
          <Spinner />
        </div>
      )}
    </div>
  );
};

const Spinner = () => (
  <div
    className="w-10 h-10 border-4 border-t-accent border-b-accent border-r-transparent border-l-transparent 
    rounded-full animate-spin"
    aria-hidden="true"
  />
);
