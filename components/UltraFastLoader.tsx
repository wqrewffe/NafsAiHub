import React, { useState, useEffect, useRef } from 'react';

interface UltraFastLoaderProps {
  children: React.ReactNode;
  /** Explicit loading control. If omitted, it auto-detects render timing. */
  loading?: boolean | null;
  /** 'overlay' keeps content visible; 'replace' hides it. */
  mode?: 'overlay' | 'replace';
  /** When true, overlay blocks pointer events. */
  blockInteraction?: boolean;
  /** Enable the spinner UX. Defaults to false to keep UI stable on refresh. */
  enabled?: boolean;
  /** Delay before showing spinner (ms). */
  delayMs?: number;
  /** Minimum visible time for spinner (ms). */
  minVisibleMs?: number;
}

/**
 * UltraFastLoader — a smart loading UX enhancer.
 * Keeps persistent layout visible (e.g., navbar/footer) while showing
 * a minimal spinner overlay between content transitions.
 */
export const UltraFastLoader: React.FC<UltraFastLoaderProps> = ({
  children,
  loading = null,
  mode = 'overlay',
  blockInteraction = false,
  delayMs = 8,
  minVisibleMs = 60,
  enabled = false,
}) => {
  const SPINNER_DELAY_MS = delayMs;
  const MIN_SPINNER_VISIBLE_MS = minVisibleMs;

  // If loader UX is disabled, render children immediately and no spinner logic runs.
  if (!enabled) return <>{children}</>;

  const [overlayVisible, setOverlayVisible] = useState(false);
  const internalLoading = useRef(false);

  const delayTimer = useRef<number | null>(null);
  const minTimer = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();

    const showSpinner = () => {
      internalLoading.current = true;
      setOverlayVisible(true);

      if (minTimer.current) clearTimeout(minTimer.current);
      minTimer.current = window.setTimeout(() => {
        internalLoading.current = false;
        if (loading === true) return; // Keep visible if still loading
        setOverlayVisible(false);
      }, MIN_SPINNER_VISIBLE_MS);
    };

    // Clear any previous timers
    if (delayTimer.current) cancelAnimationFrame(delayTimer.current);
    if (minTimer.current) clearTimeout(minTimer.current);

    if (loading === null) {
      // Auto-detect: show spinner briefly during render lag
      const check = (time: number) => {
        if (time - start >= SPINNER_DELAY_MS) showSpinner();
        else delayTimer.current = requestAnimationFrame(check);
      };
      delayTimer.current = requestAnimationFrame(check);
    } else {
      // Controlled loading
      if (loading) {
        delayTimer.current = requestAnimationFrame(() => {
          const now = performance.now();
          if (now - start >= SPINNER_DELAY_MS) showSpinner();
          else delayTimer.current = requestAnimationFrame(showSpinner);
        });
      } else {
        if (!internalLoading.current) setOverlayVisible(false);
      }
    }

    return () => {
      if (delayTimer.current) cancelAnimationFrame(delayTimer.current);
      if (minTimer.current) clearTimeout(minTimer.current);
    };
  }, [children, loading, SPINNER_DELAY_MS, MIN_SPINNER_VISIBLE_MS]);

  // Replace mode: hide content fully during load
  if (mode === 'replace' && overlayVisible) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div
          className="w-10 h-10 border-4 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      </div>
    );
  }

  // Overlay mode: keeps children visible under translucent loader
  return (
    <div className="relative">
      {children}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${
          blockInteraction ? 'pointer-events-auto' : 'pointer-events-none'
        } ${overlayVisible ? 'opacity-100 z-50' : 'opacity-0 z-10'} bg-white/30 backdrop-blur-sm`}
        aria-hidden={!overlayVisible}
      >
        <div className="w-10 h-10 border-4 border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
};
