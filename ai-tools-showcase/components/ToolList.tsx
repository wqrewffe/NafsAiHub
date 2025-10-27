
import React, { useMemo, useState } from 'react';
import { AITool, ApprovalStatus } from '../types';
import ToolCard from './ToolCard';

interface ToolListProps {
  tools: AITool[];
  isAdmin: boolean;
  onDelete?: (toolId: string) => void;
  onEdit?: (toolId: string) => void;
}

const ToolList: React.FC<ToolListProps> = ({ tools, isAdmin, onDelete, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTools = useMemo(() => {
    const visibleTools = isAdmin ? tools : tools.filter(tool => tool.status === ApprovalStatus.Approved);
    
    if (!searchTerm.trim()) {
      return visibleTools;
    }

    const lowercasedTerm = searchTerm.toLowerCase();
    return visibleTools.filter(
      tool =>
        tool.name.toLowerCase().includes(lowercasedTerm) ||
        tool.description.toLowerCase().includes(lowercasedTerm) ||
        tool.keywords.some(kw => kw.toLowerCase().includes(lowercasedTerm))
    );
  }, [tools, isAdmin, searchTerm]);

  return (
    <div className="space-y-6">
       <div className="relative">
         <input
           type="text"
           placeholder="Search for tools by name, keyword, or description..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full bg-card border border-border rounded-lg px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent focus:outline-none transition"
         />
         <svg className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
         </svg>
       </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTools.length > 0 ? (
          filteredTools.map(tool => (
            <ToolCard key={tool.id} tool={tool} isAdmin={isAdmin} onDelete={onDelete} onEdit={onEdit} />
          ))
        ) : (
          <p className="text-text-secondary col-span-full text-center py-10">No tools found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default ToolList;
