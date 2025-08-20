import { Badge, BadgeType } from '../types';

const BADGES: Partial<Record<BadgeType, Omit<Badge, 'unlockedAt'>>> = {
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
