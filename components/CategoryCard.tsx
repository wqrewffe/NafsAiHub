
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
      <div className="bg-secondary rounded-lg shadow-md p-6 h-full flex flex-col justify-between hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 ease-in-out">
        <div>
            <div className="flex items-center mb-4">
                <Icon className="h-10 w-10 text-accent mr-4" />
                <h3 className="text-2xl font-bold text-light">{category}</h3>
            </div>
        </div>
        <div className="mt-4 text-right">
            <span className="text-sm font-semibold text-slate-400">
                {toolCount} Tools
            </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
