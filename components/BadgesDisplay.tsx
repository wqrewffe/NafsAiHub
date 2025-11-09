import React from 'react';
import { Badge } from '../types';
import { TrophyIcon, SparklesIcon, FireIcon, CheckBadgeIcon } from '../tools/Icons';

interface BadgesDisplayProps {
    badges: (Badge | string)[];
    toolBadges?: Badge[];
    level?: string;
    referralLevel?: string;
    nextLevelPoints: number;
    toolLevel?: string;
    nextLevelTools?: number;
    totalUsage?: number;
    categoryBreakdown?: Record<string, number>;
    isOwnProfile?: boolean;
}

export const BadgesDisplay: React.FC<BadgesDisplayProps> = ({ 
    badges, 
    toolBadges = [], 
    level,
    referralLevel,
    nextLevelPoints,
    toolLevel,
    nextLevelTools = 0,
    totalUsage = 0,
    categoryBreakdown = {},
    isOwnProfile = false
}) => {
    const displayLevel = referralLevel || level || 'Bronze';
    // Helper function to get badge progress
    const getBadgeProgress = () => {
        const progress: Array<{ name: string; description: string; progress: number }> = [];
        
        // Daily Explorer progress (approximate)
        const dayStreak = Math.min(Math.floor(totalUsage / 5), 7);
        if (dayStreak < 5) {
            progress.push({
                name: 'Daily Explorer',
                description: `Use tools for 5 consecutive days (${dayStreak}/5)`,
                progress: (dayStreak / 5) * 100
            });
        }
        
        // AI Apprentice progress
        if (totalUsage < 8) {
            progress.push({
                name: 'AI Apprentice',
                description: `Use 8 different tools (${totalUsage}/8)`,
                progress: (totalUsage / 8) * 100
            });
        }
        
        // Category Expert progress
        Object.entries(categoryBreakdown).forEach(([category, count]) => {
            const countNum = typeof count === 'number' ? count : 0;
            if (countNum < 15) {
                progress.push({
                    name: `${category} Expert`,
                    description: `Use 15 ${category} tools (${countNum}/15)`,
                    progress: (countNum / 15) * 100
                });
            }
        });
        
        return progress;
    };

    const badgeProgress = getBadgeProgress();

    return (
        <div className="space-y-8">
            {/* Referral Level Display */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-slate-800/80 to-slate-700/60 p-6 shadow-lg shadow-primary/10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary" /> Referral Level
                    </h2>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <CheckBadgeIcon className="w-4 h-4" /> Achievements
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-2xl font-bold text-primary tracking-wide">{displayLevel}</span>
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

            {/* Tool Usage Level Display */}
            {toolLevel && (
                <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-900/50 to-indigo-900/40 p-6 shadow-lg shadow-cyan-500/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <TrophyIcon className="w-5 h-5 text-cyan-300" /> Tool Usage Level
                        </h2>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                            <FireIcon className="w-4 h-4" /> Progress
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-2xl font-bold text-cyan-300 tracking-wide">{toolLevel}</span>
                            <p className="text-sm text-slate-300/80 mt-1">
                                Total tools used: <span className="font-semibold text-white">{totalUsage}</span>
                            </p>
                            {nextLevelTools > 0 && (
                                <p className="text-sm text-slate-300/80">
                                    {nextLevelTools} more tools to next level
                                </p>
                            )}
                        </div>
                        <div className="text-4xl">
                            {toolLevel === 'Beginner' && '🌱'}
                            {toolLevel === 'Explorer' && '🔍'}
                            {toolLevel === 'Innovator' && '💡'}
                            {toolLevel === 'Specialist' && '🎯'}
                            {toolLevel === 'Expert' && '🏆'}
                            {toolLevel === 'Pioneer' && '🚀'}
                        </div>
                    </div>
                </div>
            )}

            {/* Badge Progress */}
            {badgeProgress.length > 0 && (
                <div className="rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-900/40 to-slate-800/40 p-6 shadow-lg shadow-emerald-500/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FireIcon className="w-5 h-5 text-emerald-300" /> Progress Towards Badges
                    </h2>
                    <div className="space-y-4">
                        {badgeProgress.slice(0, 5).map((item, index) => (
                            <div key={index} className="bg-gray-800/70 border border-emerald-400/10 rounded-lg p-4 hover:shadow-emerald-500/10 hover:shadow transition-shadow">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-semibold text-slate-100">{item.name}</h3>
                                    <span className="text-sm text-slate-300/80">
                                        {Math.round(item.progress)}%
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 mb-3">{item.description}</p>
                                <div className="w-full bg-gray-700/70 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-2 rounded-full transition-all duration-700"
                                        style={{ width: `${item.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Referral Badges Display */}
            {badges.length > 0 && (
                <div className="rounded-xl border border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-900/40 to-slate-800/40 p-6 shadow-lg shadow-fuchsia-500/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <CheckBadgeIcon className="w-5 h-5 text-fuchsia-300" /> Referral Achievement Badges
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {badges.map((badgeItem, index) => {
                            const badge = typeof badgeItem === 'string' ? {
                                type: badgeItem as any,
                                name: badgeItem,
                                description: '',
                                imageUrl: '/badges/default.png',
                                unlockedAt: new Date().toISOString()
                            } as Badge : badgeItem as Badge;
                            return (
                            <div
                                key={index}
                                className="group relative bg-gray-800/70 border border-fuchsia-400/10 p-4 rounded-lg text-center hover:shadow-fuchsia-500/10 hover:shadow transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                            >
                                <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img 
                                    src={badge.imageUrl} 
                                    alt={badge.name}
                                    className="w-16 h-16 mx-auto mb-2 drop-shadow"
                                />
                                <h3 className="font-semibold mb-1 text-slate-100">{badge.name}</h3>
                                <p className="text-sm text-slate-400">{badge.description}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Unlocked: <span className="text-slate-200">{new Date(badge.unlockedAt).toLocaleDateString()}</span>
                                </p>
                            </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tool Usage Badges Display */}
            {toolBadges.length > 0 && (
                <div className="rounded-xl border border-indigo-400/20 bg-gradient-to-r from-indigo-900/40 to-slate-800/40 p-6 shadow-lg shadow-indigo-500/10">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <TrophyIcon className="w-5 h-5 text-indigo-300" /> Tool Usage Achievement Badges
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {toolBadges.map((badge, index) => (
                            <div
                                key={index}
                                className="group relative bg-gray-800/70 border border-indigo-400/10 p-4 rounded-lg text-center hover:shadow-indigo-500/10 hover:shadow transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                            >
                                <div className="absolute inset-0 pointer-events-none rounded-lg bg-gradient-to-tr from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img 
                                    src={badge.imageUrl} 
                                    alt={badge.name}
                                    className="w-16 h-16 mx-auto mb-2 drop-shadow"
                                />
                                <h3 className="font-semibold mb-1 text-slate-100">{badge.name}</h3>
                                <p className="text-sm text-slate-400">{badge.description}</p>
                                <p className="text-xs text-slate-400 mt-2">
                                    Unlocked: <span className="text-slate-200">{new Date(badge.unlockedAt).toLocaleDateString()}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
