import React, { useState, useEffect } from 'react';
import { FirestoreUser } from '../types';
import { deleteUser, toggleUserBlock, getAllUsers } from '../services/adminService';
import Modal from './Modal';
import Spinner from './Spinner';
import PointsManagement from './admin/PointsManagement';
import ToolAwardManagement from './admin/ToolAwardManagement';

// Constants for UI state
const USER_ACTION_TYPES = ['delete', 'block', 'unblock'] as const;
type UserActionType = typeof USER_ACTION_TYPES[number];

// A single, clean UserRow component
const UserRow: React.FC<{
    user: FirestoreUser;
    onDelete: () => void;
    onToggleBlock: () => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}> = ({ user, onDelete, onToggleBlock, isExpanded, onToggleExpand }) => (
    <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className="px-4 py-3">{user.displayName || 'N/A'}</td>
        <td className="px-4 py-3">{user.email}</td>
        <td className="px-4 py-3">{user.totalUsage || 0}</td>
        <td className="px-4 py-3">
            <div className="flex flex-col items-start">
                <span className="text-sm font-medium">
                    🔥 {user.currentStreak || 0} days
                </span>
                {user.longestStreak && user.longestStreak > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Best: {user.longestStreak} days
                    </span>
                )}
            </div>
        </td>
        <td className="px-4 py-3">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                user.isBlocked 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
                {user.isBlocked ? 'Blocked' : 'Active'}
            </span>
        </td>
        <td className="px-4 py-3">
            <div className="flex items-center space-x-2">
                <button
                    onClick={onToggleExpand}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-all duration-150
                        ${isExpanded
                            ? 'bg-blue-600 text-white dark:bg-blue-500 ring-2 ring-blue-300 dark:ring-blue-400'
                            : 'bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-700 dark:text-blue-400 dark:hover:bg-gray-600 border border-blue-300 dark:border-blue-500'
                        }`}
                >
                    <span className="mr-2">{isExpanded ? 'Hide Options' : 'Show Options'}</span>
                    <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'transform rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <button
                    onClick={onToggleBlock}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150
                        ${user.isBlocked
                            ? 'text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/20'
                            : 'text-yellow-700 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                        }`}
                >
                    {user.isBlocked ? 'Unblock' : 'Block'}
                </button>
                <button
                    onClick={onDelete}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors duration-150"
                >
                    Delete
                </button>
            </div>
        </td>
    </tr>
);

export const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<FirestoreUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<FirestoreUser | null>(null);
    const [actionType, setActionType] = useState<UserActionType | null>(null);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const toggleUserExpand = (userId: string) => {
        setExpandedUser(currentId => (currentId === userId ? null : userId));
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
            setError(null);
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        if (!selectedUser || !actionType) return;

        try {
            if (actionType === 'delete') {
                await deleteUser(selectedUser.id);
                setUsers(users.filter(u => u.id !== selectedUser.id));
            } else if (actionType === 'block' || actionType === 'unblock') {
                const isBlocking = actionType === 'block';
                await toggleUserBlock(selectedUser.id, isBlocking);
                setUsers(users.map(u => 
                    u.id === selectedUser.id 
                        ? { ...u, isBlocked: isBlocking }
                        : u
                ));
            }
        } catch (err) {
            setError(`Failed to ${actionType} user`);
            console.error(err);
        } finally {
            setShowConfirmModal(false);
            setSelectedUser(null);
            setActionType(null);
        }
    };

    const confirmAction = (user: FirestoreUser, action: UserActionType) => {
        setSelectedUser(user);
        setActionType(action);
        setShowConfirmModal(true);
    };

    if (loading) return <Spinner />;

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-800 rounded-lg shadow-md mx-auto max-w-4xl">
                <p><strong>Error:</strong> {error}</p>
                <button onClick={loadUsers} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Admin Dashboard</h1>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-300">User Management</h2>
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-3 font-semibold tracking-wider">Name</th>
                            <th className="px-4 py-3 font-semibold tracking-wider">Email</th>
                            <th className="px-4 py-3 font-semibold tracking-wider">Total Usage</th>
                            <th className="px-4 py-3 font-semibold tracking-wider">Streak</th>
                            <th className="px-4 py-3 font-semibold tracking-wider">Status</th>
                            <th className="px-4 py-3 font-semibold tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <React.Fragment key={user.id}>
                                <UserRow
                                    user={user}
                                    onDelete={() => confirmAction(user, 'delete')}
                                    onToggleBlock={() => confirmAction(user, user.isBlocked ? 'unblock' : 'block')}
                                    isExpanded={expandedUser === user.id}
                                    onToggleExpand={() => toggleUserExpand(user.id)}
                                />
                                {expandedUser === user.id && (
                                    <tr>
                                        <td colSpan={5} className="p-0">
                                            <div className="p-6 bg-white dark:bg-gray-800 shadow-inner border-t-4 border-blue-500">
                                                <div className="space-y-6">
                                                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm">
                                                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Points Management</h3>
                                                        <PointsManagement user={user} onPointsUpdated={loadUsers} />
                                                    </div>
                                                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm">
                                                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tool Management</h3>
                                                        <ToolAwardManagement user={user} />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {showConfirmModal && selectedUser && actionType && (
                <Modal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    title={`Confirm User ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
                >
                    <div className="p-6 text-gray-800 dark:text-gray-200">
                        <p className="mb-4">
                            Are you sure you want to {actionType} the user <strong>{selectedUser.email}</strong>?
                            {actionType === 'delete' && (
                                <span className="block font-semibold text-red-600 dark:text-red-400 mt-2">
                                    Warning: This action cannot be undone.
                                </span>
                            )}
                        </p>
                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-medium rounded-md hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`px-4 py-2 text-white font-medium rounded-md transition-colors ${
                                    actionType === 'delete'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};