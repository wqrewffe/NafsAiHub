
import React from 'react';
import { ToolCategory } from '../types';

interface CategoryCardProps {
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string }>;
  toolCount: number;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, icon: Icon, toolCount, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <div className="bg-secondary rounded-lg shadow-md p-4 sm:p-5 md:p-6 h-full flex flex-col justify-between card-glow border border-transparent ripple interactive-hover relative overflow-hidden group">
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors duration-300 flex-shrink-0">
              <Icon className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-accent mr-3 sm:mr-4 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-light group-hover:text-accent transition-colors duration-300 break-words">{category}</h3>
          </div>
        </div>
        
        <div className="mt-3 sm:mt-4 text-right relative z-10">
          <span className="text-xs sm:text-sm font-semibold text-slate-400 group-hover:text-accent transition-colors duration-300 inline-block px-2 sm:px-3 py-1 rounded-full bg-primary/50 group-hover:bg-accent/20">
            {toolCount} Tools
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
