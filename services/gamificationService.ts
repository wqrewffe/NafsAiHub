import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';

export interface UserLevel {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  title: string;
}

const TITLES = [
  'Novice Explorer',
  'AI Apprentice',
  'Digital Innovator',
  'Tech Virtuoso',
  'AI Master',
  'Innovation Guru',
  'Digital Sage',
  'AI Architect',
  'Tech Legend',
  'Digital Oracle'
];

const calculateNextLevelXp = (level: number): number => {
  return Math.floor(1000 * Math.pow(1.2, level - 1));
};

const calculateTitle = (level: number): string => {
  return TITLES[Math.min(Math.floor((level - 1) / 10), TITLES.length - 1)];
};

export const gamificationService = {
  async awardXp(userId: string, amount: number, reason: string) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() || { xp: 0, level: 1 };
    
    let newXp = (userData.xp || 0) + amount;
    let currentLevel = userData.level || 1;
    let leveledUp = false;
    
    // Check for level up
    while (newXp >= calculateNextLevelXp(currentLevel)) {
      currentLevel++;
      leveledUp = true;
    }

    const updates = {
      xp: newXp,
      level: currentLevel,
      title: calculateTitle(currentLevel),
      lastXpGain: {
        amount,
        reason,
        timestamp: new Date()
      }
    };

    await updateDoc(userRef, updates);

    // Record XP history
    const historyRef = doc(db, 'xpHistory', `${userId}_${Date.now()}`);
    await setDoc(historyRef, {
      userId,
      amount,
      reason,
      timestamp: new Date(),
      levelUp: leveledUp
    });

    return {
      ...updates,
      leveledUp,
      nextLevelXp: calculateNextLevelXp(currentLevel)
    };
  },

  async getWeeklyLeaderboard() {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Implement weekly leaderboard logic
    // This is a placeholder that would need to be implemented with proper Firebase queries
    return [];
  },

  async getDailyQuests(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const questRef = doc(db, 'dailyQuests', `${userId}_${today}`);
    
    try {
      const docSnap = await getDoc(questRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }

      // Generate new daily quests
      const newQuests = [
        {
          id: 'use_3_tools',
          title: 'Tool Explorer',
          description: 'Use 3 different tools today',
          reward: 500,
          progress: 0,
          target: 3,
          completed: false
        },
        {
          id: 'session_time',
          title: 'Dedicated Learner',
          description: 'Spend 30 minutes using tools',
          reward: 300,
          progress: 0,
          target: 1800, // 30 minutes in seconds
          completed: false
        },
        {
          id: 'share_result',
          title: 'Knowledge Sharer',
          description: 'Share one tool result with others',
          reward: 200,
          progress: 0,
          target: 1,
          completed: false
        }
      ];

      await setDoc(questRef, { quests: newQuests, date: today });
      return { quests: newQuests, date: today };
    } catch (error) {
      console.error('Error getting daily quests:', error);
      return null;
    }
  }
};
