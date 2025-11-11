import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc, onSnapshot, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { getTopUsedToolsGlobal } from './firebaseService';
import { isUserAdmin } from './adminService';
import { notificationService } from './notificationService';
import { tools } from '../tools';
import { Tool } from '../types';

const USES_TO_UNLOCK = 4;
const TOOL_UNLOCK_COST = 1000; // default points if tool doc doesn't specify unlockCost

// Initial tools that are automatically unlocked for new users
const STARTER_TOOLS = {
  'General': [
    'flashcard-generator',
    'mcq-generator',
    'quick-study',
    'note-taking',
    'meme-idea-generator'
  ],
  'High School': [
    'math-solver',
    'chemistry-calculator',
    'physics-simulator'
  ],
  'Medical': [
    'diagnosis-helper',
    'medical-case-simulator',
    'anatomy-explorer'
  ],
  'Programming': [
    'code-explainer'
  ],
  'Robotics & AI': [
    'ai-model-explainer',
    'robot-simulator',
    'neural-network-visualizer'
  ],
  'GameDev': [
    'game-mechanics-designer',
    'level-generator'
  ],
  'Games & Entertainment': [
    'story-generator',
    'character-creator',
    'plot-twist-generator'
  ],
  // 'Productivity' starter tools removed - moved to Toolbox
};

export interface ToolUsageStats {
  lastUsed?: Date;
  timesUsed: number;
}

export interface ToolAccess {
  userId: string;
  isAdmin: boolean;
  unlockedTools: string[];
  nextUnlockProgress: number;
  toolUsage: { [toolId: string]: ToolUsageStats };
  points?: number;
  previousPoints?: number;
  totalToolUses?: number;
  adminUnlockedTools?: string[]; // Tools unlocked by admin
  adminUnlockedAt?: Date | null; // When admin unlocked all tools
}

interface TopTool {
  toolId: string;
  useCount: number;
  toolName: string;
  category: string;
}

