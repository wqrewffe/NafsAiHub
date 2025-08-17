
import React,
{
    useState,
    useEffect,
    useMemo
} from 'react';
import {
    Link
} from 'react-router-dom';
import {
    getAllUsers,
    getDashboardStats,
    getTopUsedToolsGlobal,
    getRecentActivity,
    DashboardStats,
    GlobalHistoryItem,
    updateAuthSettings
} from '../../services/firebaseService';
import {
    FirestoreUser,
    ToolCategory
} from '../../types';
import Spinner from '../../components/Spinner';
import StatCard from '../../components/StatCard';
import {
    UsersIcon,
    UserPlusIcon,
    ChartBarIcon,
    ArrowTrendingUpIcon
} from '../../tools/Icons';
import { useSettings } from '../../hooks/useSettings';

const USERS_PER_PAGE = 10;

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
    const [topUsers, setTopUsers] = useState<FirestoreUser[]>([]);
    const [topTools, setTopTools] = useState<{ toolId: string; toolName: string; useCount: number }[]>([]);
    const [toolCategories, setToolCategories] = useState<{ name: ToolCategory; count: number }[]>([]);
    const [recentActivity, setRecentActivity] = useState<GlobalHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const { authSettings, loading: settingsLoading } = useSettings();

    const usersMap = useMemo(() => new Map(allUsers.map(user => [user.id, user])), [allUsers]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
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
        };

        fetchDashboardData();
    }, []);


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
        const isDisabled = e.target.checked;
        try {
            await updateAuthSettings({ isGoogleAuthDisabled: isDisabled });
        } catch (err) {
            console.error("Failed to update auth settings", err);
            alert("Failed to update settings.");
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
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
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
                                className="sr-only"
                                checked={!settingsLoading && authSettings.isGoogleAuthDisabled}
                                onChange={handleGoogleAuthToggle}
                                disabled={settingsLoading}
                            />
                            <div className="block bg-slate-600 w-14 h-8 rounded-full"></div>
                            <div className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                        </div>
                    </label>
                </div>
            </DashboardSection>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardSection title="Recent Activity" className="lg:col-span-2">
                    <div className="space-y-3">
                        {recentActivity.map(activity => (
                            <div key={activity.id} className="flex items-center justify-between bg-primary p-2 rounded-md">
                                <div>
                                    <p className="text-sm text-light">
                                        <span className="font-bold text-accent">{usersMap.get(activity.userId)?.displayName || 'A user'}</span>
                                        {' '}used {activity.toolName}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500">{activity.timestamp.toLocaleTimeString()}</p>
                            </div>
                        ))}
                    </div>
                </DashboardSection>

                <DashboardSection title="System Status">
                    <div className="flex items-center space-x-3 p-3 bg-primary rounded-md">
                        <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                        <div>
                            <p className="font-semibold text-green-400">All Systems Operational</p>
                            <p className="text-xs text-slate-400">Firebase & Gemini API Connected</p>
                        </div>
                    </div>
                </DashboardSection>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardSection title="Top 5 Most Used Tools">
                    <ol className="space-y-2 list-decimal list-inside">
                        {topTools.map(tool => (
                            <li key={tool.toolId} className="text-sm text-light">
                                {tool.toolName}
                                <span className="text-xs text-slate-400"> ({tool.useCount} uses)</span>
                            </li>
                        ))}
                    </ol>
                </DashboardSection>

                <DashboardSection title="Top 5 Active Users">
                    <ol className="space-y-2 list-decimal list-inside">
                        {topUsers.map(user => (
                            <li key={user.id} className="text-sm text-light">
                                {user.displayName}
                                <span className="text-xs text-slate-400"> ({user.totalUsage} uses)</span>
                            </li>
                        ))}
                    </ol>
                </DashboardSection>

                <DashboardSection title="Usage by Category">
                    <div className="space-y-2">
                        {toolCategories.map(cat => (
                            <div key={cat.name} className="text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-light">{cat.name}</span>
                                    <span className="text-slate-400">{cat.count}</span>
                                </div>
                                <div className="w-full bg-primary rounded-full h-2.5">
                                    <div
                                        className="bg-accent h-2.5 rounded-full"
                                        style={{ width: `${(cat.count / (stats?.totalUsage || 1)) * 100}%` }}>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardSection>
            </div>

            <DashboardSection title="All Users">
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Display Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Password</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-secondary divide-y divide-slate-700">
                            {paginatedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-primary/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light">{user.displayName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">{user.password || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.email === 'nafisabdullah424@gmail.com' ? 'bg-yellow-200 text-yellow-800' : 'bg-sky-200 text-sky-800'}`}>
                                            {user.email === 'nafisabdullah424@gmail.com' ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                        <Link to={`/admin/user/${user.id}`} className="text-accent hover:text-sky-400">
                                            View History
                                        </Link>
                                        <button className="text-slate-400 hover:text-white" onClick={() => alert('Role management feature coming soon!')}>
                                            Edit Role
                                        </button>
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
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm rounded-md bg-primary disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm rounded-md bg-primary disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </DashboardSection>
        </div>
    );
};

export default AdminDashboardPage;