
import React from 'react';
import { Link } from 'react-router-dom';
import { Tool } from '../types';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const Icon = tool.icon;
  const path = tool.path || `/tool/${tool.id}`;
  return (
    <Link to={path}>
      <div className="bg-secondary rounded-lg shadow-md p-4 sm:p-6 h-full flex flex-col hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 ease-in-out">
        <div className="flex items-center mb-4">
          <Icon className="h-8 w-8 text-accent mr-4" />
          <h3 className="text-xl font-bold text-light">{tool.name}</h3>
        </div>
        <p className="text-slate-400 flex-grow">{tool.description}</p>
        <div className="mt-4">
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-600 bg-sky-200">
            {tool.category}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ToolCard;
