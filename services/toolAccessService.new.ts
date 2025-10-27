import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { getTopUsedToolsGlobal } from './firebaseService';
import { isUserAdmin } from './adminService';
import { notificationService } from './notificationService';
import { tools } from '../tools';

const USES_TO_UNLOCK = 5;
const TOOL_UNLOCK_COST = 1000; // points

// Initial tools that are automatically unlocked for new users
const STARTER_TOOLS = {
  'General': [
    'flashcard-generator',
    'meme-idea-generator',
    'quick-study',
    'note-taking',
    'todo-list'
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

      console.log('[DEBUG] Starting recordToolUse', {
        userId,
        toolId,
        currentAccess: toolAccess
      });

      let unlockedToolId: string | undefined;

      // Initialize toolUsage if it doesn't exist
      if (!toolAccess.toolUsage) {
        toolAccess.toolUsage = {};
      }

      // Initialize nextUnlockProgress if it doesn't exist
      if (typeof toolAccess.nextUnlockProgress !== 'number') {
        toolAccess.nextUnlockProgress = 0;
      }

      // Update tool usage stats
      if (!toolAccess.toolUsage[toolId]) {
        toolAccess.toolUsage[toolId] = { timesUsed: 0 };
      }

      toolAccess.toolUsage[toolId] = {
        lastUsed: new Date(),
        timesUsed: (toolAccess.toolUsage[toolId].timesUsed || 0) + 1
      };

      // Increment progress counter
      toolAccess.nextUnlockProgress += 1;
      
      console.log('[DEBUG] Updated stats:', {
        toolId,
        timesUsed: toolAccess.toolUsage[toolId].timesUsed,
        progress: toolAccess.nextUnlockProgress,
        threshold: USES_TO_UNLOCK
      });

      // Check if the user has enough uses to unlock a new tool
      if (toolAccess.nextUnlockProgress >= USES_TO_UNLOCK) {
        console.log('Reached unlock threshold!');
        console.log('Attempting to unlock new tool...');

        const unlockedSet = new Set(toolAccess.unlockedTools);
        const starterToolsSet = new Set(Object.values(STARTER_TOOLS).flat());

        // Filter for tools that are not starter tools and not already unlocked
        const availableTools = tools.filter(tool =>
          !unlockedSet.has(tool.id) &&
          !starterToolsSet.has(tool.id)
        );

        console.log('Currently unlocked tools:', toolAccess.unlockedTools);
        console.log('Available tools to unlock:', availableTools.length);

        if (availableTools.length > 0) {
          console.log('Found tools available to unlock!');
          
          // Pick a random tool from the available list
          const randomIndex = Math.floor(Math.random() * availableTools.length);
          const randomTool = availableTools[randomIndex];
          unlockedToolId = randomTool.id;

          console.log('Selected tool to unlock:', randomTool.name);

          // Add to unlocked tools array and reset progress
          toolAccess.unlockedTools.push(unlockedToolId);
          toolAccess.nextUnlockProgress = 0; // Reset progress after unlocking

          // Create a celebratory event for the unlocked tool
          await addDoc(collection(db, 'userEvents'), {
            userId,
            type: 'success',
            data: {
              title: '🎁 New Tool Unlocked!',
              message: `Congratulations! You've earned ${randomTool.name} for free by using tools frequently!\n\nClick below to try your new tool!`,
              toolId: unlockedToolId
            },
            createdAt: new Date(),
            read: false
          });

          console.log('Created unlock event for tool:', randomTool.name);
        } else {
          console.log('No tools available to unlock, continuing count');
        }
      } else {
        console.log('Not enough uses yet, continuing count');
      }

      // Save all changes to Firebase
      console.log('Saving updates to Firebase:', {
        progressCount: toolAccess.nextUnlockProgress,
        unlockedToolsCount: toolAccess.unlockedTools.length,
        lastUsedTool: toolId
      });

      await updateDoc(accessRef, {
        toolUsage: toolAccess.toolUsage,
        unlockedTools: toolAccess.unlockedTools,
        nextUnlockProgress: toolAccess.nextUnlockProgress
      });

      // Return the results
      return {
        unlockedToolId,
        currentProgress: toolAccess.nextUnlockProgress
      };      return {
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
        // Create success event for admin
        await addDoc(collection(db, 'userEvents'), {
          userId,
          type: 'success',
          data: {
            title: '👑 Admin Access',
            message: 'Tool unlocked with admin privileges\n\nClick below to try the tool!',
            toolId: toolId
          },
          createdAt: new Date(),
          read: false
        });
        return true;
      }

      const currentPoints = userData?.points || 0;
      
      if (currentPoints < TOOL_UNLOCK_COST) {
        const pointsNeeded = TOOL_UNLOCK_COST - currentPoints;
        // Create insufficient balance notification
        await notificationService.createNotification(userId, {
          type: 'suggestion',
          title: '❌ Insufficient Balance',
          message: `You need ${pointsNeeded} more points to unlock this tool.\nCurrent balance: ${currentPoints} points\nRequired: ${TOOL_UNLOCK_COST} points`,
          priority: 'high',
          action: {
            type: 'navigate',
            destination: '/referral' // Navigate to referral page to earn more points
          }
        });
        return false;
      }

      // Deduct points and unlock tool for non-admin users
      const newPoints = currentPoints - TOOL_UNLOCK_COST;
      await updateDoc(userRef, {
        points: newPoints
      });

      // Create a success notification
      await notificationService.createNotification(userId, {
        type: 'reward',
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

      // Create a balance update notification
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

      // Create an error notification
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