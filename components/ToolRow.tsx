
import React, { useEffect, useRef } from 'react';
import { Tool } from '../types';
import ToolCard from './ToolCard';
import ToolCardSkeleton from './ToolCardSkeleton';

interface ToolRowProps {
  title: string;
  tools: Tool[] | null;
  loading: boolean;
  emptyMessage?: string;
  forceVisible?: boolean; // If true, skip scroll-reveal animation
  showViewAll?: boolean; // If true, show "View All" button
  viewAllLink?: string; // Link for "View All" button (defaults to #tools)
}

const ToolRow: React.FC<ToolRowProps> = ({ title, tools, loading, emptyMessage = "No tools to display.", forceVisible = false, showViewAll = false, viewAllLink = '#tools' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure this section becomes visible when it mounts or content changes
  useEffect(() => {
    if (!forceVisible) {
      // Only run scroll-reveal logic if not forcing visibility
      const ensureVisible = () => {
        if (containerRef.current) {
          const el = containerRef.current;
          
          // Always make visible - these sections are important and should always be shown
          el.classList.add('visible');
          // Force opacity with inline style - use cssText to set with !important
          el.style.cssText += '; opacity: 1 !important; transform: translateY(0) scale(1) !important;';
          
          // Also handle nested stagger items - force them visible too
          const staggerItems = el.querySelectorAll('.stagger-item');
          staggerItems.forEach(item => {
            const itemEl = item as HTMLElement;
            itemEl.classList.add('visible');
            itemEl.style.cssText += '; opacity: 1 !important; transform: translateY(0) !important;';
          });
        }
      };

      ensureVisible();
      const timeouts = [50, 150, 300, 500, 1000, 2000].map(delay => setTimeout(ensureVisible, delay));
      return () => {
        timeouts.forEach(clearTimeout);
      };
    } else {
      // When forceVisible is true, ensure all children are immediately visible
      const makeAllVisible = () => {
        if (containerRef.current) {
          const el = containerRef.current;
          // Remove any opacity restrictions
          el.style.opacity = '1';
          el.style.transform = 'translateY(0) scale(1)';
          
          // Make all stagger items visible immediately
          const staggerItems = el.querySelectorAll('.stagger-item');
          staggerItems.forEach(item => {
            const itemEl = item as HTMLElement;
            itemEl.style.opacity = '1';
            itemEl.style.transform = 'translateY(0)';
            itemEl.classList.add('visible');
          });
          
          // Make all tool cards visible
          const toolCards = el.querySelectorAll('.tool-card, [class*="tool-card"], [class*="ToolCard"]');
          toolCards.forEach(card => {
            const cardEl = card as HTMLElement;
            cardEl.style.opacity = '1';
          });
        }
      };

      makeAllVisible();
      const timeouts = [50, 100, 200].map(delay => setTimeout(makeAllVisible, delay));
      return () => {
        timeouts.forEach(clearTimeout);
      };
    }
  }, [tools, loading, title, forceVisible]);

  const handleViewAll = () => {
    if (viewAllLink.startsWith('#')) {
      document.querySelector(viewAllLink)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = viewAllLink;
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`space-y-3 sm:space-y-4 ${forceVisible ? '' : 'scroll-reveal'}`}
      style={forceVisible ? { opacity: 1, transform: 'translateY(0) scale(1)' } : undefined}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-light transition-colors duration-300 hover:text-accent">{title}</h2>
        {showViewAll && (
          <button
            onClick={handleViewAll}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-accent hover:text-accent/80 border border-accent/30 hover:border-accent/50 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 whitespace-nowrap self-start sm:self-auto"
          >
            View All
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex overflow-x-auto space-x-4 sm:space-x-6 pb-4 custom-scrollbar scroll-smooth -mx-4 sm:mx-0 px-4 sm:px-0">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className="flex-shrink-0 w-64 sm:w-72 md:w-80 stagger-item"
              style={forceVisible ? { opacity: 1, transform: 'translateY(0)' } : undefined}
            >
              <ToolCardSkeleton />
            </div>
          ))
        ) : tools && tools.length > 0 ? (
          tools.map((tool, index) => (
            <div 
              key={tool.id} 
              className="flex-shrink-0 w-64 sm:w-72 md:w-80 stagger-item" 
              style={forceVisible ? { opacity: 1, transform: 'translateY(0)' } : { animationDelay: `${index * 0.1}s` }}
            >
              <ToolCard tool={tool} />
            </div>
          ))
        ) : (
          <div className="w-full text-center py-8 sm:py-10 bg-secondary/50 rounded-lg border border-secondary/50 hover:border-accent/30 transition-all duration-300">
            <p className="text-sm sm:text-base text-slate-400">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolRow;
