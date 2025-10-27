import React, { useEffect, useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { getLeaderboard, LeaderboardUser } from '../services/leaderboardService';
import UserProfileLink from '../components/UserProfileLink';

const LeaderboardSection: React.FC<{
    title: string;
    subtitle: string;
    users: LeaderboardUser[];
    pointsLabel: string;
}> = ({ title, subtitle, users, pointsLabel }) => {
    const getLeaderboardIcon = (index: number) => {
        switch (index) {
            case 0:
                return '👑';
            case 1:
                return '🥈';
            case 2:
                return '🥉';
            default:
                return `#${index + 1}`;
        }
    };

    const getLevelIcon = (level: string) => {
        // Tool usage levels
        switch (level) {
            case 'Novice':
                return '🌱';
            case 'Apprentice':
                return '⚡';
            case 'Adept':
                return '🌟';
            case 'Expert':
                return '💫';
            case 'Master':
                return '👑';
            case 'Legendary':
                return '🌈';
            // Referral levels
            case 'Bronze':
                return '🥉';
            case 'Silver':
                return '🥈';
            case 'Gold':
                return '🥇';
            case 'Platinum':
                return '💎';
            case 'Diamond':
                return '💠';
            default:
                return '🌱';
        }
    };

    return (
        <div className="bg-secondary rounded-lg overflow-hidden mb-4 sm:mb-8">
            <div className="p-4 sm:p-6 border-b border-gray-700">
                <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{title}</h2>
                <p className="text-slate-400 text-sm sm:text-base">{subtitle}</p>
            </div>
            {/* Header - Hidden on mobile, visible on tablet and up */}
            <div className="hidden sm:grid p-4 border-b border-gray-700 grid-cols-12 gap-2 sm:gap-4 font-semibold text-sm">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">User</div>
                <div className="col-span-2">Level</div>
                <div className="col-span-2">{pointsLabel}</div>
                <div className="col-span-3">Badges</div>
            </div>
            <div className="divide-y divide-gray-700">
                {users.map((user, index) => (
                    <div key={user.id} className="p-3 sm:p-4 hover:bg-gray-700 transition-colors">
                        {/* Mobile layout */}
                        <div className="sm:hidden flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{getLeaderboardIcon(index)}</span>
                                    <UserProfileLink 
                                        displayName={user.displayName}
                                        uid={user.id}
                                        className="font-medium truncate max-w-[150px] text-light hover:text-primary-light"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{user.points.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1">
                                    {getLevelIcon(user.level)}
                                    <span className="truncate max-w-[100px]">{user.level}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-base sm:text-lg">🏆</span>
                                    <span>{user.badges.length}</span>
                                    <div className="flex -space-x-1 sm:-space-x-2 overflow-hidden">
                                        {user.badges.slice(0, 2).map((badge, i) => (
                                            <img
                                                key={i}
                                                src={badge.imageUrl}
                                                alt={badge.name}
                                                title={badge.name}
                                                className="inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-1 sm:ring-2 ring-black"
                                            />
                                        ))}
                                        {user.badges.length > 2 && (
                                            <span className="inline-flex items-center justify-center h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-700 ring-1 sm:ring-2 ring-black text-xs">
                                                +{user.badges.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {user.nextLevelRequirement > 0 && (
                                <span className="text-xs text-slate-400">
                                    {user.nextLevelRequirement} more to next level
                                </span>
                            )}
                        </div>
                        {/* Desktop/Tablet layout */}
                        <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1 font-semibold">
                                {getLeaderboardIcon(index)}
                            </div>
                            <div className="col-span-4">
                                <UserProfileLink 
                                    displayName={user.displayName}
                                    uid={user.id}
                                    className="font-medium truncate block text-light hover:text-primary-light"
                                />
                            </div>
                            <div className="col-span-2">
                                <span className="flex items-center gap-2">
                                    {getLevelIcon(user.level)}
                                    <span className="truncate">{user.level}</span>
                                </span>
                            </div>
                            <div className="col-span-2">
                                <div className="flex flex-col">
                                    <span>{user.points.toLocaleString()}</span>
                                    {user.nextLevelRequirement > 0 && (
                                        <span className="text-xs text-slate-400">
                                            {user.nextLevelRequirement} more to next level
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🏆</span>
                                    <span>{user.badges.length}</span>
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {user.badges.slice(0, 3).map((badge, i) => (
                                            <img
                                                key={i}
                                                src={badge.imageUrl}
                                                alt={badge.name}
                                                title={badge.name}
                                                className="inline-block h-6 w-6 rounded-full ring-2 ring-black"
                                            />
                                        ))}
                                        {user.badges.length > 3 && (
                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-700 ring-2 ring-black text-xs">
                                                +{user.badges.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LeaderboardPage: React.FC = () => {
    const { authSettings } = useSettings();
    const [referralLeaderboard, setReferralLeaderboard] = useState<LeaderboardUser[]>([]);
    const [toolUsageLeaderboard, setToolUsageLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await getLeaderboard();
                setReferralLeaderboard(data.referralLeaderboard);
                setToolUsageLeaderboard(data.toolUsageLeaderboard);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getLeaderboardIcon = (index: number) => {
        switch (index) {
            case 0:
                return '👑';
            case 1:
                return '🥈';
            case 2:
                return '🥉';
            default:
                return `#${index + 1}`;
        }
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'Bronze':
                return '🥉';
            case 'Silver':
                return '🥈';
            case 'Gold':
                return '🥇';
            case 'Platinum':
                return '💎';
            case 'Diamond':
                return '💠';
            case 'Master':
                return '👑';
            case 'Grandmaster':
                return '⭐';
            default:
                return '🥉';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (authSettings.featureFlags?.hideLeaderboard) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">Leaderboards</h1>
                <p className="text-light/80 text-sm sm:text-base">This section is currently unavailable.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Global Leaderboards</h1>
            
            <div className="space-y-4 sm:space-y-8">
                <LeaderboardSection
                    title="Referral Champions"
                    subtitle="Top 10 users ranked by referral points and badges earned"
                    users={referralLeaderboard}
                    pointsLabel="Points"
                />

                <LeaderboardSection
                    title="Most Active Users"
                    subtitle="Top 10 users ranked by number of tools used"
                    users={toolUsageLeaderboard}
                    pointsLabel="Tools Used"
                />
            </div>
        </div>
    );
};

export default LeaderboardPage;
