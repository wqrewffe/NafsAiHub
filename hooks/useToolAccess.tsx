import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { toolAccessService, ToolAccess } from '../services/toolAccessService';

interface ToolAccessContextType {
  unlockedTools: string[];
  isToolUnlocked: (toolId: string) => boolean;
  unlockProgress: number;
  totalToolUses: number;
  unlockToolWithPoints: (toolId: string) => Promise<boolean>;
  isAdmin: boolean;
}

const ToolAccessContext = createContext<ToolAccessContextType | null>(null);

export function ToolAccessProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [toolAccess, setToolAccess] = useState<ToolAccess | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setToolAccess(null);
      return;
    }

    const loadToolAccess = async () => {
      const access = await toolAccessService.getToolAccess(currentUser.uid);
      setToolAccess(access);
    };

    loadToolAccess();
  }, [currentUser]);

  const isToolUnlocked = (toolId: string) => {
    if (!toolAccess) return false;
    // Admin or wildcard access means all tools are unlocked
    if (toolAccess.isAdmin || toolAccess.unlockedTools.includes('*')) {
      return true;
    }
    return toolAccess.unlockedTools.includes(toolId);
  };

  const unlockToolWithPoints = async (toolId: string) => {
    if (!currentUser || !toolAccess) return false;
    
    // Admins don't need to unlock tools
    if (toolAccess.isAdmin || toolAccess.unlockedTools.includes('*')) {
      return true;
    }
    
    const success = await toolAccessService.unlockToolWithPoints(currentUser.uid, toolId);
    if (success) {
      setToolAccess(prev => prev ? {
        ...prev,
        unlockedTools: [...prev.unlockedTools, toolId]
      } : null);
    }
    return success;
  };

  return (
    <ToolAccessContext.Provider value={{
      unlockedTools: toolAccess?.unlockedTools || [],
      isToolUnlocked,
      unlockProgress: toolAccess?.nextUnlockProgress || 0,
  totalToolUses: toolAccess?.totalToolUses ?? Object.values(toolAccess?.toolUsage || {}).reduce((s, t) => s + (t.timesUsed || 0), 0),
      unlockToolWithPoints,
      isAdmin: toolAccess?.isAdmin || false
    }}>
      {children}
    </ToolAccessContext.Provider>
  );
}

export function useToolAccess() {
  const context = useContext(ToolAccessContext);
  if (!context) {
    throw new Error('useToolAccess must be used within a ToolAccessProvider');
  }
  return context;
}
