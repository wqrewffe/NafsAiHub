import { Badge, BadgeType } from '../types';

const BADGES: Partial<Record<BadgeType, Omit<Badge, 'unlockedAt'>>> = {
  // Streak Badges
  'DailyExplorer': {
    type: 'DailyExplorer',
    name: 'Daily Explorer',
    description: 'Used AI tools for 5 consecutive days',
    imageUrl: '/badges/daily-explorer.svg'
  },
  'WeeklyChampion': {
    type: 'WeeklyChampion',
    name: 'Weekly Champion',
    description: 'Engaged with AI tools every day for a week',
    imageUrl: '/badges/weekly-champion.svg'
  },
  'ConsistentLearner': {
    type: 'ConsistentLearner',
    name: 'Consistent Learner',
    description: 'Demonstrated dedication by using tools daily for a month',
    imageUrl: '/badges/consistent-learner.svg'
  },
  'AIDevotee': {
    type: 'AIDevotee',
    name: 'AI Devotee',
    description: 'Maintained a remarkable 90-day streak of daily AI tool usage',
    imageUrl: '/badges/ai-devotee.svg'
  },
  // Regular Badges
  'Newcomer': {
    type: 'Newcomer',
    name: 'Newcomer',
    description: 'Welcome to the community!',
    imageUrl: '/badges/newcomer.svg'
  },
  'Influencer': {
    type: 'Influencer',
    name: 'Rising Influencer',
    description: 'Successfully referred 5 users',
    imageUrl: '/badges/influencer.svg'
  },
  'NetworkMaster': {
    type: 'NetworkMaster',
    name: 'Network Master',
    description: 'Successfully referred 10 users',
    imageUrl: '/badges/network-master.svg'
  },
  'CommunityLeader': {
    type: 'CommunityLeader',
    name: 'Community Leader',
    description: 'Successfully referred 25 users',
    imageUrl: '/badges/community-leader.svg'
  },
  'ReferralLegend': {
    type: 'ReferralLegend',
    name: 'Referral Legend',
    description: 'Successfully referred 50 users',
    imageUrl: '/badges/referral-legend.svg'
  },
  'SuperConnector': {
    type: 'SuperConnector',
    name: 'Super Connector',
    description: 'Successfully referred 100 users',
    imageUrl: '/badges/super-connector.svg'
  },
  'Ultimate Networker': {
    type: 'Ultimate Networker',
    name: 'Ultimate Networker',
    description: 'Successfully referred 200 users',
    imageUrl: '/badges/ultimate-networker.svg'
  }
};

const LEVELS = [
  { name: 'Bronze', minReferrals: 0 },
  { name: 'Silver', minReferrals: 5 },
  { name: 'Gold', minReferrals: 15 },
  { name: 'Platinum', minReferrals: 30 },
  { name: 'Diamond', minReferrals: 50 },
  { name: 'Master', minReferrals: 100 },
  { name: 'Grandmaster', minReferrals: 200 }
];

const STREAK_BADGES = [
  { type: 'DailyExplorer', days: 5 },
  { type: 'WeeklyChampion', days: 7 },
  { type: 'ConsistentLearner', days: 30 },
  { type: 'AIDevotee', days: 90 }
] as const;

export function calculateLevel(referralsCount: number) {
  // Find the highest level that the user qualifies for
  const currentLevel = [...LEVELS]
    .reverse()
    .find(level => referralsCount >= level.minReferrals);

  // Find the next level
  const currentLevelIndex = LEVELS.findIndex(level => level.name === currentLevel?.name);
  const nextLevel = LEVELS[currentLevelIndex + 1];

  return {
    currentLevel: currentLevel?.name || 'Bronze',
    nextLevelPoints: nextLevel ? nextLevel.minReferrals - referralsCount : 0
  };
}

export function calculateBadges(referralsCount: number): Badge[] {
  const badges: Badge[] = [];
  const now = new Date().toISOString();

  if (referralsCount >= 0) badges.push({ ...BADGES['Newcomer'], unlockedAt: now });
  if (referralsCount >= 5) badges.push({ ...BADGES['Influencer'], unlockedAt: now });
  if (referralsCount >= 10) badges.push({ ...BADGES['NetworkMaster'], unlockedAt: now });
  if (referralsCount >= 25) badges.push({ ...BADGES['CommunityLeader'], unlockedAt: now });
  if (referralsCount >= 50) badges.push({ ...BADGES['ReferralLegend'], unlockedAt: now });
  if (referralsCount >= 100) badges.push({ ...BADGES['SuperConnector'], unlockedAt: now });
  if (referralsCount >= 200) badges.push({ ...BADGES['Ultimate Networker'], unlockedAt: now });

  return badges;
}

import { db } from '../firebase/config';

export const checkAndAwardStreakBadges = async (userId: string, currentStreak: number): Promise<Badge[]> => {
  const userBadgesRef = db.collection('users').doc(userId).collection('badges');
  const userBadgesSnapshot = await userBadgesRef.where('type', 'in', STREAK_BADGES.map(b => b.type)).get();
  const existingBadgeTypes = new Set(userBadgesSnapshot.docs.map(doc => doc.data().type));
  
  const newBadges: Badge[] = [];
  const now = new Date().toISOString();

  // Check each streak badge in order
  for (const { type, days } of STREAK_BADGES) {
    if (currentStreak >= days && !existingBadgeTypes.has(type)) {
      const badgeTemplate = BADGES[type];
      if (badgeTemplate) {
        const newBadge: Badge = {
          ...badgeTemplate,
          unlockedAt: now
        };
        
        // Add the badge to Firestore
        await userBadgesRef.add(newBadge);
        newBadges.push(newBadge);
      }
    }
  }

  return newBadges;
};

export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  if (!userId) return [];

  try {
    const badgesSnapshot = await db.collection('users')
      .doc(userId)
      .collection('badges')
      .get();

    return badgesSnapshot.docs.map(doc => doc.data() as Badge);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
};

export const createBadge = (type: BadgeType, unlockedAt: string): Badge | null => {
  const template = BADGES[type];
  if (!template) return null;

  return {
    ...template,
    unlockedAt
  };
};
