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
    createAlert,
    getAlerts,
    revokeUserSessions,
    DashboardStats,
    GlobalHistoryItem,
    updateAuthSettings,
    deleteUser,
    toggleUserBlock
    , getUserIp, blockIp, unblockIp, isIpBlocked
} from '../../services/firebaseService';
import { sendPasswordResetEmailToUser, setUserPasswordInFirestore } from '../../services/firebaseService';
import {
    listCompetitions,
    deleteCompetition,
    setCompetitionVisibility,
    hidePastCompetitions,
    hideFutureCompetitions,
    showAllCompetitions
} from '../../services/quizService';
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
import { db } from '../../firebase/config';
import { getAllBlockedIps, resolveAlert, getUserAccessLogs, getActivityCounts, getOnlineUsersCount, getActivityTimeSeries } from '../../services/firebaseService';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
    CartesianGrid
} from 'recharts';

const USERS_PER_PAGE = 10;

const AdminDashboardPage: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
    const [blockedIps, setBlockedIps] = useState<Record<string, boolean>>({});
    const [topUsers, setTopUsers] = useState<FirestoreUser[]>([]);
    const [topTools, setTopTools] = useState<{ toolId: string; toolName: string; useCount: number; category: string }[]>([]);
    const [toolCategories, setToolCategories] = useState<{ name: ToolCategory; count: number }[]>([]);
    const [recentActivity, setRecentActivity] = useState<GlobalHistoryItem[]>([]);
    const [liveActivity, setLiveActivity] = useState<GlobalHistoryItem[]>([]);
    const [activityStats, setActivityStats] = useState<{ label: string; events: number; uniqueUsers: number }[]>([]);
    const [onlineCount, setOnlineCount] = useState<number | null>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionType, setActionType] = useState<'delete' | 'block' | 'unblock' | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
    const [historyModalUser, setHistoryModalUser] = useState<FirestoreUser | null>(null);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [editingPasswordUser, setEditingPasswordUser] = useState<FirestoreUser | null>(null);
    const [newPasswordValue, setNewPasswordValue] = useState('');
    const [competitions, setCompetitions] = useState<any[]>([]);
    const [loadingComps, setLoadingComps] = useState(false);
    const [activitySeries, setActivitySeries] = useState<any[]>([]);
    const [seriesUnit, setSeriesUnit] = useState<'day' | 'hour'>('day');
    const [seriesPoints, setSeriesPoints] = useState<number>(30);
    const [seriesSource, setSeriesSource] = useState<'globalHistory' | 'globalPageViews'>('globalHistory');
    const [diagnostic, setDiagnostic] = useState<{ totalCount?: number; missingFieldsUsers?: any[] }>({});

    // helper to create a manual alert from admin
    const handleCreateAlert = async (type: string, severity: 'info' | 'warning' | 'critical', message: string) => {
        try {
            await createAlert({ type, severity, message });
        } catch (err) {
            console.error('Failed to create alert', err);
        }
    };

    const handleForceLogout = async (userId: string) => {
        try {
            await revokeUserSessions(userId);
            showCongratulations('points', { message: 'User sessions revoked', points: 0 });
        } catch (err) {
            console.error('Failed to revoke sessions', err);
        }
    };

    const { authSettings, loading: settingsLoading } = useSettings();
    const { showCongratulations } = useCongratulations();

    // Small cell component to display user IP and block/unblock actions
    const IpCell: React.FC<{
        user: FirestoreUser;
        blockedIps: Record<string, boolean>;
        onBlock: (ip: string | null, user?: FirestoreUser) => void;
        onUnblock: (ip: string | null) => void;
    }> = ({ user, blockedIps, onBlock, onUnblock }) => {
        const [ip, setIp] = useState<string | null>(user['ip'] || user['lastIp'] || null);
        const [loadingIp, setLoadingIp] = useState(false);

        useEffect(() => {
            let mounted = true;
            const fetch = async () => {
                if (ip) return; // already have
                setLoadingIp(true);
                try {
                    const fetched = await getUserIp(user.id);
                    if (mounted) setIp(fetched);
                } catch (err) {
                    console.error('Failed to fetch user IP', err);
                } finally {
                    if (mounted) setLoadingIp(false);
                }
            };
            fetch();
            return () => { mounted = false; };
        }, [user.id]);

        const isBlocked = ip ? (blockedIps[ip] ?? false) : false;

        return (
            <div className="flex flex-col">
                <div className="text-sm text-slate-300 truncate">{loadingIp ? 'Loading...' : (ip || '—')}</div>
                <div className="mt-2 flex gap-2">
                    {ip && (
                        isBlocked ? (
                            <button onClick={() => onUnblock(ip)} className="text-xs px-2 py-1 rounded bg-green-600 text-white">Unblock IP</button>
                        ) : (
                            <button onClick={() => onBlock(ip, user)} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Block IP</button>
                        )
                    )}
                    <button onClick={() => { setHistoryModalUser(user); }} className="text-xs px-2 py-1 rounded bg-blue-600 text-white">View History</button>
                </div>
            </div>
        );
    };

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
            console.debug('fetchDashboardData: stats.totalUsers=', statsData?.totalUsers, 'allUsersData.length=', allUsersData?.length);
            setTopUsers(topUsersData);
            setTopTools(allToolsData.slice(0, 5));
            setRecentActivity(activityData);

            // Load alerts (initial)
            try {
                const al = await getAlerts(50);
                setAlerts(al);
            } catch (e) {
                console.warn('Failed to load alerts', e);
            }

            // Preload blocked IPs map for quick checks (best-effort)
            try {
                const ips = await getAllBlockedIps();
                const map: Record<string, boolean> = {};
                ips.forEach(i => map[i] = true);
                setBlockedIps(map);
            } catch (e) {
                console.warn('Failed to preload blocked IPs', e);
            }

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

    // Load activity series for chart
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const data = await getActivityTimeSeries(seriesPoints, seriesUnit, seriesSource);
                if (mounted) setActivitySeries(data);
            } catch (err) {
                console.error('Failed to load activity series', err);
            }
        })();
        return () => { mounted = false; };
    }, [seriesUnit, seriesPoints]);

    // Load activity stats (counts for different ranges)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const ranges: { key: any; label: string }[] = [
                    { key: 'online', label: 'Currently Online (last 5m)' },
                    { key: 'second', label: 'Last 1s' },
                    { key: 'minute', label: 'Last 1m' },
                    { key: 'hour', label: 'Last 1h' },
                    { key: 'day', label: 'Last 24h' },
                    { key: 'week', label: 'Last 7d' },
                    { key: 'month', label: 'Last 30d' },
                    { key: 'year', label: 'Last 365d' },
                    { key: 'all', label: 'All time' },
                ];
                const results: { label: string; events: number; uniqueUsers: number }[] = [];
                for (const r of ranges) {
                    const res = await getActivityCounts(r.key, 2000);
                    results.push({ label: r.label, events: res.events, uniqueUsers: res.uniqueUsers });
                }
                if (mounted) setActivityStats(results);
            } catch (err) {
                console.error('Failed to load activity stats', err);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Poll online users count using presence collection for accuracy
    useEffect(() => {
        let mounted = true;
        let timer: any = null;
        const load = async () => {
            try {
                const cnt = await getOnlineUsersCount(120);
                if (mounted) setOnlineCount(cnt);
            } catch (err) {
                console.error('Failed to fetch online count', err);
            }
        };
        load();
        timer = setInterval(load, 30 * 1000);
        return () => { mounted = false; if (timer) clearInterval(timer); };
    }, []);

    // Real-time subscription to globalHistory for live feed
    useEffect(() => {
        const unsub = db.collection('globalHistory').orderBy('timestamp', 'desc').limit(50).onSnapshot(snapshot => {
            const items: GlobalHistoryItem[] = [];
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    if (data.timestamp) {
                        items.push({ id: change.doc.id, ...data, timestamp: data.timestamp.toDate() } as GlobalHistoryItem);
                    }
                }
            });
            if (items.length) setLiveActivity(prev => [...items, ...prev].slice(0, 100));
        }, err => console.error('live feed error', err));

        return () => unsub();
    }, []);

    // Real-time subscription to users collection so admin sees new users immediately
    useEffect(() => {
        const usersUnsub = db.collection('users').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
                const users = snapshot.docs.map(doc => {
                const data: any = doc.data();
                return {
                    id: doc.id,
                    displayName: data.displayName || 'N/A',
                    email: data.email || 'N/A',
                    createdAt: data.createdAt,
                        points: data.points || 0,
                    totalUsage: data.totalUsage || 0,
                    password: data.password || undefined,
                    isBlocked: data.isBlocked || false
                } as any;
            });
            setAllUsers(users);
            console.debug('users onSnapshot: snapshot.size=', snapshot.size, 'mapped users length=', users.length);
        }, err => console.error('users subscription error', err));

        return () => usersUnsub();
    }, []);

    // Realtime subscription for alerts
    useEffect(() => {
        const unsub = db.collection('alerts').orderBy('createdAt', 'desc').limit(100).onSnapshot(snapshot => {
            const arr: any[] = [];
            snapshot.forEach(doc => arr.push({ id: doc.id, ...(doc.data() as any) }));
            setAlerts(arr);
        }, err => console.error('alerts subscription error', err));

        return () => unsub();
    }, []);

    const handleResolveAlert = async (alertId: string) => {
        try {
            await resolveAlert(alertId);
        } catch (err) {
            console.error('Failed to resolve alert', err);
        }
    };

    useEffect(() => {
        loadCompetitions();
    }, []);

    const loadCompetitions = async () => {
        setLoadingComps(true);
        try {
            const items = await listCompetitions();
            setCompetitions(items || []);
        } catch (err) {
            console.error('Failed to load competitions', err);
        } finally {
            setLoadingComps(false);
        }
    };

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

    const handleBlockIp = async (ip: string | null, user?: FirestoreUser) => {
        if (!ip) { alert('No IP available for this user'); return; }
        if (!confirm(`Block IP ${ip}? This will prevent anonymous access from this IP.`)) return;
        try {
            await blockIp(ip);
            setBlockedIps(prev => ({ ...prev, [ip]: true }));
            if (user) setAllUsers(prev => prev.map(u => u.id === user.id ? { ...u } : u));
            alert(`IP ${ip} blocked`);
        } catch (err) {
            console.error(err);
            alert('Failed to block IP');
        }
    };

    const handleUnblockIp = async (ip: string | null) => {
        if (!ip) { alert('No IP'); return; }
        if (!confirm(`Unblock IP ${ip}?`)) return;
        try {
            await unblockIp(ip);
            setBlockedIps(prev => ({ ...prev, [ip]: false }));
            alert(`IP ${ip} unblocked`);
        } catch (err) {
            console.error(err);
            alert('Failed to unblock IP');
        }
    };

    const closeHistoryModal = () => {
        setHistoryModalUser(null);
        setHistoryLogs([]);
    };

    useEffect(() => {
        let mounted = true;
        if (!historyModalUser) return;
        (async () => {
            setLoadingHistory(true);
            try {
                const logs = await getUserAccessLogs(historyModalUser.id, 500);
                if (mounted) setHistoryLogs(logs.map(l => ({
                    ...l,
                    timestamp: l.timestamp && (typeof (l.timestamp as any).toDate === 'function') ? (l.timestamp as any).toDate() : (l.timestamp instanceof Date ? l.timestamp : null)
                })));
            } catch (err) {
                console.error('Failed to load access logs', err);
                if (mounted) setHistoryLogs([]);
            } finally {
                if (mounted) setLoadingHistory(false);
            }
        })();
        return () => { mounted = false; };
    }, [historyModalUser]);

    const exportHistoryCsv = (user: FirestoreUser, logs: any[]) => {
        if (!logs || logs.length === 0) return alert('No logs to export');
        const header = ['Time', 'IP', 'User Agent', 'Platform', 'Locale', 'Path', 'Location'];
        const rows = logs.map((r: any) => [
            r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
            r.ip || '',
            r.userAgent || '',
            r.platform || '',
            r.locale || '',
            r.path || '',
            r.location || ''
        ]);
        const csv = [header.join(','), ...rows.map(r => r.map((c: any) => '"' + String(c).replace(/"/g, '""') + '"').join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `access_logs_${user.id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const confirmAction = (user: FirestoreUser, action: 'delete' | 'block' | 'unblock') => {
        setSelectedUser(user);
        setActionType(action);
        setShowConfirmModal(true);
    };

    // Competitions admin
    const handleDeleteCompetition = async (compId: string) => {
        if (!confirm('Delete competition? This cannot be undone.')) return;
        try {
            await deleteCompetition(compId);
            setCompetitions(competitions.filter(c => c.id !== compId));
            showCongratulations('points', { message: 'Competition deleted', points: 0 });
        } catch (err) {
            console.error('Failed to delete competition', err);
            alert('Failed to delete competition');
        }
    };

    const handleToggleVisibility = async (compId: string, visible?: boolean) => {
        try {
            await setCompetitionVisibility(compId, !!visible);
            setCompetitions(competitions.map(c => c.id === compId ? { ...c, visible: !!visible } : c));
        } catch (err) {
            console.error('Failed to toggle visibility', err);
            alert('Failed to update visibility');
        }
    };

    const handleBulkHidePast = async () => {
        if (!confirm('Hide all past competitions?')) return;
        try {
            const count = await hidePastCompetitions();
            alert(`Updated ${count} competitions`);
            loadCompetitions();
        } catch (err) {
            console.error(err);
            alert('Failed to hide past competitions');
        }
    };

    const handleBulkHideFuture = async () => {
        if (!confirm('Hide all future competitions?')) return;
        try {
            const count = await hideFutureCompetitions();
            alert(`Updated ${count} competitions`);
            loadCompetitions();
        } catch (err) {
            console.error(err);
            alert('Failed to hide future competitions');
        }
    };

    const handleShowAll = async () => {
        if (!confirm('Make all competitions visible?')) return;
        try {
            const count = await showAllCompetitions();
            alert(`Updated ${count} competitions`);
            loadCompetitions();
        } catch (err) {
            console.error(err);
            alert('Failed to show competitions');
        }
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
            <DashboardSection title="User Diagnostics">
                <div className="space-y-3">
                    <p className="text-sm text-slate-400">Run diagnostics against Firestore to compare counts and find user docs missing email/displayName.</p>
                    <div className="flex gap-2">
                        <button onClick={async () => {
                            try {
                                const snapshot = await db.collection('users').get();
                                const total = snapshot.size;
                                const missing: any[] = [];
                                snapshot.forEach(doc => {
                                    const d: any = doc.data() || {};
                                    if (!d.email || !d.displayName) missing.push({ id: doc.id, email: d.email || null, displayName: d.displayName || null });
                                });
                                setDiagnostic({ totalCount: total, missingFieldsUsers: missing });
                                console.debug('Diagnostic: total users=', total, 'missing count=', missing.length);
                                alert(`Diagnostic run: total users=${total}, missing fields=${missing.length}`);
                            } catch (err) {
                                console.error('Diagnostic failed', err);
                                alert('Diagnostic failed - see console');
                            }
                        }} className="px-3 py-2 rounded bg-accent text-white">Run Diagnostic</button>
                        <button onClick={async () => {
                            if (!confirm('This will write placeholder emails for users missing email/displayName. Proceed?')) return;
                            try {
                                const snapshot = await db.collection('users').get();
                                const updated: string[] = [];
                                for (const doc of snapshot.docs) {
                                    const d: any = doc.data() || {};
                                    if (!d.email || d.email === '' || !d.displayName) {
                                        const placeholder = d.email && d.email !== '' ? d.email : `${doc.id}@missing.local`;
                                        await db.collection('users').doc(doc.id).set({ email: placeholder, emailPlaceholder: true, displayName: d.displayName || null }, { merge: true });
                                        updated.push(doc.id);
                                    }
                                }
                                alert(`Updated ${updated.length} users with placeholder emails.`);
                                // refresh diagnostic
                                const total = snapshot.size;
                                const missing = updated.length;
                                setDiagnostic({ totalCount: total, missingFieldsUsers: [] });
                                // refresh UI users
                                fetchDashboardData();
                            } catch (err) {
                                console.error('Failed to apply placeholders', err);
                                alert('Failed to apply placeholders - see console');
                            }
                        }} className="px-3 py-2 rounded bg-yellow-600 text-white">Fix missing emails</button>
                        <button onClick={() => setDiagnostic({})} className="px-3 py-2 rounded bg-primary text-white">Clear</button>
                    </div>

                    {diagnostic.totalCount !== undefined && (
                        <div className="mt-2">
                            <div className="text-sm text-slate-300">Total users in Firestore: <span className="font-semibold">{diagnostic.totalCount}</span></div>
                            <div className="text-sm text-slate-300">Users missing email/displayName: <span className="font-semibold">{diagnostic.missingFieldsUsers?.length ?? 0}</span></div>
                            <div className="max-h-44 overflow-auto mt-2 bg-primary p-2 rounded">
                                <table className="min-w-full text-sm text-slate-300">
                                    <thead>
                                        <tr className="text-xs text-slate-400"><th className="px-2 py-1">ID</th><th className="px-2 py-1">Email</th><th className="px-2 py-1">DisplayName</th></tr>
                                    </thead>
                                    <tbody>
                                        {(diagnostic.missingFieldsUsers || []).map(u => (
                                            <tr key={u.id}><td className="px-2 py-1">{u.id}</td><td className="px-2 py-1">{String(u.email)}</td><td className="px-2 py-1">{String(u.displayName)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </DashboardSection>

            <DashboardSection title="Online Users & Activity Stats">
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-primary rounded-md">
                        <div>
                            <div className="text-sm text-slate-300">Currently online (accurate):</div>
                            <div className="text-2xl font-bold">{onlineCount !== null ? onlineCount : '—'}</div>
                        </div>
                        <div className="text-sm text-slate-400">
                            <div>Unique active users (last 5m): {activityStats.find(s => s.label.includes('5m'))?.uniqueUsers ?? activityStats.find(s => s.label.includes('Online'))?.uniqueUsers ?? '-'}</div>
                            <div className="text-xs mt-1">Events in last 1h: {activityStats.find(s => s.label.includes('1h'))?.events ?? '-'}</div>
                        </div>
                        <div className="ml-4">
                            <button onClick={async () => { try { const c = await getOnlineUsersCount(120); setOnlineCount(c); } catch (e) { console.error(e); } }} className="px-2 py-1 bg-accent rounded text-sm">Refresh</button>
                        </div>
                    </div>

                    <div className="overflow-auto max-h-48 bg-primary p-2 rounded">
                        <table className="min-w-full text-sm text-slate-300">
                            <thead>
                                <tr className="text-xs text-slate-400">
                                    <th className="px-3 py-2 text-left">Range</th>
                                    <th className="px-3 py-2 text-left">Events</th>
                                    <th className="px-3 py-2 text-left">Unique Users</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityStats.map(s => (
                                    <tr key={s.label} className="odd:bg-secondary/20">
                                        <td className="px-3 py-2">{s.label}</td>
                                        <td className="px-3 py-2">{s.events}</td>
                                        <td className="px-3 py-2">{s.uniqueUsers}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </DashboardSection>

            <DashboardSection title="Activity Trends">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="text-sm text-slate-300">Range:</div>
                        <button onClick={() => { setSeriesUnit('day'); setSeriesPoints(30); }} className={`px-2 py-1 rounded text-sm ${seriesUnit==='day' ? 'bg-accent text-white' : 'bg-primary'}`}>30 days</button>
                        <button onClick={() => { setSeriesUnit('day'); setSeriesPoints(90); }} className={`px-2 py-1 rounded text-sm ${seriesUnit==='day' && seriesPoints===90 ? 'bg-accent text-white' : 'bg-primary'}`}>90 days</button>
                        <button onClick={() => { setSeriesUnit('hour'); setSeriesPoints(24); }} className={`px-2 py-1 rounded text-sm ${seriesUnit==='hour' ? 'bg-accent text-white' : 'bg-primary'}`}>24 hours</button>
                        <button onClick={() => { setSeriesUnit('hour'); setSeriesPoints(72); }} className={`px-2 py-1 rounded text-sm ${seriesUnit==='hour' && seriesPoints===72 ? 'bg-accent text-white' : 'bg-primary'}`}>72 hours</button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <div className="text-sm text-slate-300">Source:</div>
                        <button onClick={() => setSeriesSource('globalHistory')} className={`px-2 py-1 rounded text-sm ${seriesSource==='globalHistory' ? 'bg-accent text-white' : 'bg-primary'}`}>Global Events</button>
                        <button onClick={() => setSeriesSource('globalPageViews')} className={`px-2 py-1 rounded text-sm ${seriesSource==='globalPageViews' ? 'bg-accent text-white' : 'bg-primary'}`}>Page Views</button>
                        <div className="ml-auto">
                            <button onClick={() => {
                                if (!activitySeries || activitySeries.length === 0) return alert('No series to export');
                                const header = ['label', 'timestamp', 'events', 'uniqueUsers'];
                                const rows = activitySeries.map(s => [s.label, s.timestamp, s.events, s.uniqueUsers]);
                                const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = `activity_series_${seriesSource}_${seriesPoints}_${seriesUnit}.csv`; a.click(); URL.revokeObjectURL(url);
                            }} className="px-2 py-1 rounded bg-blue-600 text-white text-sm">Export CSV</button>
                        </div>
                    </div>

                    <div className="h-64 bg-primary p-3 rounded">
                        {activitySeries.length === 0 ? (
                            <div className="text-slate-400">No data for selected range.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activitySeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="events" stroke="#8884d8" strokeWidth={2} name="Events" dot={false} />
                                    <Line type="monotone" dataKey="uniqueUsers" stroke="#82ca9d" strokeWidth={2} name="Unique Users" dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
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
                         <button onClick={() => showCongratulations('level', { level: 5 })} className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-md text-sm">Test Level Up (Lv 5)</button>
                         <button onClick={() => showCongratulations('badge', { badgeName: 'Power User' })} className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-md text-sm">Test Badge Earned</button>
                    </div>
                </div>
            </DashboardSection>

            <DashboardSection title="User Management">
                <div className="mb-4 flex gap-2 items-center">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="flex-1 px-4 py-2 rounded-md bg-primary border border-slate-600 focus:ring-2 focus:ring-accent focus:outline-none"
                    />
                    <button onClick={fetchDashboardData} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Refresh Users</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-primary/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">IP Address</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Points</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Usage</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Password</th>
                            </tr>
                        </thead>
                        <tbody className="bg-secondary divide-y divide-slate-700">
                            {paginatedUsers.map(user => (
                                <tr key={user.id} className="hover:bg-primary/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light">
                                        {user.displayName || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        <IpCell user={user} blockedIps={blockedIps} onBlock={handleBlockIp} onUnblock={handleUnblockIp} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate">{visiblePasswords[user.id] ? (user.password || '—') : '••••••••'}</span>
                                                <button onClick={() => setVisiblePasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))} className="text-xs text-accent">
                                                    {visiblePasswords[user.id] ? 'Hide' : 'Show'}
                                                </button>
                                            </div>
                                            <div className="mt-2 flex gap-2">
                                                <button onClick={async () => { try { await sendPasswordResetEmailToUser(user.email || ''); alert('Reset email sent'); } catch (err) { alert('Failed to send reset email'); console.error(err); } }} className="text-xs px-2 py-1 rounded bg-blue-600 text-white">Send Reset</button>
                                                <button onClick={() => { setEditingPasswordUser(user); setNewPasswordValue(user.password || ''); }} className="text-xs px-2 py-1 rounded bg-amber-600 text-white">Edit</button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{(user as any).points === Infinity ? '∞' : ((user as any).points || 0)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.totalUsage || 0}</td>
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

            <DashboardSection title="Competitions Management">
                <div className="flex gap-2 mb-4">
                    <button onClick={handleBulkHidePast} className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Hide Past</button>
                    <button onClick={handleBulkHideFuture} className="px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">Hide Future</button>
                    <button onClick={handleShowAll} className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Show All</button>
                    <button onClick={loadCompetitions} className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Refresh</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-primary/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Start</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">End</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Visible</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-secondary divide-y divide-slate-700">
                            {loadingComps && (
                                <tr><td colSpan={6} className="p-4">Loading competitions...</td></tr>
                            )}
                            {!loadingComps && competitions.length === 0 && (
                                <tr><td colSpan={6} className="p-4">No competitions found</td></tr>
                            )}
                            {competitions.map(comp => (
                                <tr key={comp.id} className="hover:bg-primary/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-light">{comp.quiz?.title || comp.title || comp.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{comp.startAt ? new Date(comp.startAt).toLocaleString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{comp.endAt ? new Date(comp.endAt).toLocaleString() : '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{comp.isPaid ? 'Yes' : 'No'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{comp.visible === false ? 'Hidden' : 'Visible'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleToggleVisibility(comp.id, !comp.visible)} className="text-sm px-3 py-1 rounded bg-primary">{comp.visible === false ? 'Show' : 'Hide'}</button>
                                            <button onClick={() => handleDeleteCompetition(comp.id)} className="text-sm px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
            {editingPasswordUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-secondary p-6 rounded-lg max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold mb-4">Edit Password for {editingPasswordUser.email}</h3>
                        <div className="space-y-3">
                            <label className="text-sm text-slate-300">New Password (min 8 chars)</label>
                            <input type="text" value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)} className="w-full px-3 py-2 bg-primary border border-slate-600 rounded-md" />
                        </div>
                        <div className="mt-4 flex justify-end gap-3">
                            <button onClick={() => setEditingPasswordUser(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white">Cancel</button>
                            <button onClick={async () => {
                                if (!editingPasswordUser) return;
                                if (newPasswordValue.length < 8) { alert('Password must be at least 8 characters'); return; }
                                try {
                                    await setUserPasswordInFirestore(editingPasswordUser.id, newPasswordValue);
                                    setAllUsers(prev => prev.map(u => u.id === editingPasswordUser.id ? { ...u, password: newPasswordValue } : u));
                                    setEditingPasswordUser(null);
                                    alert('Password updated in Firestore (does not change Firebase Auth password)');
                                } catch (err) {
                                    console.error(err);
                                    alert('Failed to update password');
                                }
                            }} className="px-4 py-2 bg-accent hover:bg-accent/90 rounded text-white">Save</button>
                        </div>
                    </div>
                </div>
            )}
            {historyModalUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-secondary p-6 rounded-lg max-w-4xl w-full mx-4">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-semibold">Access History for {historyModalUser.displayName || historyModalUser.email || historyModalUser.id}</h3>
                                <p className="text-sm text-slate-400">Showing latest access events (IP, time, browser, location, path)</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => exportHistoryCsv(historyModalUser, historyLogs)} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Export CSV</button>
                                <button onClick={closeHistoryModal} className="px-3 py-1 rounded bg-gray-600 text-white text-sm">Close</button>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-auto border border-slate-700 rounded p-2 bg-primary">
                            {loadingHistory ? (
                                <div className="p-4 text-center text-slate-300">Loading history...</div>
                            ) : historyLogs.length === 0 ? (
                                <div className="p-4 text-center text-slate-400">No access logs found for this user.</div>
                            ) : (
                                <table className="min-w-full text-sm text-slate-300">
                                    <thead>
                                        <tr className="text-xs text-slate-400">
                                            <th className="px-3 py-2 text-left">Time</th>
                                            <th className="px-3 py-2 text-left">IP</th>
                                            <th className="px-3 py-2 text-left">User Agent</th>
                                            <th className="px-3 py-2 text-left">Platform</th>
                                            <th className="px-3 py-2 text-left">Locale</th>
                                            <th className="px-3 py-2 text-left">Path</th>
                                            <th className="px-3 py-2 text-left">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historyLogs.map((r: any, idx: number) => (
                                            <tr key={r.id || idx} className="odd:bg-primary/50">
                                                <td className="px-3 py-2">{r.timestamp ? (r.timestamp instanceof Date ? r.timestamp.toLocaleString() : new Date(r.timestamp).toLocaleString()) : '-'}</td>
                                                <td className="px-3 py-2">{r.ip || '-'}</td>
                                                <td className="px-3 py-2 truncate" title={r.userAgent || ''}>{r.userAgent || '-'}</td>
                                                <td className="px-3 py-2">{r.platform || '-'}</td>
                                                <td className="px-3 py-2">{r.locale || '-'}</td>
                                                <td className="px-3 py-2 truncate" title={r.path || ''}>{r.path || '-'}</td>
                                                <td className="px-3 py-2 truncate" title={r.location || ''}>{r.location || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
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
                <DashboardSection title="Live Activity (Real-time)">
                     <ul className="space-y-3 max-h-48 overflow-auto">
                        {liveActivity.map(activity => (
                            <li key={activity.id} className="text-sm">
                                <p className="truncate">
                                    <span className="font-semibold">{usersMap.get(activity.userId)?.displayName || 'A user'}</span> → <span className="font-semibold text-accent">{activity.toolName}</span>
                                </p>
                                <p className="text-xs text-slate-400">{(activity.timestamp instanceof Date) ? new Date(activity.timestamp).toLocaleString() : ((activity.timestamp as any)?.seconds ? new Date((activity.timestamp as any).seconds * 1000).toLocaleString() : String(activity.timestamp))}</p>
                            </li>
                        ))}
                    </ul>
                </DashboardSection>

                <DashboardSection title="Alerts">
                     <div className="space-y-3">
                        <div className="flex gap-2">
                            <button onClick={() => handleCreateAlert('manual', 'warning', 'Manual alert created by admin')} className="px-3 py-1 rounded bg-yellow-500 text-white text-sm">Create Test Alert</button>
                        </div>
                        <ul className="space-y-2 max-h-48 overflow-auto">
                            {alerts.map(a => (
                                <li key={a.id} className={`p-2 rounded border ${a.severity==='critical'?'border-red-600 bg-red-800/20':''} ${a.severity==='warning'?'border-yellow-600 bg-yellow-800/10':''}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold">{a.type} <span className="text-xs text-slate-400">{a.severity}</span></div>
                                            <div className="text-sm text-slate-300">{a.message}</div>
                                            <div className="text-xs text-slate-400">{a.createdAt ? new Date((a.createdAt as any).seconds * 1000).toLocaleString() : ''}</div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {!a.resolved && <button className="text-xs px-2 py-1 rounded bg-green-600 text-white">Acknowledge</button>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                     </div>
                </DashboardSection>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
