import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export const engagementService = {
  async trackToolUsage(userId: string, toolId: string) {
    const userToolRef = doc(db, 'userTools', `${userId}_${toolId}`);
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const docSnap = await getDoc(userToolRef);
      if (docSnap.exists()) {
        await updateDoc(userToolRef, {
          [`usageHistory.${today}`]: increment(1),
          totalUses: increment(1),
          lastUsed: new Date()
        });
      } else {
        await setDoc(userToolRef, {
          userId,
          toolId,
          usageHistory: { [today]: 1 },
          totalUses: 1,
          lastUsed: new Date()
        });
      }
    } catch (error) {
      console.error('Error tracking tool usage:', error);
    }
  },

  async getDailyChallenge(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const challengeRef = doc(db, 'dailyChallenges', today);
    
    try {
      const docSnap = await getDoc(challengeRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting daily challenge:', error);
      return null;
    }
  },

  async updateUserAchievements(userId: string, achievement: string) {
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        [`achievements.${achievement}`]: new Date()
      });
    } catch (error) {
      console.error('Error updating achievements:', error);
    }
  },

  async getSessionStats(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const statsRef = doc(db, 'userStats', `${userId}_${today}`);
    
    try {
      const docSnap = await getDoc(statsRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      // Initialize stats for new session
      const initialStats = {
        userId,
        date: today,
        toolsUsed: 0,
        timeSpent: 0,
        lastActive: new Date()
      };
      await setDoc(statsRef, initialStats);
      return initialStats;
    } catch (error) {
      console.error('Error getting session stats:', error);
      return null;
    }
  }
};
