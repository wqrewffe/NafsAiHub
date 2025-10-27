
import React from 'react';
import { Tool } from '../types';
import ToolCard from './ToolCard';
import ToolCardSkeleton from './ToolCardSkeleton';

interface ToolRowProps {
  title: string;
  tools: Tool[] | null;
  loading: boolean;
  emptyMessage?: string;
}

const ToolRow: React.FC<ToolRowProps> = ({ title, tools, loading, emptyMessage = "No tools to display." }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-light">{title}</h2>
      <div className="flex overflow-x-auto space-x-6 pb-4 custom-scrollbar">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 sm:w-80">
              <ToolCardSkeleton />
            </div>
          ))
        ) : tools && tools.length > 0 ? (
          tools.map(tool => (
            <div key={tool.id} className="flex-shrink-0 w-72 sm:w-80">
              <ToolCard tool={tool} />
            </div>
          ))
        ) : (
          <div className="w-full text-center py-10 bg-secondary/50 rounded-lg">
            <p className="text-slate-400">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolRow;
