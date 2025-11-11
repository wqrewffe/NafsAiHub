  import React, { createContext, useContext, useEffect, useState } from 'react';
  import { useAuth } from './useAuth';
  import { toolAccessService, ToolAccess } from '../services/toolAccessService';
  import { getAnonIpUsage, incrementAnonIpUsage } from '../services/firebaseService';

  interface ToolAccessContextType {
    unlockedTools: string[];
    isToolUnlocked: (toolId: string) => boolean;
    unlockProgress: number;
    totalToolUses: number;
    unlockToolWithPoints: (toolId: string) => Promise<boolean>;
    // For anonymous users (not logged in): can use a tool at most 2 times.
    canUseAnonymously: (toolId: string) => boolean;
    recordAnonymousUse: (toolId: string) => void;
    isAdmin: boolean;
    // For logged-in non-admin users: allow exactly one trial use per tool
    canUseTrial: (toolId: string) => boolean;
    recordTrialUse: (toolId: string) => void;
  }

  const ToolAccessContext = createContext<ToolAccessContextType | null>(null);

  export function ToolAccessProvider({ children }: { children: React.ReactNode }) {
    const { currentUser } = useAuth();
    const TOOL_ACCESS_CACHE_KEY = 'nafs_tool_access_cache_v1';

    // Helper to restore cached tool access to avoid "Unlock for points" flash
    const getCachedToolAccess = (): ToolAccess | null => {
      try {
        const raw = localStorage.getItem(TOOL_ACCESS_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed as ToolAccess;
      } catch (e) {
        console.warn('Failed to restore cached tool access:', e);
        return null;
      }
    };

    const cacheToolAccess = (access: ToolAccess) => {
      try {
        localStorage.setItem(TOOL_ACCESS_CACHE_KEY, JSON.stringify(access));
      } catch (e) {
        console.warn('Failed to cache tool access:', e);
      }
    };

    const [toolAccess, setToolAccess] = useState<ToolAccess | null>(() => getCachedToolAccess());
    const ANON_LOCAL_KEY = 'nafs_anonymous_tool_usage_v1';
    const ANON_IP_USAGE_KEY = 'nafs_anonymous_tool_usage_by_ip_v1';
    const ANON_PENDING_KEY = 'nafs_anonymous_tool_usage_pending_v1';
    const ANON_IP_KEY = 'nafs_anonymous_ip_v1';
    const ANON_LIMIT = 2; // max uses per tool for anonymous users
    const ANON_IP_CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

    // Local trial tracking for logged-in non-admins (client-side enforcement)
    const TRIAL_LOCAL_KEY = 'nafs_logged_in_trial_usage_v1';

    const [anonIp, setAnonIp] = useState<string | null>(null);

    const readAnonLocalUsage = (): Record<string, number> => {
      try {
        const raw = localStorage.getItem(ANON_LOCAL_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, number>;
      } catch (e) {
        console.error('Error reading anonymous tool usage from localStorage', e);
        return {};
      }
    };

    const writeAnonLocalUsage = (data: Record<string, number>) => {
      try {
        localStorage.setItem(ANON_LOCAL_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Error writing anonymous tool usage to localStorage', e);
      }
    };

    const readIpUsage = (): Record<string, Record<string, number>> => {
      try {
        const raw = localStorage.getItem(ANON_IP_USAGE_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, Record<string, number>>;
      } catch (e) {
        console.error('Error reading anonymous IP usage from localStorage', e);
        return {};
      }
    };

    const writeIpUsage = (data: Record<string, Record<string, number>>) => {
      try {
        localStorage.setItem(ANON_IP_USAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Error writing anonymous IP usage to localStorage', e);
      }
    };

    const readPending = (): Record<string, number> => {
      try {
        const raw = localStorage.getItem(ANON_PENDING_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, number>;
      } catch (e) {
        console.error('Error reading pending anonymous usage', e);
        return {};
      }
    };

    const writePending = (data: Record<string, number>) => {
      try {
        localStorage.setItem(ANON_PENDING_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Error writing pending anonymous usage', e);
      }
    };

    const readTrialLocalUsage = (): Record<string, number> => {
      try {
        const raw = localStorage.getItem(TRIAL_LOCAL_KEY);
        if (!raw) return {};
        return JSON.parse(raw) as Record<string, number>;
      } catch (e) {
        console.error('Error reading trial usage from localStorage', e);
        return {};
      }
    };

    const writeTrialLocalUsage = (data: Record<string, number>) => {
      try {
        localStorage.setItem(TRIAL_LOCAL_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Error writing trial usage to localStorage', e);
      }
    };

    useEffect(() => {
      if (!currentUser) {
        setToolAccess(null);
        return;
      }

      const loadToolAccess = async () => {
        try {
          const access = await toolAccessService.getToolAccess(currentUser.uid);
          console.log('[INIT] Initial tool access loaded:', { 
            unlockedToolsCount: access.unlockedTools.length,
            adminUnlockedToolsCount: access.adminUnlockedTools?.length || 0,
            adminUnlockedAt: access.adminUnlockedAt
          });
          setToolAccess(access);
          cacheToolAccess(access);
        } catch (error) {
          console.error('[INIT] Failed to load initial tool access:', error);
        }
      };

      loadToolAccess();

      // Set up real-time listener to detect when admin unlocks/locks tools
      console.log('[INIT] Setting up real-time listener for user', currentUser.uid);
      const unsubscribe = toolAccessService.subscribeToToolAccess(currentUser.uid, (updatedAccess) => {
        console.log('[INIT] Real-time listener triggered, updating state with:', {
          unlockedToolsCount: updatedAccess.unlockedTools?.length || 0,
          adminUnlockedToolsCount: updatedAccess.adminUnlockedTools?.length || 0,
          adminUnlockedAt: updatedAccess.adminUnlockedAt
        });
        setToolAccess(updatedAccess);
        cacheToolAccess(updatedAccess);
      });

      return () => {
        if (unsubscribe) {
          console.log('[INIT] Cleaning up real-time listener for user', currentUser.uid);
          unsubscribe();
        }
      };
    }, [currentUser]);

    // Fetch public IP (cached) and flush any pending increments to IP store
    useEffect(() => {
      let mounted = true;

      const fetchIp = async () => {
        try {
          const cached = localStorage.getItem(ANON_IP_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as { ip: string; ts: number };
            if (Date.now() - parsed.ts < ANON_IP_CACHE_TTL) {
              if (mounted) setAnonIp(parsed.ip);
            }
          }

          // Always try to refresh in background
          const resp = await fetch('https://api.ipify.org?format=json');
          if (!resp.ok) throw new Error('Failed to fetch IP');
          const data = await resp.json();
          const ip = data.ip as string;
          if (ip) {
            localStorage.setItem(ANON_IP_KEY, JSON.stringify({ ip, ts: Date.now() }));
            if (mounted) setAnonIp(ip);
          }
        } catch (e) {
          console.warn('Could not determine public IP for anonymous enforcement:', e);
        }
      };

      fetchIp();

      return () => { mounted = false; };
    }, []);

    // When ip becomes available, flush pending local increments into ip-aggregated store
    useEffect(() => {
      if (!anonIp) return;
      try {
        const pending = readPending();
        if (Object.keys(pending).length === 0) return;
        // Try to flush pending to server first, then update local ipUsage cache
        (async () => {
          try {
            for (const [toolId, count] of Object.entries(pending)) {
              await incrementAnonIpUsage(anonIp, toolId, count);
            }
          } catch (e) {
            console.error('Error flushing pending to server:', e);
          }

          // Refresh server-side counts and write to local cache
          try {
            const serverCounts = await getAnonIpUsage(anonIp);
            const ipUsage = readIpUsage();
            ipUsage[anonIp] = { ...(ipUsage[anonIp] || {}), ...serverCounts };
            writeIpUsage(ipUsage);
          } catch (e) {
            console.error('Error fetching server-side ip usage after flush:', e);
          }

          writePending({});
        })();
      } catch (e) {
        console.error('Error flushing pending anonymous increments to IP store', e);
      }
    }, [anonIp]);

    const isToolUnlocked = (toolId: string) => {
      if (!toolAccess) {
        console.log(`[CHECK] No toolAccess data available yet`);
        return false;
      }
      // Admin or wildcard access means all tools are unlocked
      if (toolAccess.isAdmin) {
        console.log(`[CHECK] User is admin, all tools unlocked`);
        return true;
      }
      if (toolAccess.unlockedTools.includes('*')) {
        console.log(`[CHECK] User has wildcard access, all tools unlocked`);
        return true;
      }
      // Check both purchased tools and admin-globally-unlocked tools
      const isPurchased = toolAccess.unlockedTools.includes(toolId);
      const isAdminUnlocked = toolAccess.adminUnlockedTools?.includes(toolId) || false;
      const isUnlocked = isPurchased || isAdminUnlocked;
      console.log(`[CHECK] Tool ${toolId} - Unlocked: ${isUnlocked} (Purchased: ${isPurchased}, AdminUnlocked: ${isAdminUnlocked}) | Unlocked Tools: [${toolAccess.unlockedTools.slice(0, 5).join(', ')}${toolAccess.unlockedTools.length > 5 ? '...' : ''}] (${toolAccess.unlockedTools.length} total) | AdminUnlockedAt: ${toolAccess.adminUnlockedAt}`);
      return isUnlocked;
    };

    const unlockToolWithPoints = async (toolId: string) => {
      if (!currentUser || !toolAccess) return false;
      
      // Admins don't need to unlock tools
      if (toolAccess.isAdmin || toolAccess.unlockedTools.includes('*')) {
        return true;
      }
      
      const success = await toolAccessService.unlockToolWithPoints(currentUser.uid, toolId);
      if (success) {
        setToolAccess(prev => {
          if (!prev) return null;
          const updated = {
            ...prev,
            unlockedTools: [...prev.unlockedTools, toolId]
          };
          cacheToolAccess(updated);
          return updated;
        });
      }
      return success;
    };

    const canUseAnonymously = (toolId: string) => {
      // If user is logged in, anonymous rules don't apply
      if (currentUser) return true;

      try {
        // Check IP-aggregated usage first (stronger)
        if (anonIp) {
          const ipUsage = readIpUsage();
          const ipCountLocal = (ipUsage[anonIp] && ipUsage[anonIp][toolId]) || 0;
          // Also consider server-side value (in case local storage was cleared)
          // We'll try to fetch server value synchronously if possible (best-effort)
          let ipCountServer = 0;
          try {
            // Note: this is synchronous context; avoid awaiting here to keep function sync. Use cached local value.
            ipCountServer = ipCountLocal; // server value will be merged into local cache when available
          } catch (e) {
            console.warn('Could not fetch server-side ip count synchronously', e);
          }
          const ipCount = Math.max(ipCountLocal, ipCountServer);
          if (ipCount >= ANON_LIMIT) return false;
        }

        // Check local device usage
        const local = readAnonLocalUsage();
        const localCount = local[toolId] || 0;
        if (localCount >= ANON_LIMIT) return false;

        return true;
      } catch (e) {
        console.error('Error checking anonymous usage', e);
        return true; // fail open to avoid blocking unexpectedly
      }
    };

    const recordAnonymousUse = (toolId: string) => {
      if (currentUser) return;

      try {
        // increment local device usage immediately
        const local = readAnonLocalUsage();
        local[toolId] = (local[toolId] || 0) + 1;
        writeAnonLocalUsage(local);

        // increment IP-aggregated usage if ip known, otherwise queue in pending
        if (anonIp) {
          // Update local cache
          const ipUsage = readIpUsage();
          ipUsage[anonIp] = ipUsage[anonIp] || {};
          ipUsage[anonIp][toolId] = (ipUsage[anonIp][toolId] || 0) + 1;
          writeIpUsage(ipUsage);
          // And send to server (fire-and-forget)
          incrementAnonIpUsage(anonIp, toolId, 1).catch(e => console.error('Error incrementing server anon ip usage', e));
        } else {
          const pending = readPending();
          pending[toolId] = (pending[toolId] || 0) + 1;
          writePending(pending);
        }
      } catch (e) {
        console.error('Error recording anonymous use', e);
      }
    };

    const canUseTrial = (toolId: string) => {
      if (!currentUser || toolAccess?.isAdmin || toolAccess?.unlockedTools.includes('*')) return false;
      if (isToolUnlocked(toolId)) return false;
      try {
        const local = readTrialLocalUsage();
        const used = local[toolId] || 0;
        return used < 1;
      } catch (e) {
        console.error('Error checking trial usage', e);
        return false;
      }
    };

    const recordTrialUse = (toolId: string) => {
      if (!currentUser) return;
      if (toolAccess?.isAdmin || toolAccess?.unlockedTools.includes('*')) return;
      if (isToolUnlocked(toolId)) return;
      try {
        const local = readTrialLocalUsage();
        local[toolId] = Math.min(1, (local[toolId] || 0) + 1);
        writeTrialLocalUsage(local);
      } catch (e) {
        console.error('Error recording trial usage', e);
      }
    };

    return (
      <ToolAccessContext.Provider value={{
        unlockedTools: toolAccess?.unlockedTools || [],
        isToolUnlocked,
        unlockProgress: toolAccess?.nextUnlockProgress || 0,
    totalToolUses: toolAccess?.totalToolUses ?? Object.values(toolAccess?.toolUsage || {}).reduce((s, t) => s + (t.timesUsed || 0), 0),
        unlockToolWithPoints,
    canUseAnonymously,
    recordAnonymousUse,
        isAdmin: toolAccess?.isAdmin || false,
        canUseTrial,
        recordTrialUse,
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
