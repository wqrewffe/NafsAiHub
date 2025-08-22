import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { getTopUsedToolsGlobal } from './firebaseService';
import { isUserAdmin } from './adminService';
import { notificationService } from './notificationService';

const USES_TO_UNLOCK = 5;
const TOOL_UNLOCK_COST = 1000; // points

// Initial tools that are automatically unlocked for new users
const STARTER_TOOLS = {
  'General': [
    'flashcard-generator',
    'mcq-generator',
    'meme-idea-generator',
    'quick-study',
    'note-taking',
    
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

interface ToolUsageStats {
  lastUsed?: Date;
  timesUsed: number;
}

interface ToolAccess {
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
      const accessRef = doc(db, 'toolAccess', userId);
      const toolAccess = await this.getToolAccess(userId);
      
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
      
      // Update tool usage
      toolAccess.toolUsage[toolId] = {
        lastUsed: new Date(),
        timesUsed: (toolAccess.toolUsage[toolId]?.timesUsed || 0) + 1
      };
      
      // Check if the user has enough uses to unlock a new tool
      if (toolAccess.nextUnlockProgress >= USES_TO_UNLOCK) {
        // Get most used tool that isn't already unlocked
        const topTools = await getTopUsedToolsGlobal();
        const availableTool = topTools.find(tool => !toolAccess.unlockedTools.includes(tool.toolId));
        
        if (availableTool) {
          unlockedToolId = availableTool.toolId;
          toolAccess.unlockedTools.push(unlockedToolId);
          toolAccess.nextUnlockProgress = 0;

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
      }
      
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
      console.error('Error in recordToolUse:', error);
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
        // Create insufficient balance notification with helpful info
        await notificationService.createNotification(userId, {
          type: 'suggestion',
          title: '❌ Insufficient Balance',
          message: `You need ${pointsNeeded} more points to unlock this tool.\nCurrent balance: ${currentPoints} points\nRequired: ${TOOL_UNLOCK_COST} points`,
          priority: 'high',
          action: {
            type: 'navigate',
            destination: '/referral'  // Navigate to referral page to earn more points
          }
        });
        return false;
      }
      
      // Deduct points and unlock tool (only for non-admin users)
      const newPoints = currentPoints - TOOL_UNLOCK_COST;
      await updateDoc(userRef, {
        points: newPoints
      });

      // Create a success notification with celebration emoji
      await notificationService.createNotification(userId, {
        type: 'achievement',
        title: '🎉 Purchase Successful!',
        message: `Tool unlocked! ${TOOL_UNLOCK_COST} points have been deducted.\nClick to try your new tool!`,
        priority: 'high',
        reward: {
          type: 'points',
          amount: -TOOL_UNLOCK_COST
        },
        action: {
          type: 'try_tool',
          toolId: toolId
        }
      });

      // Create a balance update notification with money bag emoji
      await notificationService.createNotification(userId, {
        type: 'reward',
        title: '💰 Balance Update',
        message: `New balance: ${newPoints} points`,
        priority: 'medium',
        reward: {
          type: 'points',
          amount: newPoints
        }
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
      
      // Create an error notification with detailed info
      await notificationService.createNotification(userId, {
        type: 'suggestion',
        title: '❌ Purchase Failed',
        message: 'Something went wrong while processing your purchase. Please try again later or contact support if the issue persists.',
        priority: 'high'
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
