import React, { useEffect, useState } from 'react';
import { getLeaderboard, LeaderboardUser } from '../services/leaderboardService';

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
                return '�';
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
        <div className="bg-secondary rounded-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                <p className="text-slate-400">{subtitle}</p>
            </div>
            <div className="p-4 border-b border-gray-700 grid grid-cols-12 gap-4 font-semibold text-sm">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">User</div>
                <div className="col-span-2">Level</div>
                <div className="col-span-2">{pointsLabel}</div>
                <div className="col-span-3">Badges</div>
            </div>
            <div className="divide-y divide-gray-700">
                {users.map((user, index) => (
                    <div key={user.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-700 transition-colors">
                        <div className="col-span-1 font-semibold">
                            {getLeaderboardIcon(index)}
                        </div>
                        <div className="col-span-4 font-medium">{user.displayName}</div>
                        <div className="col-span-2">
                            <span className="flex items-center gap-2">
                                {getLevelIcon(user.level)}
                                {user.level}
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
                ))}
            </div>
        </div>
    );
};

const LeaderboardPage: React.FC = () => {
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
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Global Leaderboards</h1>
            
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
    );
};

export default LeaderboardPage;
