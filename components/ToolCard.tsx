
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Tool } from '../types';
import { useToolAccess } from '../hooks/useToolAccess';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/solid';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const Icon = tool.icon;
  const path = tool.path || `/tool/${tool.id}`;
  const { isToolUnlocked, unlockProgress, unlockToolWithPoints, isAdmin } = useToolAccess();
  const isUnlocked = isAdmin || isToolUnlocked(tool.id);

  const handleClick = async (e: React.MouseEvent) => {
    if (!isUnlocked && !isAdmin) {
      e.preventDefault();
      // Try to unlock - will succeed automatically for admins
      const unlocked = await unlockToolWithPoints(tool.id);
      if (!unlocked) {
        // Show notification that they need more points
        console.log('Not enough points to unlock');
      }
    }
  };

  return (
    <ReactRouterDOM.Link to={path} onClick={handleClick}>
      <div className={`bg-secondary rounded-lg shadow-md p-4 sm:p-6 h-full flex flex-col transition-all duration-300 ease-in-out ${
        isUnlocked || isAdmin ? 'hover:shadow-cyan-500/50 hover:scale-105' : 'opacity-75'
      }`}>
        <div className="flex items-center mb-4">
          <Icon className={`h-8 w-8 mr-4 ${isUnlocked ? 'text-accent' : 'text-gray-500'}`} />
          <h3 className="text-xl font-bold text-light">{tool.name}</h3>
          {!isUnlocked && !isAdmin && (
            <div className="ml-auto" title="Click to unlock">
              <LockClosedIcon className="h-5 w-5 text-gray-500" />
            </div>
          )}
        </div>
        <p className="text-slate-400 flex-grow">{tool.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full 
            ${isUnlocked ? 'text-sky-600 bg-sky-200' : 'text-gray-600 bg-gray-200'}`}>
            {tool.category}
          </span>
          {!isUnlocked && (
            <span className="text-xs text-gray-400">
              Unlock for 1000 points
            </span>
          )}
        </div>
        {!isUnlocked && unlockProgress > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(unlockProgress / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {unlockProgress}/5 uses to unlock free
            </p>
          </div>
        )}
      </div>
    </ReactRouterDOM.Link>
  );
};

export default ToolCard;
