import { db } from '../firebase/config';
import { calculateToolBadges, calculateToolLevel } from './toolBadgeService';
import { Badge } from '../types';
import { streakService } from './streakService';

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
        
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.warn(`User document not found for userId: ${userId}`);
            return null;
        }

        // Get streak data
        const streakData = await streakService.getStreak(userId);

        // Get usage data
        const userData = userDoc.data();

        // Compute totals from the user's toolUsage subcollection when possible
        const categoryStats: Record<string, number> = {};
        let maxToolUses = 0;
        let totalTools = 0;
        let totalUsageFromTools = 0;

        // First gather counts per toolId
        const countsByToolId: Record<string, number> = {};
        toolUsageSnapshot.forEach(doc => {
            const data = doc.data() as { count?: number };
            const count = typeof data.count === 'number' ? data.count : 0;
            countsByToolId[doc.id] = count;
            maxToolUses = Math.max(maxToolUses, count);
            totalTools++;
            totalUsageFromTools += count;
        });

        // Look up each tool's global metadata (category) from toolStats collection to build accurate category breakdown
        const toolIds = Object.keys(countsByToolId);
        if (toolIds.length > 0) {
            try {
                const toolStatPromises = toolIds.map(id => db.collection('toolStats').doc(id).get());
                const toolStatDocs = await Promise.all(toolStatPromises);
                toolStatDocs.forEach((tdoc, idx) => {
                    const tid = toolIds[idx];
                    const tdata: any = tdoc.exists ? (tdoc.data() || {}) : {};
                    const category = tdata.category || 'General';
                    categoryStats[category] = (categoryStats[category] || 0) + (countsByToolId[tid] || 0);
                });
            } catch (err) {
                console.warn('Error fetching toolStats for category breakdown, falling back to General category', err);
                // Fallback: lump everything into 'General'
                Object.values(countsByToolId).forEach(c => { categoryStats['General'] = (categoryStats['General'] || 0) + c; });
            }
        }

        // Prefer the per-tool counts if available, otherwise fall back to user doc's totalUsage
        const totalUsage = totalUsageFromTools > 0 ? totalUsageFromTools : (userData?.totalUsage || 0);

        const dayStreak = streakData.currentStreak;

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
