import React from 'react';
import { Badge } from '../types';

interface BadgesDisplayProps {
    badges: Badge[];
    level: string;
    nextLevelPoints: number;
}

export const BadgesDisplay: React.FC<BadgesDisplayProps> = ({ badges, level, nextLevelPoints }) => {
    return (
        <div className="space-y-6">
            {/* Level Display */}
            <div className="bg-secondary p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Current Level</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-2xl font-bold text-primary">{level}</span>
                        {nextLevelPoints > 0 && (
                            <p className="text-sm text-slate-400 mt-1">
                                {nextLevelPoints} more referrals to next level
                            </p>
                        )}
                    </div>
                    <div className="text-4xl">
                        {level === 'Bronze' && '🥉'}
                        {level === 'Silver' && '🥈'}
                        {level === 'Gold' && '🥇'}
                        {level === 'Platinum' && '💎'}
                        {level === 'Diamond' && '💠'}
                        {level === 'Master' && '👑'}
                        {level === 'Grandmaster' && '⭐'}
                    </div>
                </div>
            </div>

            {/* Badges Display */}
            {badges.length > 0 && (
                <div className="bg-secondary p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Achievement Badges</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {badges.map((badge, index) => (
                            <div
                                key={index}
                                className="bg-gray-700 p-4 rounded-lg text-center hover:bg-gray-600 transition-colors"
                            >
                                <img 
                                    src={badge.imageUrl} 
                                    alt={badge.name}
                                    className="w-16 h-16 mx-auto mb-2"
                                />
                                <h3 className="font-semibold mb-1">{badge.name}</h3>
                                <p className="text-sm text-slate-400">{badge.description}</p>
                                <p className="text-xs text-slate-500 mt-2">
                                    Unlocked: {new Date(badge.unlockedAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
