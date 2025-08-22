import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export interface ToolMastery {
  toolId: string;
  userId: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  skillPoints: number;
  unlockedFeatures: string[];
  masteryBadges: string[];
  usageStreak: number;
  lastUsed: Date;
}

const MASTERY_LEVELS = {
  1: { name: 'Beginner', xpRequired: 0 },
  2: { name: 'Apprentice', xpRequired: 100 },
  3: { name: 'Practitioner', xpRequired: 300 },
  4: { name: 'Expert', xpRequired: 600 },
  5: { name: 'Master', xpRequired: 1000 },
  6: { name: 'Grandmaster', xpRequired: 2000 },
  7: { name: 'Legendary', xpRequired: 4000 }
};

const FEATURE_UNLOCKS = {
  2: ['preset_save'],
  3: ['advanced_options', 'batch_processing'],
  4: ['custom_templates', 'sharing'],
  5: ['api_access', 'automation'],
  6: ['mentorship_ability', 'custom_plugins'],
  7: ['beta_features', 'community_challenges']
};

export const masteryService = {
  async getToolMastery(userId: string, toolId: string): Promise<ToolMastery> {
    const masteryRef = doc(db, 'toolMastery', `${userId}_${toolId}`);
    const docSnap = await getDoc(masteryRef);
    
    if (!docSnap.exists()) {
      const defaultMastery: ToolMastery = {
        toolId,
        userId,
        level: 1,
        currentXp: 0,
        nextLevelXp: 100,
        skillPoints: 0,
        unlockedFeatures: [],
        masteryBadges: [],
        usageStreak: 0,
        lastUsed: new Date()
      };
      await setDoc(masteryRef, defaultMastery);
      return defaultMastery;
    }
    
    return docSnap.data() as ToolMastery;
  },

  async awardToolXp(userId: string, toolId: string, xpAmount: number, reason: string): Promise<{
    newLevel: number;
    newFeatures: string[];
    totalXp: number;
  }> {
    const masteryRef = doc(db, 'toolMastery', `${userId}_${toolId}`);
    const currentMastery = await this.getToolMastery(userId, toolId);
    
    let newXp = currentMastery.currentXp + xpAmount;
    let newLevel = currentMastery.level;
    const newFeatures: string[] = [];
    
    // Check for level ups
    while (newXp >= currentMastery.nextLevelXp && newLevel < 7) {
      newLevel++;
      
      // Award skill points and unlock features
      if (FEATURE_UNLOCKS[newLevel as keyof typeof FEATURE_UNLOCKS]) {
        newFeatures.push(...FEATURE_UNLOCKS[newLevel as keyof typeof FEATURE_UNLOCKS]);
      }
    }

    const updates = {
      currentXp: newXp,
      level: newLevel,
      nextLevelXp: MASTERY_LEVELS[(newLevel + 1) as keyof typeof MASTERY_LEVELS]?.xpRequired || Infinity,
      unlockedFeatures: [...currentMastery.unlockedFeatures, ...newFeatures],
      skillPoints: currentMastery.skillPoints + (newLevel - currentMastery.level),
      lastUsed: new Date()
    };

    await updateDoc(masteryRef, updates);

    // Record mastery progress
    const progressRef = doc(db, 'masteryProgress', `${userId}_${toolId}_${Date.now()}`);
    await setDoc(progressRef, {
      userId,
      toolId,
      xpGained: xpAmount,
      reason,
      timestamp: new Date(),
      newLevel,
      newFeatures
    });

    return {
      newLevel,
      newFeatures,
      totalXp: newXp
    };
  },

  async updateUsageStreak(userId: string, toolId: string): Promise<{
    newStreak: number;
    bonusXp: number;
  }> {
    const masteryRef = doc(db, 'toolMastery', `${userId}_${toolId}`);
    const currentMastery = await this.getToolMastery(userId, toolId);
    
    const lastUsed = currentMastery.lastUsed.toDate();
    const now = new Date();
    const daysSinceLastUse = Math.floor((now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    
    let newStreak = currentMastery.usageStreak;
    let bonusXp = 0;

    if (daysSinceLastUse === 1) {
      // Consecutive day use
      newStreak++;
      bonusXp = Math.floor(10 * Math.pow(1.1, newStreak)); // Exponential bonus
    } else if (daysSinceLastUse > 1) {
      // Streak broken
      newStreak = 1;
    }

    await updateDoc(masteryRef, {
      usageStreak: newStreak,
      lastUsed: now
    });

    if (bonusXp > 0) {
      await this.awardToolXp(userId, toolId, bonusXp, 'Daily streak bonus');
    }

    return {
      newStreak,
      bonusXp
    };
  }
};
