
export enum GameState {
  Setup,
  GetReady,
  Waiting,
  React,
  Result,
  TooSoon,
}

// For GridReflexGame
export type GridGameState = 'setup' | 'countdown' | 'playing' | 'finished';

export interface GameStats {
  totalHits: number;
  totalMisses: number;
  accuracy: number;
  avgReactionTime: number;
  fastestReactionTime: number;
  slowestReactionTime: number;
  hitsPerSecond?: number;
  consistency: number; // Standard Deviation
  finalScore: number;
  reactionTimes: number[];
}