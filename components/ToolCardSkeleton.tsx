
import React from 'react';

const ToolCardSkeleton: React.FC = () => {
  return (
    <div className="bg-secondary rounded-lg shadow-md p-6 h-full flex flex-col animate-pulse">
      <div className="flex items-center mb-4">
        <div className="h-8 w-8 bg-slate-700 rounded-md mr-4"></div>
        <div className="h-6 w-3/4 bg-slate-700 rounded-md"></div>
      </div>
      <div className="space-y-2 flex-grow">
        <div className="h-4 bg-slate-700 rounded-md"></div>
        <div className="h-4 w-5/6 bg-slate-700 rounded-md"></div>
      </div>
      <div className="mt-4">
        <div className="h-5 w-24 bg-slate-700 rounded-full"></div>
      </div>
    </div>
  );
};

export default ToolCardSkeleton;