export const toolAccessService = {
  async getToolAccess(userId: string): Promise<ToolAccess> {
    try {
      const accessRef = doc(db, 'toolAccess', userId);
      const accessDoc = await getDoc(accessRef);
      const isAdmin = await isUserAdmin(userId);
      
      if (accessDoc.exists()) {
        const data = accessDoc.data() as ToolAccess;
        // Update admin privileges if needed
        if (isAdmin && (!data.unlockedTools.includes('*') || data.isAdmin !== isAdmin)) {
          const updates = {
            isAdmin: true,
            unlockedTools: ['*'],
            points: Number.MAX_SAFE_INTEGER
          };
          await updateDoc(accessRef, updates);
          return { ...data, ...updates };
        }
        return data;
      }
      // New users (non-admin) should start with no unlocked tools
      // Check for a global admin unlock-all setting so future/new users inherit it
      let globalAdminUnlockedTools: string[] = [];
      let globalAdminUnlockedAt: Date | null = null;
      
      console.log('[INIT] Creating new toolAccess for user:', userId);
      
      try {
        const globalRef = doc(db, 'adminSettings', 'unlockAllTools');
        const globalDoc = await getDoc(globalRef);
        console.log('[INIT] globalDoc.exists():', globalDoc.exists());
        
        if (globalDoc.exists()) {
          const gd: any = globalDoc.data();
          console.log('[INIT] adminSettings data:', { active: gd?.active, toolIdsLength: gd?.toolIds?.length });
          
          if (gd?.active && Array.isArray(gd.toolIds) && gd.toolIds.length > 0) {
            globalAdminUnlockedTools = gd.toolIds;
            // If unlockedAt is a Firestore Timestamp, convert to Date
            if (gd.unlockedAt && gd.unlockedAt.toDate) {
              globalAdminUnlockedAt = gd.unlockedAt.toDate();
            } else if (gd.unlockedAt) {
              globalAdminUnlockedAt = new Date(gd.unlockedAt);
            }
            console.log('[INIT] ✅ Global admin unlock FOUND - tools:', globalAdminUnlockedTools.length);
          } else {
            console.log('[INIT] ⚠️ Global doc exists but active=false or no toolIds');
          }
        } else {
          console.log('[INIT] No global admin unlock doc found at adminSettings/unlockAllTools');
        }
      } catch (e) {
        console.warn('[INIT] ⚠️ Failed to read global admin unlock settings', e);
      }

      // Fallback: if no adminSettings doc exists (older deployments), try to infer from existing toolAccess docs
      if (!globalAdminUnlockedTools.length) {
        try {
          console.log('[INIT] Fallback: searching toolAccess docs for adminUnlockedAt...');
          const q = query(collection(db, 'toolAccess'), where('adminUnlockedAt', '!=', null), limit(1));
          const snaps = await getDocs(q);
          if (!snaps.empty) {
            const d = snaps.docs[0].data() as any;
            console.log('[INIT] Fallback found toolAccess doc with adminUnlockedAt');
            if (Array.isArray(d.adminUnlockedTools) && d.adminUnlockedTools.length) {
              globalAdminUnlockedTools = d.adminUnlockedTools;
              if (d.adminUnlockedAt && d.adminUnlockedAt.toDate) {
                globalAdminUnlockedAt = d.adminUnlockedAt.toDate();
              } else if (d.adminUnlockedAt) {
                globalAdminUnlockedAt = new Date(d.adminUnlockedAt);
              }
              console.log('[INIT] ✅ Fallback FOUND - inferred tools:', globalAdminUnlockedTools.length);
            }
          } else {
            console.log('[INIT] Fallback: no toolAccess docs with adminUnlockedAt found');
          }
        } catch (e) {
          console.warn('[INIT] ⚠️ Fallback failed:', e);
        }
      }

      // Set up initial tool access document
      // For non-admin users: unlockedTools = purchased tools (none initially) + adminUnlockedTools = globally admin-unlocked
      // For admin users: unlockedTools = ['*'] (all tools via wildcard)
      const initialToolAccess: ToolAccess = {
        userId,
        isAdmin,
        unlockedTools: isAdmin ? ['*'] : [], // Empty for new non-admin users (purchased tools only)
        toolUsage: {},
        nextUnlockProgress: 0,
        points: isAdmin ? Number.MAX_SAFE_INTEGER : 0,
        previousPoints: 0,
        adminUnlockedTools: globalAdminUnlockedTools || [], // Track tools unlocked by admin globally (separate from purchases)
        adminUnlockedAt: globalAdminUnlockedAt // Track when admin unlocked all tools globally
      };
      
      await setDoc(accessRef, initialToolAccess);
      
      console.log('[INIT] ✅ Created new toolAccess doc:', {
        userId,
        isAdmin,
        unlockedToolsCount: initialToolAccess.unlockedTools.length,
        adminUnlockedToolsCount: initialToolAccess.adminUnlockedTools?.length || 0,
        adminUnlockedTools: initialToolAccess.adminUnlockedTools?.slice(0, 5),
        adminUnlockedAt: initialToolAccess.adminUnlockedAt
      });
      
      // Notify brand-new non-admin users about trial rules
      if (!isAdmin) {
        try {
          await notificationService.createNotification(userId, {
            type: 'milestone',
            title: 'Welcome! 🎉',
            message: 'You can try each tool once for free. After your trial, unlock the tool with points to continue using it.',
            priority: 'high',
            action: {
              type: 'navigate',
              destination: '/home'
            }
          });
        } catch (e) {
          console.warn('Failed to create welcome/trial notification:', e);
        }
      }
      return initialToolAccess;
    } catch (error) {
      console.error('Error in getToolAccess:', error);
      throw error;
    }
  },

  async recordToolUse(userId: string, toolId: string): Promise<{
    unlockedToolId?: string;
    currentProgress: number;
  }> {
    try {
      console.log('[DEBUG] Starting recordToolUse:', { userId, toolId });
      
      const accessRef = doc(db, 'toolAccess', userId);
      console.log('[DEBUG] Getting tool access for user');
      const toolAccess = await this.getToolAccess(userId);
      console.log('[DEBUG] Current tool access:', {
        isAdmin: toolAccess.isAdmin,
        unlockedTools: toolAccess.unlockedTools?.length || 0,
        progress: toolAccess.nextUnlockProgress,
        hasToolUsage: !!toolAccess.toolUsage
      });
      
      // If user is admin, just update usage stats
      if (toolAccess.isAdmin) {
        await updateDoc(accessRef, {
          [`toolUsage.${toolId}`]: {
            lastUsed: new Date(),
            timesUsed: ((toolAccess.toolUsage[toolId]?.timesUsed || 0) + 1),
          },
          points: Number.MAX_SAFE_INTEGER // Ensure admin points stay at max
        });
        return { currentProgress: toolAccess.nextUnlockProgress };
      }
      
      let unlockedToolId: string | undefined;
      
      // Initialize tool usage if needed
      if (!toolAccess.toolUsage) {
        toolAccess.toolUsage = {};
      }

      // Update tool usage
      toolAccess.toolUsage[toolId] = {
        lastUsed: new Date(),
        timesUsed: (toolAccess.toolUsage[toolId]?.timesUsed || 0) + 1
      };

      console.log('[DEBUG] Current tool usage:', {
        toolId,
        timesUsed: toolAccess.toolUsage[toolId].timesUsed,
        progress: toolAccess.nextUnlockProgress
      });
      
      // No auto-unlock by usage anymore; just track progress counter
      toolAccess.nextUnlockProgress = (toolAccess.nextUnlockProgress || 0) + 1;
      console.log('[DEBUG] Incremented progress (no auto-unlock):', toolAccess.nextUnlockProgress);
      
      console.log('[DEBUG] Updating Firestore with:', {
        toolUsage: toolAccess.toolUsage[toolId],
        unlockedToolsCount: toolAccess.unlockedTools.length,
        nextUnlockProgress: toolAccess.nextUnlockProgress
      });

      await updateDoc(accessRef, {
        toolUsage: toolAccess.toolUsage,
        unlockedTools: toolAccess.unlockedTools,
        nextUnlockProgress: toolAccess.nextUnlockProgress
      });
      
      return {
        unlockedToolId,
        currentProgress: toolAccess.nextUnlockProgress
      };
    } catch (error) {
      console.error('[DEBUG] Error in recordToolUse:', {
        error,
        userId,
        toolId,
        errorMessage: error.message,
        errorStack: error.stack
      });
      throw error;
    }
  },

  async awardToolsToUser(adminId: string, userId: string, type: 'all' | 'half' | 'custom', count?: number, specificToolId?: string): Promise<{success: boolean, unlockedTools: string[]}> {
    try {
      // Verify admin status
      const isAdmin = await isUserAdmin(adminId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Only admins can award tools');
      }

      const toolAccess = await this.getToolAccess(userId);
      const allTools = Object.values(tools).flat();
      const unlockedSet = new Set(toolAccess.unlockedTools || []);
      const lockedTools = allTools.filter(tool => !unlockedSet.has(tool.id));
      
      let toolsToAward: string[] = [];
      
      switch (type) {
        case 'all':
          toolsToAward = lockedTools.map(t => t.id);
          break;
        case 'half':
          toolsToAward = lockedTools
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.ceil(lockedTools.length / 2))
            .map(t => t.id);
          break;
        case 'custom':
          if (!count) throw new Error('Count required for custom tool awards');
          toolsToAward = lockedTools
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(count, lockedTools.length))
            .map(t => t.id);
          break;
        default:
          if (specificToolId) {
            toolsToAward = [specificToolId];
          }
      }

      if (toolsToAward.length === 0) {
        return { success: true, unlockedTools: [] };
      }

      const newUnlockedTools = [...new Set([...toolAccess.unlockedTools, ...toolsToAward])];
      
      const accessRef = doc(db, 'toolAccess', userId);
      await updateDoc(accessRef, {
        unlockedTools: newUnlockedTools
      });

      // Get the names of awarded tools
      const awardedToolNames = toolsToAward.map(id => {
        const tool = tools.find(t => t.id === id);
        return tool?.name || id;
      });

      // Create a notification with tool details for the user
      if (toolsToAward.length === 1) {
        await notificationService.createNotification(userId, {
          type: 'milestone',
          title: '🎁 New Tool Awarded!',
          message: `You've been awarded the ${awardedToolNames[0]} tool!`,
          priority: 'high',
          action: {
            type: 'try_tool',
            toolId: toolsToAward[0]
          }
        });
      } else {
        await notificationService.createNotification(userId, {
          type: 'milestone',
          title: '🎁 New Tools Awarded!',
          message: `You've been awarded ${toolsToAward.length} new tools:\n${awardedToolNames.join(', ')}`,
          priority: 'high'
        });
      }

      return { success: true, unlockedTools: toolsToAward };
    } catch (error) {
      console.error('Error awarding tools:', error);
      throw error;
    }
  },

  async unlockToolWithPoints(userId: string, toolId: string): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Check if user is admin - admins can unlock without spending points
      if (userData?.role === 'admin') {
        // Create success notification for admin with special admin badge
        await notificationService.createNotification(userId, {
          type: 'milestone',
          title: '👑 Admin Access',
          message: 'Tool unlocked with admin privileges',
          priority: 'high',
          action: {
            type: 'try_tool',
            toolId: toolId
          }
        });
        return true;
      }
      
      const currentPoints = userData?.points || 0;
      // Read per-tool unlock cost from Firestore if present
      let perToolCost = TOOL_UNLOCK_COST;
      try {
        const toolRef = doc(db, 'tools', toolId);
        const toolDoc = await getDoc(toolRef);
        const td = toolDoc.exists() ? toolDoc.data() as any : null;
        if (td && (td.unlockCost !== undefined && td.unlockCost !== null)) {
          const parsed = Number(td.unlockCost);
          if (isFinite(parsed) && parsed >= 0) perToolCost = parsed;
        }
      } catch (e) {
        console.warn('Could not read per-tool unlockCost, falling back to default', e);
      }

      const pointsNeeded = perToolCost - currentPoints;
      
  if (!userData || currentPoints < perToolCost) {
        console.log('Insufficient points, creating event...');
        
        // Create an insufficient points event
        await db.collection('userEvents').add({
          userId,
          type: 'error',
          data: {
            title: '⚠️ Not Enough Points',
            message: `You need ${pointsNeeded} more points to unlock this tool!\n\n` +
                    `🔸 Your Balance: ${currentPoints} points\n` +
                `🔸 Tool Cost: ${perToolCost} points\n` +
                    `🔸 Points Needed: ${pointsNeeded} points\n\n` +
                    'Click OK to visit the referral page and earn more points!',
            redirectTo: '/referral'
          },
          createdAt: new Date(),
          read: false
        });

        return false;
      }
      
      // Deduct points and unlock tool (only for non-admin users)
      const newPoints = currentPoints - perToolCost;
      await updateDoc(userRef, {
        points: newPoints
      });

      // Get the tool info from db
      const toolRef = doc(db, 'tools', toolId);
      const toolDoc = await getDoc(toolRef);
      const toolData = toolDoc.exists() ? toolDoc.data() : null;
      const toolName = toolData?.name || toolId;

      // Create a success event
      await db.collection('userEvents').add({
        userId,
        type: 'success',
        data: {
          title: '🎉 Tool Unlocked Successfully!',
          message: `You have unlocked ${toolName}!\n${perToolCost} points have been deducted.\nYour new balance: ${newPoints} points\n\nClick below to try your new tool!`,
          toolId,
          points: -perToolCost,
          newBalance: newPoints
        },
        createdAt: new Date(),
        read: false
      });
      
      const accessRef = doc(db, 'toolAccess', userId);
      const toolAccess = await this.getToolAccess(userId);
      
      if (!toolAccess.unlockedTools.includes(toolId)) {
        toolAccess.unlockedTools.push(toolId);
        await updateDoc(accessRef, {
          unlockedTools: toolAccess.unlockedTools
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error in unlockToolWithPoints:', error);
      
      // Create an error event
      await db.collection('userEvents').add({
        userId,
        type: 'error',
        data: {
          title: '❌ Purchase Failed',
          message: 'Something went wrong while processing your purchase. Please try again later or contact support if the issue persists.'
        },
        createdAt: new Date(),
        read: false
      });
      
      throw error;
    }
  },

  async isToolUnlocked(userId: string, toolId: string): Promise<boolean> {
    try {
      const toolAccess = await this.getToolAccess(userId);
      // Admin has access to all tools
      if (toolAccess.isAdmin || toolAccess.unlockedTools.includes('*')) {
        return true;
      }
      // Check if the tool is in unlockedTools (purchased) or adminUnlockedTools (admin-unlocked globally)
      const isAdminUnlocked = toolAccess.adminUnlockedTools?.includes(toolId) || false;
      const isPurchased = toolAccess.unlockedTools.includes(toolId);
      return isPurchased || isAdminUnlocked;
    } catch (error) {
      console.error('Error in isToolUnlocked:', error);
      throw error;
    }
  },

  async getUnlockedTools(userId: string): Promise<string[]> {
    try {
      const toolAccess = await this.getToolAccess(userId);
      return toolAccess.unlockedTools;
    } catch (error) {
      console.error('Error in getUnlockedTools:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time updates of a user's tool access
   * This allows instant refresh when admin unlocks/locks tools
   * @param userId The user ID to monitor
   * @param callback Function called whenever tool access changes
   * @returns Unsubscribe function to stop listening
   */
  subscribeToToolAccess(
    userId: string,
    callback: (toolAccess: ToolAccess) => void
  ): (() => void) | null {
    try {
      const accessRef = doc(db, 'toolAccess', userId);
      console.log(`[SUBSCRIBE] Setting up real-time listener for user ${userId}`);
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(accessRef, async (snapshot) => {
        try {
          if (snapshot.exists()) {
            const data = snapshot.data() as ToolAccess;
            console.log(`[SUBSCRIBE] Received update for user ${userId}:`, {
              unlockedToolsCount: data.unlockedTools?.length || 0,
              adminUnlockedToolsCount: data.adminUnlockedTools?.length || 0,
              adminUnlockedAt: data.adminUnlockedAt,
              isAdmin: data.isAdmin
            });
            
            const isAdmin = await isUserAdmin(userId);
            
            // Ensure admin field is current
            if (isAdmin && (!data.unlockedTools.includes('*') || data.isAdmin !== isAdmin)) {
              console.log(`[SUBSCRIBE] Updating admin user ${userId} to have wildcard access`);
              const updates = {
                isAdmin: true,
                unlockedTools: ['*'],
                points: Number.MAX_SAFE_INTEGER
              };
              await updateDoc(accessRef, updates);
              callback({ ...data, ...updates });
            } else {
              console.log(`[SUBSCRIBE] Calling callback with data for user ${userId}`);
              callback(data);
            }
          }
        } catch (error) {
          console.error('Error in subscribeToToolAccess callback:', error);
        }
      }, (error) => {
        console.error(`[SUBSCRIBE] Error listening to toolAccess for user ${userId}:`, error);
      });

      console.log(`[SUBSCRIBE] Real-time listener set up successfully for user ${userId}`);
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up tool access subscription:', error);
      return null;
    }
  }
};
