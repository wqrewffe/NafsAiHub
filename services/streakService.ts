import { db } from '../firebase/config';
import { FirestoreUser } from '../types';

interface StreakData {
    currentStreak: number;
    lastUsageDate: string;  // ISO date string (YYYY-MM-DD)
    longestStreak: number;
}

export const streakService = {
    /**
     * Update user's streak based on tool usage
     */
    async updateStreak(userId: string) {
        const streakRef = db.collection('users').doc(userId).collection('stats').doc('streak');
        const userRef = db.collection('users').doc(userId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        return db.runTransaction(async (transaction) => {
            const streakDoc = await transaction.get(streakRef);
            const userData = (await transaction.get(userRef)).data() as FirestoreUser | undefined;

            let streakData: StreakData;
            if (!streakDoc.exists) {
                // Initialize streak data
                streakData = {
                    currentStreak: 1,
                    lastUsageDate: todayStr,
                    longestStreak: 1
                };
            } else {
                streakData = streakDoc.data() as StreakData;
                const lastUsage = new Date(streakData.lastUsageDate);
                lastUsage.setHours(0, 0, 0, 0);

                const diffDays = Math.floor((today.getTime() - lastUsage.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    // Already used a tool today, no streak update needed
                    return streakData;
                } else if (diffDays === 1) {
                    // Next consecutive day, increment streak
                    streakData.currentStreak += 1;
                    streakData.lastUsageDate = todayStr;
                    streakData.longestStreak = Math.max(streakData.currentStreak, streakData.longestStreak);
                } else {
                    // Streak broken
                    streakData.currentStreak = 1;
                    streakData.lastUsageDate = todayStr;
                }
            }

            // Update the streak document
            transaction.set(streakRef, streakData);

            // Update user's streak in main document for easy access
            transaction.update(userRef, {
                currentStreak: streakData.currentStreak,
                longestStreak: streakData.longestStreak
            });

            return streakData;
        });
    },

    /**
     * Get current streak information for a user
     */
    async getStreak(userId: string): Promise<StreakData> {
        const streakDoc = await db.collection('users').doc(userId)
            .collection('stats').doc('streak').get();

        if (!streakDoc.exists) {
            return {
                currentStreak: 0,
                lastUsageDate: new Date(0).toISOString().split('T')[0],
                longestStreak: 0
            };
        }

        return streakDoc.data() as StreakData;
    },

    /**
     * Check if user's streak is valid for today
     */
    async checkStreakValidity(userId: string): Promise<boolean> {
        const streakDoc = await db.collection('users').doc(userId)
            .collection('stats').doc('streak').get();

        if (!streakDoc.exists) return false;

        const streakData = streakDoc.data() as StreakData;
        const lastUsage = new Date(streakData.lastUsageDate);
        lastUsage.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today.getTime() - lastUsage.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays === 0; // True if used today
    }
};
