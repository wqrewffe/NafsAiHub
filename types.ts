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

export interface Tool {
  id: string;
  name:string;
  description: string;
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string }>;
  component?: React.ComponentType;
  promptSuggestion?: string;
  renderOutput?: (output: any) => React.ReactNode;
  path?: string;
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

export interface Todo {
    id: string;
    text: string;
    completed: boolean;
    priority: Priority;
    dueDate: string | null;
    createdAt: Date;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    lastModified: number;
}