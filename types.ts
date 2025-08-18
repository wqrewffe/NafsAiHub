import firebase from 'firebase/compat/app';
import React from 'react';

export interface User extends firebase.User {}

export interface FirestoreUser {
  id: string;
  displayName: string | null;
  email: string | null;
  createdAt: firebase.firestore.Timestamp;
  totalUsage?: number;
  password?: string;
}

export type ToolCategory = 'High School' | 'Medical' | 'Programming' | 'General' | 'Games & Entertainment' | 'GameDev' | 'Robotics & AI' | 'Productivity';

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
  renderOutput?: (output: any) => React.ReactNode;
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