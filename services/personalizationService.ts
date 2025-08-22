import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs, limit, arrayUnion } from 'firebase/firestore';
import { Tool } from '../types';
import { tools } from '../tools';

interface UserPreferences {
  favoriteTools: string[];
  preferredCategories: string[];
  customPresets: Record<string, any>;
  lastUsedTools: string[];
  interests: string[];
}

interface ToolRecommendation {
  toolId: string;
  score: number;
  reason: string;
}

export const personalizationService = {
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const userPrefRef = doc(db, 'userPreferences', userId);
    const docSnap = await getDoc(userPrefRef);
    
    if (!docSnap.exists()) {
      const defaultPreferences: UserPreferences = {
        favoriteTools: [],
        preferredCategories: [],
        customPresets: {},
        lastUsedTools: [],
        interests: []
      };
      await setDoc(userPrefRef, defaultPreferences);
      return defaultPreferences;
    }
    
    return docSnap.data() as UserPreferences;
  },

  async updateLastUsedTool(userId: string, toolId: string) {
    const userPrefRef = doc(db, 'userPreferences', userId);
    await updateDoc(userPrefRef, {
      lastUsedTools: arrayUnion(toolId)
    });
  },

  async getPersonalizedRecommendations(userId: string): Promise<ToolRecommendation[]> {
    const prefs = await this.getUserPreferences(userId);
    const recommendations: ToolRecommendation[] = [];
    
    // Get user's tool usage patterns
    const usageRef = collection(db, 'toolUsage');
    const userUsageQuery = query(
      usageRef,
      where('userId', '==', userId),
      limit(50)
    );
    const usageSnap = await getDocs(userUsageQuery);
    const toolUsage = new Map();
    usageSnap.forEach(doc => {
      const data = doc.data();
      toolUsage.set(data.toolId, (toolUsage.get(data.toolId) || 0) + 1);
    });

    // Calculate recommendations based on multiple factors
    for (const tool of tools) {
      let score = 0;
      let reasons: string[] = [];

      // Category preference
      if (prefs.preferredCategories.includes(tool.category)) {
        score += 30;
        reasons.push('Matches your preferred category');
      }

      // Similar to frequently used tools
      const similarTools = prefs.lastUsedTools.filter(usedTool => {
        const usedToolObj = tools.find(t => t.id === usedTool);
        return usedToolObj && usedToolObj.category === tool.category;
      });
      if (similarTools.length > 0) {
        score += 20 * similarTools.length;
        reasons.push('Similar to tools you\'ve used');
      }

      // Interest matching
      const toolKeywords = [...tool.category.split(' '), ...tool.description.split(' ')]
        .map(word => word.toLowerCase());
      const matchingInterests = prefs.interests.filter(interest =>
        toolKeywords.includes(interest.toLowerCase())
      );
      if (matchingInterests.length > 0) {
        score += 15 * matchingInterests.length;
        reasons.push('Matches your interests');
      }

      // Fresh content (tools not used recently)
      if (!prefs.lastUsedTools.includes(tool.id)) {
        score += 10;
        reasons.push('New tool to explore');
      }

      if (score > 0) {
        recommendations.push({
          toolId: tool.id,
          score,
          reason: reasons[0] // Use the strongest reason
        });
      }
    }

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  },

  async saveCustomPreset(userId: string, toolId: string, presetName: string, presetData: any) {
    const userPrefRef = doc(db, 'userPreferences', userId);
    await updateDoc(userPrefRef, {
      [`customPresets.${toolId}.${presetName}`]: {
        ...presetData,
        createdAt: new Date()
      }
    });
  },

  async updateInterests(userId: string, interests: string[]) {
    const userPrefRef = doc(db, 'userPreferences', userId);
    await updateDoc(userPrefRef, { interests });
  }
};
