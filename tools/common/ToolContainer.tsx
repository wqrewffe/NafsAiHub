
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Tool } from '../types';
import { useToolAccess } from '../hooks/useToolAccess';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../hooks/useAuth';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const Icon = tool.icon;
  const path = tool.path || `/tool/${tool.id}`;
  const { isToolUnlocked, unlockProgress, unlockToolWithPoints, isAdmin } = useToolAccess();
  const { canUseAnonymously } = useToolAccess();
  const { currentUser } = useAuth();
  const isUnlocked = isAdmin || isToolUnlocked(tool.id);
  // For anonymous users, compute whether they're allowed to use this tool anymore
  const anonAllowed = currentUser ? true : canUseAnonymously(tool.id);
  // Visual lock should be hidden for anonymous users who still have allowance; show lock when their quota is exhausted
  const visuallyUnlocked = isAdmin || isUnlocked || (!!currentUser) || anonAllowed;
  const navigate = useNavigate();

  const handleClick = async (e: React.MouseEvent) => {
    if (!isUnlocked && !isAdmin) {
      // If user is logged in, keep existing unlock flow
      if (currentUser) {
        e.preventDefault();
        // Try to unlock - will succeed automatically for admins
        const unlocked = await unlockToolWithPoints(tool.id);
        if (!unlocked) {
          // Show notification that they need more points
          console.log('Not enough points to unlock');
        }
      } else {
        // Anonymous user: if they exhausted their quota, block navigation and send to login/signup
        try {
          const allowed = canUseAnonymously(tool.id);
          if (!allowed) {
            e.preventDefault();
            // redirect to login so they can create account for unlimited use
            navigate('/login');
            return;
          }
          // If anonymous users are allowed but we want to require login for using tools,
          // redirect them to login regardless so they must authenticate before generating.
          e.preventDefault();
          navigate('/login');
        } catch (err) {
          // If check fails for any reason, be conservative and block navigation
          e.preventDefault();
          console.error('Error checking anonymous usage:', err);
          navigate('/login');
        }
      }
    }
  };

  return (
    <ReactRouterDOM.Link to={path} onClick={handleClick}>
      <div className={`bg-secondary rounded-lg shadow-md p-4 sm:p-6 h-full flex flex-col transition-all duration-300 ease-in-out ${
        visuallyUnlocked ? 'hover:shadow-cyan-500/50 hover:scale-105' : 'opacity-75'
      }`}>
        <div className="flex items-center mb-4">
          <Icon className={`h-8 w-8 mr-4 ${visuallyUnlocked ? 'text-accent' : 'text-gray-500'}`} />
          <h3 className="text-xl font-bold text-light">{tool.name}</h3>
          {/* Show lock icon when visually locked (either logged-in locked or anonymous exhausted) */}
          {!visuallyUnlocked && (
            <div className="ml-auto" title={currentUser ? 'Click to unlock' : 'Login or create account for unlimited use'}>
              <LockClosedIcon className="h-5 w-5 text-gray-500" />
            </div>
          )}
        </div>
        <p className="text-slate-400 flex-grow">{tool.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full 
            ${visuallyUnlocked ? 'text-sky-600 bg-sky-200' : 'text-gray-600 bg-gray-200'}`}>
            {tool.category}
          </span>
          {/* Show unlock CTA text to logged-in users who haven't unlocked; for anonymous users show login CTA when exhausted */}
          {currentUser && !isUnlocked && (
            <span className="text-xs text-gray-400">
              Unlock for 1000 points
            </span>
          )}
          {!currentUser && !anonAllowed && (
            <span className="text-xs text-gray-400">
              2 free uses used — Login to continue
            </span>
          )}
        </div>
        {/* Only show progress to logged-in users */}
        {currentUser && !isUnlocked && unlockProgress > 0 && (
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
