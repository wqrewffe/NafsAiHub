import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Tool } from '../types';
import { useToolAccess } from '../hooks/useToolAccess';
import toast from 'react-hot-toast';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface ToolCardProps {
  tool: Tool;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const Icon = tool.icon;
  const path = tool.path || `/tool/${tool.id}`;
  const { isToolUnlocked, unlockProgress, unlockToolWithPoints, isAdmin } = useToolAccess();
  const { canUseAnonymously } = useToolAccess();
  const { canUseTrial } = useToolAccess();
  const { currentUser } = useAuth();
  const isUnlocked = isAdmin || isToolUnlocked(tool.id);
  const [isHovered, setIsHovered] = useState(false);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  // For anonymous users, compute whether they're allowed to use this tool anymore
  const anonAllowed = currentUser ? true : canUseAnonymously(tool.id);
  // Visual lock should be hidden for anonymous users who still have allowance; show lock when their quota is exhausted
  const visuallyUnlocked = isAdmin || isUnlocked || (!!currentUser) || anonAllowed;
  const navigate = useNavigate();

  const [perToolCost, setPerToolCost] = React.useState<number | null>(() => {
    // Try to restore cached cost immediately to prevent "Unlock for X points" flash
    try {
      const cached = localStorage.getItem(`tool_cost_${tool.id}`);
      if (cached) {
        const parsed = Number(cached);
        if (isFinite(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to restore cached tool cost for', tool.id);
    }
    return null;
  });

  React.useEffect(() => {
    let mounted = true;
    const fetchCost = async () => {
      try {
        const ref = doc(db, 'tools', tool.id);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data && data.unlockCost !== undefined && data.unlockCost !== null) {
            const parsed = Number(data.unlockCost);
            if (isFinite(parsed)) {
              setPerToolCost(parsed);
              // Cache this cost so next load is instant
              try {
                localStorage.setItem(`tool_cost_${tool.id}`, String(parsed));
              } catch (e) {
                console.warn('Failed to cache tool cost for', tool.id);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load per-tool unlockCost for', tool.id, e);
      }
    };
    fetchCost();
    return () => { mounted = false; };
  }, [tool.id]);

  const handleClick = async (e: React.MouseEvent) => {
    if (!isUnlocked && !isAdmin) {
      // If user is logged in, keep existing unlock flow
      if (currentUser) {
        // Allow one free trial navigation into the tool if available
        if (canUseTrial(tool.id)) {
          // Let navigation proceed to the tool page; trial will be enforced on generate
          return;
        }
        e.preventDefault();
        // Try to unlock - will succeed automatically for admins
        const unlocked = await unlockToolWithPoints(tool.id);
        if (unlocked) {
          setShowUnlockAnimation(true);
          setTimeout(() => setShowUnlockAnimation(false), 1000);
          toast.success('🎉 Tool unlocked!', {
            duration: 3000,
            icon: '🔓',
            style: {
              background: '#059669',
              color: '#fff',
            },
          });
        } else {
          toast.error('Not enough points to unlock this tool', {
            duration: 4000,
            icon: '🔒',
          });
        }
      } else {
        // Anonymous user: if they exhausted their quota, block navigation and send to login/signup
        try {
          const allowed = canUseAnonymously(tool.id);
          if (!allowed) {
            e.preventDefault();
            // notify and redirect to login so they can create account for unlimited use
            toast("Please login or create an account to continue using tools", { icon: 'ℹ️', duration: 4000 });
            navigate('/login');
            return;
          }
          // We require login to actually use tools; show a friendly message then redirect.
          e.preventDefault();
          toast("Please login or create an account to use tools", { icon: 'ℹ️', duration: 4000 });
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
      <div 
        className={`tool-card bg-secondary rounded-lg shadow-md p-3 sm:p-4 md:p-6 h-full flex flex-col 
        ripple interactive-hover card-glow border border-transparent
        ${isHovered ? 'glow-effect' : ''} 
        ${showUnlockAnimation ? 'unlock-animation' : ''} ${
        visuallyUnlocked ? '' : 'opacity-75'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
        <div className="flex items-center mb-3 sm:mb-4">
          <Icon className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 mr-2 sm:mr-3 md:mr-4 flex-shrink-0 ${visuallyUnlocked ? 'text-accent' : 'text-gray-500'}`} />
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-light flex-grow min-w-0 break-words">{tool.name}</h3>
          {/* Show lock icon when visually locked (either logged-in locked or anonymous exhausted) */}
          {!visuallyUnlocked && (
            <div className="ml-2 flex-shrink-0" title={currentUser ? 'Click to unlock' : 'Login or create account for unlimited use'}>
              <LockClosedIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            </div>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-400 flex-grow">{tool.description}</p>
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full self-start
            ${visuallyUnlocked ? 'text-sky-600 bg-sky-200' : 'text-gray-600 bg-gray-200'}`}>
            {tool.category}
          </span>
          {/* Show unlock CTA text to logged-in users who haven't unlocked; for anonymous users show login CTA when exhausted */}
          {currentUser && !isUnlocked && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              Unlock for {perToolCost ?? 1000} points
            </span>
          )}
          {!currentUser && !anonAllowed && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
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
        <div className="mt-2 sm:mt-3 flex items-center justify-end gap-2">
          {['General', 'High School', 'Medical', 'Programming', 'Games & Entertainment', 'Robotics & AI', 'GameDev'].includes(tool.category) && (
            <button
              onClick={async (e) => {
                e.preventDefault();
                try {
                  const toolPath = `${window.location.origin}/#${`/tool/${tool.id}`}`;
                  const shareText = `${tool.name} - ${toolPath}`;
                  if (navigator.share) {
                    await navigator.share({ title: tool.name, text: shareText, url: toolPath });
                  } else {
                    await navigator.clipboard.writeText(toolPath);
                    toast('Tool link copied to clipboard');
                  }
                } catch (err) {
                  console.error('Share failed', err);
                  toast.error('Failed to copy link');
                }
              }}
              aria-label="Share Tool"
              title="Share Tool"
              className="p-2 bg-primary/80 border border-slate-700 rounded text-sm hover:bg-accent transition flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.2" className="text-slate-400/70" />
                <path d="M8 12l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </ReactRouterDOM.Link>
  );
};

export default ToolCard;
