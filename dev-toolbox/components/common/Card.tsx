
import React from 'react';

// FIX: Extend props to allow event handlers like onMouseUp, onMouseLeave, etc.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // FIX: Made children optional to allow for empty cards used for display purposes (e.g., gradient preview).
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style, ...props }) => {
  return (
    <div className={`bg-secondary/30 backdrop-blur-sm border border-accent/20 rounded-xl p-4 sm:p-6 hover:border-accent/40 transition-all duration-300 ${className}`} style={style} {...props}>
      {children}
    </div>
  );
};
