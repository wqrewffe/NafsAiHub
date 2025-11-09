import React, { useState } from 'react';
import { ALL_TOOLS } from '../../constants';
import { Input } from '../common/Input';
import { ToolHeader } from '../common/ToolHeader';

interface AllToolsProps {
  onSelectTool: (toolId: string) => void;
}

export const AllTools: React.FC<AllToolsProps> = ({ onSelectTool }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTools = ALL_TOOLS.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, toolId: string) => {
      e.preventDefault();
      onSelectTool(toolId);
  };

  return (
    <div className="glass-bg-darker p-8 rounded-2xl backdrop-blur-3xl">
      <div className="bg-slate-900/20 rounded-xl p-6">
        <ToolHeader
          title="All Tools"
          description={`Browse and search all ${ALL_TOOLS.length} available utilities.`}
        />
        <div className="mb-8">
          <Input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTools.map(tool => (
          <a
            key={tool.id}
            href={`/${tool.id}`}
            onClick={(e) => handleLinkClick(e, tool.id)}
            className="group block p-5 rounded-xl text-left hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 glass-bg"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg glass-bg">
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-md font-semibold text-white">{tool.name}</h3>
            </div>
            <p className="mt-3 text-sm text-slate-400">{tool.description}</p>
          </a>
        ))}
        </div>
      </div>
    </div>
  );
};