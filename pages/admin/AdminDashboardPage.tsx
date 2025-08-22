import React, {
    useState,
    useEffect,
    useMemo,
    useCallback
} from 'react';
import { Link } from 'react-router-dom';
import {
    getAllUsers,
    getDashboardStats,
    getTopUsedToolsGlobal,
    getRecentActivity,
    DashboardStats,
    GlobalHistoryItem,
    updateAuthSettings,
    deleteUser,
    toggleUserBlock
} from '../../services/firebaseService';
import {
    FirestoreUser,
    ToolCategory
} from '../../types';
import PointsManagement from '../../components/admin/PointsManagement';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import NotificationControl from '../../components/admin/NotificationControl';
import {
    UsersIcon,
    UserPlusIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { useSettings } from '../../hooks/useSettings';
import { useCongratulations } from '../../hooks/CongratulationsProvider';

const USERS_PER_PAGE = 10;

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
    const [topUsers, setTopUsers] = useState<FirestoreUser[]>([]);
    const [topTools, setTopTools] = useState<{ toolId: string; toolName: string; useCount: number; category: ToolCategory }[]>([]);
    const [toolCategories, setToolCategories] = useState<{ name: ToolCategory; count: number }[]>([]);
    const [recentActivity, setRecentActivity] = useState<GlobalHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionType, setActionType] = useState<'delete' | 'block' | 'unblock' | null>(null);

    const { authSettings, loading: settingsLoading } = useSettings();
    const { showCongratulations } = useCongratulations();

    const usersMap = useMemo(() => new Map(allUsers.map(user => [user.id, user])), [allUsers]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const [statsData, allUsersData, topUsersData, allToolsData, activityData] = await Promise.all([
                getDashboardStats(),
                getAllUsers(),
                getAllUsers('totalUsage', 'desc', 5),
                getTopUsedToolsGlobal(),
                getRecentActivity(5),
            ]);

            setStats(statsData);
            setAllUsers(allUsersData);
            setTopUsers(topUsersData);
            setTopTools(allToolsData.slice(0, 5));
            setRecentActivity(activityData);

            const categoryCounts = allToolsData.reduce((acc, tool) => {
                acc[tool.category] = (acc[tool.category] || 0) + tool.useCount;
                return acc;
            }, {} as Record<ToolCategory, number>);

            const sortedCategories = (Object.entries(categoryCounts) as [ToolCategory, number][])
                .sort(([, a], [, b]) => b - a)
                .map(([name, count]) => ({
                    name,
                    count
                }));
            setToolCategories(sortedCategories);
        } catch (err) {
            setError('Failed to fetch dashboard data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleConfirmAction = async () => {
        if (!selectedUser?.id || !actionType) {
            setError('Invalid user selection');
            return;
        }

        try {
            if (actionType === 'delete') {
                const userExists = allUsers.some(u => u.id === selectedUser.id);
                if (!userExists) {
                    setError('User not found');
                    return;
                }
                await deleteUser(selectedUser.id);
                setAllUsers(allUsers.filter(u => u.id !== selectedUser.id));
                showCongratulations('points', {
                    message: 'User deleted successfully',
                    points: 0
                });
            } else if (actionType === 'block' || actionType === 'unblock') {
                await toggleUserBlock(selectedUser.id, actionType === 'block');
                setAllUsers(allUsers.map(u =>
                    u.id === selectedUser.id ?
                    { ...u,
                        isBlocked: actionType === 'block'
                    } :
                    u
                ));
                showCongratulations('points', {
                    message: `User ${actionType === 'block' ? 'blocked' : 'unblocked'} successfully`,
                    points: 0
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to ${actionType} user`;
            setError(errorMessage);
            console.error(err);
        } finally {
            setShowConfirmModal(false);
            setSelectedUser(null);
            setActionType(null);
        }
    };

    const confirmAction = (user: FirestoreUser, action: 'delete' | 'block' | 'unblock') => {
        setSelectedUser(user);
        setActionType(action);
        setShowConfirmModal(true);
    };

    const filteredUsers = useMemo(() => {
        return allUsers.filter(user =>
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allUsers, searchTerm]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * USERS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

    const handleGoogleAuthToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            await updateAuthSettings({ isGoogleAuthDisabled: e.target.checked });
        } catch (err) {
            console.error("Failed to update auth settings", err);
            alert("Failed to update settings.");
        }
    };

    const handleFeatureFlagToggle = async (key: string, enabled: boolean) => {
        try {
            const currentFlags = authSettings?.featureFlags || {};
            await updateAuthSettings({
                featureFlags: {
                    ...currentFlags,
                    [key]: enabled
                }
            });
        } catch (err) {
            console.error('Failed to update feature flag', err);
            alert('Failed to update settings.');
        }
    };

    const DashboardSection: React.FC<{
        title: string;
        children: React.ReactNode;
        className?: string
    }> = ({
        title,
        children,
        className
    }) => (
        <div className={`bg-secondary p-4 sm:p-6 rounded-lg ${className}`}>
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            {children}
        </div>
    );

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }
    if (error) {
        return <p className="text-red-400 text-center">{error}</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-slate-400 mt-1">Welcome back, Admin!</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={UsersIcon} title="Total Users" value={stats?.totalUsers ?? 0} loading={loading} />
                <StatCard icon={ChartBarIcon} title="Total Tool Usages" value={stats?.totalUsage ?? 0} loading={loading} />
                <StatCard icon={UserPlusIcon} title="New Users (7 Days)" value={stats?.newUsers7Days ?? 0} loading={loading} />
                <StatCard icon={ArrowTrendingUpIcon} title="New Users (30 Days)" value={stats?.newUsers30Days ?? 0} loading={loading} />
            </div>

            <DashboardSection title="Authentication Settings">
                <div className="flex items-center justify-between p-3 bg-primary rounded-md">
                    <div className="flex-grow pr-4">
                        <label htmlFor="google-auth-toggle" className="text-sm text-light cursor-pointer">
                            Disable Google Sign-In/Sign-Up
                        </label>
                        <p className="text-xs text-slate-400">If disabled, users will not see the 'Sign in with Google' button.</p>
                    </div>
                    <label htmlFor="google-auth-toggle" className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                id="google-auth-toggle"
                                className="sr-only peer"
                                checked={!settingsLoading && !!authSettings?.isGoogleAuthDisabled}
                                onChange={handleGoogleAuthToggle}
                                disabled={settingsLoading}
                            />
                            <div className="block bg-slate-600 w-14 h-8 rounded-full peer-checked:bg-accent transition"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition peer-checked:translate-x-6"></div>
                        </div>
                    </label>
                </div>
            </DashboardSection>

            <DashboardSection title="Feature Visibility">
                <div className="space-y-3">
                    {[
                        { key: 'hideLeaderboard', label: 'Hide Leaderboard page', description: 'Toggles visibility for all users.' },
                        { key: 'hideSupportAdditionalResources', label: 'Hide Support - Additional Resources', description: 'Toggles the Additional Resources block on Support page.' },
                        { key: 'hideNavbarLeaderboard', label: 'Hide Navbar - Leaderboard' },
                        { key: 'hideNavbarBadges', label: 'Hide Navbar - Badges' },
                        { key: 'hideNavbarReferral', label: 'Hide Navbar - Referral' },
                        { key: 'hideNavbarSupport', label: 'Hide Navbar - Support' },
                        { key: 'hideNavbarContact', label: 'Hide Navbar - Contact' },
                        { key: 'hideSupportQuickEmail', label: 'Hide Support - Quick Email card' },
                        { key: 'hideSupportQuickChat', label: 'Hide Support - Quick Chat card' },
                        { key: 'hideSupportQuickDocs', label: 'Hide Support - Quick Docs card' },
                        { key: 'hideSupportFAQGeneral', label: 'Hide Support - FAQ General' },
                        { key: 'hideSupportFAQAiTools', label: 'Hide Support - FAQ AI Tools' },
                        { key: 'hideSupportFAQReferral', label: 'Hide Support - FAQ Referral' },
                        { key: 'hideSupportFAQTechnical', label: 'Hide Support - FAQ Technical' },
                        { key: 'hideBadgesReferralSection', label: 'Hide Badges - Referral Section' },
                        { key: 'hideBadgesToolUsageSection', label: 'Hide Badges - Tool Usage Section' },
                        { key: 'hideBadgesUnlockedSection', label: 'Hide Badges - Unlocked Section' },
                        { key: 'hideContactAdditionalMethods', label: 'Hide Contact - Additional Methods' },
                        { key: 'hideContactResponseTimes', label: 'Hide Contact - Response Times' },
                    ].map(f => (
                        <div key={f.key} className="flex items-center justify-between p-3 bg-primary rounded-md">
                            <div className="flex-grow pr-4">
                                <label htmlFor={f.key} className="text-sm text-light cursor-pointer">{f.label}</label>
                                {f.description && <p className="text-xs text-slate-400">{f.description}</p>}
                            </div>
                            <label htmlFor={f.key} className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id={f.key}
                                        className="sr-only peer"
                                        checked={!settingsLoading && !!(authSettings?.featureFlags as Record<string, boolean>)?.[f.key]}
                                        onChange={(e) => handleFeatureFlagToggle(f.key, e.target.checked)}
                                        disabled={settingsLoading}
                                    />
                                    <div className="block bg-slate-600 w-14 h-8 rounded-full peer-checked:bg-accent transition"></div>
                                    <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition peer-checked:translate-x-6"></div>
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
            </DashboardSection>

            <DashboardSection title="Test Congratulations System">
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                        Test the congratulations modal system with different achievement types:
                    </p>
                    <div className="flex flex-wrap gap-3">
                         <button onClick={() => showCongratulations('points', { points: 100, message: 'You earned 100 points!' })} className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-md text-sm">Test +100 Points</button>
                         <button onClick={() => showCongratulations('levelUp', { level: 5 })} className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-md text-sm">Test Level Up (Lv 5)</button>
                         <button onClick={() => showCongratulations('badge', { badgeName: 'Power User' })} className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-md text-sm">Test Badge Earned</button>
                    </div>
                </div>
            </DashboardSection>

            <DashboardSection title="User Management">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 mb-4 rounded-md bg-primary border border-slate-600 focus:ring-2 focus:ring-accent focus:outline-none"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-primary/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Usage</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-secondary divide-y divide-slate-700">
                            {paginatedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-primary/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light">
                                        {user.displayName || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.totalUsage || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isBlocked ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                                            {user.isBlocked ? 'Blocked' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.email === 'nafisabdullah424@gmail.com' ? 'bg-yellow-200 text-yellow-800' : 'bg-sky-200 text-sky-800'}`}>
                                            {user.email === 'nafisabdullah424@gmail.com' ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <Link to={`/admin/user/${user.id}`} className="text-accent hover:text-sky-400">View</Link>
                                                <button onClick={() => confirmAction(user, user.isBlocked ? 'unblock' : 'block')} className={user.isBlocked ? 'text-green-400 hover:text-green-300' : 'text-yellow-400 hover:text-yellow-300'}>
                                                    {user.isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                                <button onClick={() => confirmAction(user, 'delete')} className="text-red-400 hover:text-red-300">
                                                    Delete
                                                </button>
                                            </div>
                                            <PointsManagement user={user} onPointsUpdated={fetchDashboardData} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    <span className="text-sm text-slate-400">
                        Showing {paginatedUsers.length} of {filteredUsers.length} users
                    </span>
                    <div className="space-x-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded-md bg-primary disabled:opacity-50">
                            Previous
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm rounded-md bg-primary disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            </DashboardSection>

            {showConfirmModal && selectedUser && actionType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-secondary p-6 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold mb-4">
                            Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)} User
                        </h3>
                        <p className="mb-4">
                            Are you sure you want to {actionType} {selectedUser.email}?
                            {actionType === 'delete' && (
                                <span className="block text-red-500 mt-2">
                                    This action cannot be undone.
                                </span>
                            )}
                        </p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white">
                                Cancel
                            </button>
                            <button onClick={handleConfirmAction} className={`px-4 py-2 text-white rounded ${actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Other Dashboard Sections can be added here */}
                 <DashboardSection title="Top Users by Usage">
                    <ul className="space-y-3">
                        {topUsers.map(user => (
                            <li key={user.id} className="flex items-center justify-between text-sm">
                                <span className="truncate">{user.displayName || user.email}</span>
                                <span className="font-semibold text-accent">{user.totalUsage} uses</span>
                            </li>
                        ))}
                    </ul>
                </DashboardSection>
                <DashboardSection title="Top Tools">
                     <ul className="space-y-3">
                        {topTools.map(tool => (
                            <li key={tool.toolId} className="flex items-center justify-between text-sm">
                                <span className="truncate">{tool.toolName}</span>
                                <span className="font-semibold text-accent">{tool.useCount} uses</span>
                            </li>
                        ))}
                    </ul>
                </DashboardSection>
                <DashboardSection title="Recent Activity">
                     <ul className="space-y-3">
                        {recentActivity.map(activity => (
                            <li key={activity.id} className="text-sm">
                                <p className="truncate">
                                    <span className="font-semibold">{usersMap.get(activity.userId)?.displayName || 'A user'}</span> used <span className="font-semibold text-accent">{activity.toolName}</span>
                                </p>
                                <p className="text-xs text-slate-400">{new Date(activity.timestamp.seconds * 1000).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                </DashboardSection>
            </div>
        </div>
    );
};

export default AdminDashboardPage;