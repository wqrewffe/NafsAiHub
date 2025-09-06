import firebase from 'firebase/compat/app';
import React from 'react';

export interface User extends firebase.User {}

export type BadgeType = 
  // Referral Badges
  | 'Newcomer'           // 0 referrals
  | 'Influencer'         // 5 referrals
  | 'NetworkMaster'      // 10 referrals
  | 'CommunityLeader'    // 25 referrals
  | 'ReferralLegend'     // 50 referrals
  | 'SuperConnector'     // 100 referrals
  | 'Ultimate Networker'  // 200 referrals
  // Daily Usage Badges
  | 'DailyExplorer'      // 5 days streak
  | 'WeeklyChampion'     // 7 days streak
  | 'ConsistentLearner'  // 30 days streak
  | 'AIDevotee'          // 90 days streak
  // Category Expert Badges
  | 'GeneralExpert'      // 10 General tools
  | 'MedicalPro'         // 10 Medical tools
  | 'CodeMaster'         // 10 Programming tools
  | 'EduGenius'          // 10 Education tools
  | 'ArtisticAI'         // 10 Creative tools
  // Tool Count Badges
  | 'AIApprentice'       // 5 tools
  | 'ToolCollector'      // 15 tools
  | 'InnovationSeeker'   // 25 tools
  | 'AIVirtuoso'         // 40 tools
  | 'TechPioneer'        // 60 tools
  | 'AIVanguard'         // All tools
  // Achievement Badges
  | 'CategoryPioneer'    // First to complete category
  | 'ToolOptimizer'      // 50 uses of one tool
  | 'AIResearcher'      // Used all categories
  | 'InnovatorElite';    // Popular custom prompts

export interface Badge {
  type: BadgeType;
  name: string;
  description: string;
  imageUrl: string;
  unlockedAt: string; // ISO timestamp
}

export interface ReferralInfo {
  referralCode: string;
  referralsCount: number;
  referredBy?: string | null;
  rewards: number;
  badges: Badge[];
  toolBadges: Badge[];
  level: string;
  nextLevelPoints: number;
  referralHistory: Array<{
    referredUserId: string;
    referredUserEmail: string;
  timestamp: string | firebase.firestore.Timestamp; // ISO timestamp string or Firestore Timestamp
    rewardClaimed: boolean;
  }>;
}

export interface FirestoreUser {
  id: string;
  displayName: string | null;
  email: string | null;
  createdAt: firebase.firestore.Timestamp;
  uid?: string; // sometimes user records include uid instead of id
  role?: string;
  points?: number;
  totalUsage?: number;
  password?: string;
  isBlocked?: boolean;
  currentStreak?: number;
  longestStreak?: number;
  lastDailyUse?: string;
  referralInfo?: {
    referralCode: string;
    referralsCount: number;
    referredBy?: string;
    rewards: number;
    badges?: Badge[];
    toolBadges?: Badge[];
    level?: string;
    nextLevelPoints?: number;
    referralHistory: Array<{
      referredUserId: string;
      referredUserEmail: string;
  timestamp: firebase.firestore.Timestamp | string;
      rewardClaimed: boolean;
    }>;
  };
}

export type ToolCategory = 'High School' | 'Medical' | 'Programming' | 'General' | 'Games & Entertainment' | 'GameDev' | 'Robotics & AI' | 'Productivity' | 'Online' | 'Utility' | 'Trainer';

export interface TimeWindow {
  startHour: number; // 0-23
  endHour: number; // 0-23
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
}

export interface UsageQuota {
  dailyLimit: number;
  monthlyLimit: number;
  resetDay?: number; // Day of month when monthly quota resets (1-31)
}

export interface ToolSettings {
  isHidden: boolean;
  restrictedTo: string[]; // Array of user IDs who can access the tool
  usageQuota?: UsageQuota;
  accessSchedule?: TimeWindow[];
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string }>;
  component?: React.ComponentType;
  promptSuggestion?: string;
  renderOutput?: (output: any, onUpdateOutput?: (output: any) => void) => React.ReactNode;
  path?: string;
  settings?: ToolSettings;
}

export interface HistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  prompt: string;
  response: string;
  timestamp: Date;
}

export type Priority = 'low' | 'medium' | 'high';

export interface Subtask {
    id: string;
    text: string;
    completed: boolean;
}

export type RecurringInterval = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    priority: Priority;
    dueDate: string | null; // ISO string for date part
    createdAt: firebase.firestore.Timestamp;
    completedAt: firebase.firestore.Timestamp | null;
    subtasks: Subtask[];
    tags: string[];
    recurring: RecurringInterval;
}


export interface Note {
    id: string;
    title: string;
    content: string;
    lastModified: number;
}

export interface ToolOptionConfig {
  name: string;
  label: string;
  type: 'select' | 'number' | 'text';
  defaultValue: string | number;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface ImageFile {
  name: string;
  type: string;
  base64: string;
}
