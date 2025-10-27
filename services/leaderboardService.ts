import { db } from '../firebase/config';
import { FirestoreUser, ReferralInfo, Badge } from '../types';
import { calculateToolBadges, calculateToolLevel } from './toolBadgeService';

export interface LeaderboardUser {
    id: string;
    displayName: string;
    badges: Badge[];
    points: number;
    level: string;
    totalUsage?: number;
    nextLevelRequirement?: number;
}

export interface LeaderboardData {
    referralLeaderboard: LeaderboardUser[];
    toolUsageLeaderboard: LeaderboardUser[];
}

export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardData> => {
    try {
        // Get all users with their tool usage counts
        const usersSnapshot = await db.collection('users').get();

        const referralUsers: LeaderboardUser[] = [];
        const toolUsageUsers: LeaderboardUser[] = [];

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data() as (FirestoreUser & { referralInfo?: ReferralInfo });
            const referralInfo = userData.referralInfo;

            // Skip admin users
            if (
                userData.email?.includes('admin') || 
                userData.email?.endsWith('@nafsaihub.com') ||
                userData.email === 'nafisabdullah424@gmail.com'
            ) {
                continue;
            }

            const toolUsage = userData.totalUsage || 0;
            const { currentLevel: toolLevel, nextLevelTools } = calculateToolLevel(toolUsage);
            const toolBadges = calculateToolBadges({
                dayStreak: 0,
                totalTools: toolUsage,
                categoryStats: {},
                isFirstInCategory: false,
                maxToolUses: toolUsage,
                hasUsedAllCategories: false,
                hasCustomPrompts: false
            });

            // Add to referral leaderboard
            if (referralInfo) {
                referralUsers.push({
                    id: doc.id,
                    displayName: userData.displayName || 'Anonymous User',
                    level: referralInfo.level || 'Bronze',
                    badges: referralInfo.badges || [],
                    points: referralInfo.rewards || 0,
                    nextLevelRequirement: referralInfo.nextLevelPoints
                });
            }

            // Add to tool usage leaderboard
            if (toolUsage > 0) {
                toolUsageUsers.push({
                    id: doc.id,
                    displayName: userData.displayName || 'Anonymous User',
                    level: toolLevel,
                    badges: toolBadges,
                    points: toolUsage,
                    totalUsage: toolUsage,
                    nextLevelRequirement: nextLevelTools
                });
            }
        }

        // Sort referral leaderboard (points first, then badges count)
        const referralLeaderboard = referralUsers
            .sort((a, b) => {
                if (b.points === a.points) {
                    return (b.badges?.length || 0) - (a.badges?.length || 0);
                }
                return b.points - a.points;
            })
            .slice(0, limit);

        // Sort tool usage leaderboard (by total usage/points, then badges count)
        const toolUsageLeaderboard = toolUsageUsers
            .sort((a, b) => {
                if (b.points === a.points) {
                    return (b.badges?.length || 0) - (a.badges?.length || 0);
                }
                return b.points - a.points;
            })
            .slice(0, limit);

        return {
            referralLeaderboard,
            toolUsageLeaderboard
        };

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return {
            referralLeaderboard: [],
            toolUsageLeaderboard: []
        };
    }
};
