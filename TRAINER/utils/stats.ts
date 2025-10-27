import { GameStats } from '../types';

export const calculateStats = (
    reactionTimes: number[], 
    hits: number, 
    misses: number, 
    durationInSeconds?: number,
    baseScorePerHit: number = 10,
): GameStats => {
    if (reactionTimes.length === 0) {
        return { 
            totalHits: hits, 
            totalMisses: misses, 
            accuracy: hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0,
            avgReactionTime: 0, 
            fastestReactionTime: 0, 
            slowestReactionTime: 0, 
            consistency: 0, 
            finalScore: hits * baseScorePerHit - misses * baseScorePerHit,
            reactionTimes: [],
            ...(durationInSeconds && { hitsPerSecond: 0 })
        };
    }

    const totalHits = hits;
    const totalMisses = misses;
    const accuracy = totalHits + totalMisses > 0 ? (totalHits / (totalHits + misses)) * 100 : 0;
    
    const sum = reactionTimes.reduce((a, b) => a + b, 0);
    const avgReactionTime = sum / reactionTimes.length;
    
    const fastestReactionTime = Math.min(...reactionTimes);
    const slowestReactionTime = Math.max(...reactionTimes);
    
    const hitsPerSecond = durationInSeconds ? totalHits / durationInSeconds : undefined;

    const mean = avgReactionTime;
    const stdDev = Math.sqrt(reactionTimes.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / reactionTimes.length);
    
    // Generic scoring algorithm, can be tweaked per game if needed
    // Factors: hits, accuracy, speed (inverse of avg time), consistency (inverse of std dev)
    const score = Math.round((totalHits * baseScorePerHit) + (accuracy * 2) - (avgReactionTime / 10) - stdDev);

    return {
        totalHits,
        totalMisses,
        accuracy,
        avgReactionTime,
        fastestReactionTime,
        slowestReactionTime,
        ...(durationInSeconds && { hitsPerSecond }),
        consistency: stdDev,
        finalScore: Math.max(0, score), // Score can't be negative
        reactionTimes,
    };
};
