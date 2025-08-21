import { db } from '../firebase/config';
import { calculateToolBadges, calculateToolLevel } from './toolBadgeService';
import { Badge } from '../types';
// The 'firebase' import was not used, so it has been removed for cleaner code.

/**
 * A summary of a user's tool usage statistics, used for calculating badges.
 */
export interface ToolUsageStats {
    totalTools: number;
    dayStreak: number;
    categoryStats: Record<string, number>;
    maxToolUses: number;
    hasCustomPrompts: boolean;
    isFirstInCategory: boolean;
    hasUsedAllCategories: boolean;
}

/**
 * The complete tool usage information to be displayed to the user.
 */
export interface ToolUsageInfo {
    badges: Badge[];
    level: string;
    nextLevelTools: number;
    totalUsage: number;
    categoryBreakdown: Record<string, number>;
    dayStreak: number;
    totalTools: number;
    maxToolUses: number;
}

/**
 * Fetches and calculates a user's complete tool usage profile, including
 * badges, level, and detailed stats from Firestore.
 * @param userId - The ID of the user to fetch information for.
 * @returns A promise that resolves to the ToolUsageInfo object, or null if an error occurs.
 */
export const getToolUsageInfo = async (userId: string): Promise<ToolUsageInfo | null> => {
    if (!userId) {
        console.error("getToolUsageInfo called with no userId.");
        return null;
    }

    try {
        // Get user's tool-specific usage data from the subcollection
        const userToolUsageRef = db.collection('users').doc(userId).collection('toolUsage');
        const toolUsageSnapshot = await userToolUsageRef.get();
        
        // Get user's total usage count from the main user document
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.warn(`User document not found for userId: ${userId}`);
            return null;
        }
        const userData = userDoc.data();
        const totalUsage = userData?.totalUsage || 0;

        // Calculate category breakdown, max uses, and total unique tools
        const categoryStats: Record<string, number> = {};
        let maxToolUses = 0;
        let totalTools = 0;

        toolUsageSnapshot.forEach(doc => {
            const data = doc.data() as { category?: string; count?: number };
            const category = data.category || 'General';
            const count = data.count || 0;
            
            categoryStats[category] = (categoryStats[category] || 0) + count;
            maxToolUses = Math.max(maxToolUses, count);
            totalTools++;
        });

        // This is a placeholder/estimate; a real implementation would use timestamps
        const dayStreak = Math.min(Math.floor(totalUsage / 5), 90);

        // Check if the user has used at least one tool in every major category
        const allCategories = ['General', 'Medical', 'Programming', 'Education', 'Creative', 'Games & Entertainment', 'GameDev', 'Robotics & AI', 'Productivity'];
        const hasUsedAllCategories = allCategories.every(category => (categoryStats[category] || 0) > 0);

        // These are placeholders for future feature implementations
        const hasCustomPrompts = false;
        const isFirstInCategory = false;

        const stats: ToolUsageStats = {
            totalTools,
            dayStreak,
            categoryStats,
            maxToolUses,
            hasCustomPrompts,
            isFirstInCategory,
            hasUsedAllCategories
        };

        // Calculate badges and level based on the aggregated stats
        const badges = calculateToolBadges(stats);
        const { currentLevel, nextLevelTools } = calculateToolLevel(totalTools);

        // Return the final, structured object
        return {
            badges,
            level: currentLevel,
            nextLevelTools,
            totalUsage,
            categoryBreakdown: categoryStats,
            dayStreak,
            totalTools,
            maxToolUses
        };

    } catch (error) {
        console.error(`Error getting tool usage info for userId ${userId}:`, error);
        return null;
    }
};