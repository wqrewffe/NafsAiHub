import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getTopUsedToolsGlobal } from './firebaseService';
import { isUserAdmin } from './adminService';
import { notificationService } from './notificationService';
import { tools } from '../tools';
import { Tool } from '../types';

const USES_TO_UNLOCK = 4;
const TOOL_UNLOCK_COST = 1000; // points

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
  'Productivity': [
    'task-organizer',
    'time-tracker',
    'project-planner'
  ]
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
      
      if (accessDoc.exists()) {
        return accessDoc.data() as ToolAccess;
      }
      
      const isAdmin = await isUserAdmin(userId);
      
      // Set up initial tool access document
      const initialToolAccess: ToolAccess = {
        userId,
        isAdmin,
        unlockedTools: [],
        toolUsage: {},
        nextUnlockProgress: 0,
        points: isAdmin ? Number.MAX_SAFE_INTEGER : 0,
        previousPoints: 0
      };
      
      // Add starter tools
      Object.values(STARTER_TOOLS).forEach(tools => {
        initialToolAccess.unlockedTools.push(...tools);
      });
      
      await setDoc(accessRef, initialToolAccess);
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
      
      // Check if the user has enough uses to unlock a new tool
      if (toolAccess.nextUnlockProgress >= USES_TO_UNLOCK) {
        console.log('[DEBUG] Progress threshold reached, fetching top tools');
        
        // Get most used tool that isn't already unlocked
        console.log('[DEBUG] Fetching top tools...');
        const topTools = await getTopUsedToolsGlobal();
        console.log('[DEBUG] Top tools:', {
          count: topTools.length,
          tools: topTools.map(t => ({
            id: t.toolId,
            name: t.toolName,
            category: t.category,
            useCount: t.useCount
          }))
        });
        
        // Check if user already has all tools
        const userUnlockedSet = new Set(toolAccess.unlockedTools || []);
        console.log('[DEBUG] User unlocked tools:', {
          count: userUnlockedSet.size,
          tools: Array.from(userUnlockedSet)
        });
        
        const availableTool = topTools.find(tool => !userUnlockedSet.has(tool.toolId));
        console.log('[DEBUG] Available tool to unlock:', availableTool ? {
          id: availableTool.toolId,
          name: availableTool.toolName,
          category: availableTool.category
        } : 'No tools available');
        
        if (availableTool) {
          unlockedToolId = availableTool.toolId;
          toolAccess.unlockedTools.push(unlockedToolId);
          toolAccess.nextUnlockProgress = 0;

          console.log('[DEBUG] Unlocking tool:', {
            toolId: unlockedToolId,
            toolName: availableTool.toolName,
            totalUnlocked: toolAccess.unlockedTools.length
          });

          // Notify user of the free unlocked tool with celebratory emoji
          await notificationService.createNotification(userId, {
            type: 'milestone',
            title: '🎁 Tool Unlocked by Usage!',
            message: `Congratulations! You've earned ${availableTool.toolName} for free through frequent usage!`,
            priority: 'high',
            action: {
              type: 'try_tool',
              toolId: unlockedToolId
            }
          });
        }
      } else {
        toolAccess.nextUnlockProgress++;
        console.log('[DEBUG] Incremented progress:', toolAccess.nextUnlockProgress);
      }
      
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
      const pointsNeeded = TOOL_UNLOCK_COST - currentPoints;
      
      if (!userData || currentPoints < TOOL_UNLOCK_COST) {
        console.log('Insufficient points, creating event...');
        
        // Create an insufficient points event
        await db.collection('userEvents').add({
          userId,
          type: 'error',
          data: {
            title: '⚠️ Not Enough Points',
            message: `You need ${pointsNeeded} more points to unlock this tool!\n\n` +
                    `🔸 Your Balance: ${currentPoints} points\n` +
                    `🔸 Tool Cost: ${TOOL_UNLOCK_COST} points\n` +
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
      const newPoints = currentPoints - TOOL_UNLOCK_COST;
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
          message: `You have unlocked ${toolName}!\n${TOOL_UNLOCK_COST} points have been deducted.\nYour new balance: ${newPoints} points\n\nClick below to try your new tool!`,
          toolId,
          points: -TOOL_UNLOCK_COST,
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
      // Check if the specific tool is unlocked
      return toolAccess.unlockedTools.includes(toolId);
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
  }
};
