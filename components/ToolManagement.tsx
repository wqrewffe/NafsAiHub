import React, { useState, useEffect } from 'react';
import { Tool, ToolSettings, FirestoreUser, UsageQuota, TimeWindow } from '../types';
import { updateToolSettings, getToolSettings } from '../services/toolManagementService';
import { getAllUsers } from '../services/firebaseService';
import Spinner from './Spinner';
import ToolAdvancedSettings from './ToolAdvancedSettings';

interface ToolManagementProps {
    tools: Tool[];
}

const ToolManagement: React.FC<ToolManagementProps> = ({ tools }) => {
    const [toolSettings, setToolSettings] = useState<Record<string, ToolSettings>>({});
    const [users, setUsers] = useState<FirestoreUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [allUsers, settings] = await Promise.all([
                    getAllUsers(),
                    Promise.all(tools.map(tool => 
                        getToolSettings(tool.id).then(settings => [tool.id, settings])
                    ))
                ]);
                
                setUsers(allUsers);
                setToolSettings(Object.fromEntries(settings));
            } catch (error) {
                console.error('Error loading tool management data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [tools]);

    const handleVisibilityToggle = async (toolId: string) => {
        const currentSettings = toolSettings[toolId] || {
            isHidden: false,
            restrictedTo: [],
            usageQuota: { dailyLimit: 0, monthlyLimit: 0, resetDay: 1 },
            accessSchedule: []
        };
        const newSettings = {
            ...currentSettings,
            isHidden: !currentSettings.isHidden
        };
        
        await updateToolSettings(toolId, newSettings);
        setToolSettings(prev => ({
            ...prev,
            [toolId]: newSettings
        }));
    };

    const handleUserRestrictionToggle = async (toolId: string, userId: string) => {
        const currentSettings = toolSettings[toolId] || {
            isHidden: false,
            restrictedTo: [],
            usageQuota: { dailyLimit: 0, monthlyLimit: 0, resetDay: 1 },
            accessSchedule: []
        };
        const restrictedTo = currentSettings.restrictedTo.includes(userId)
            ? currentSettings.restrictedTo.filter(id => id !== userId)
            : [...currentSettings.restrictedTo, userId];
        
        const newSettings = {
            ...currentSettings,
            restrictedTo
        };
        
        await updateToolSettings(toolId, newSettings);
        setToolSettings(prev => ({
            ...prev,
            [toolId]: newSettings
        }));
    };

    const handleQuotaChange = async (toolId: string, quota: UsageQuota) => {
        const currentSettings = toolSettings[toolId] || {
            isHidden: false,
            restrictedTo: [],
            usageQuota: { dailyLimit: 0, monthlyLimit: 0, resetDay: 1 },
            accessSchedule: []
        };
        
        const newSettings = {
            ...currentSettings,
            usageQuota: quota
        };
        
        await updateToolSettings(toolId, newSettings);
        setToolSettings(prev => ({
            ...prev,
            [toolId]: newSettings
        }));
    };

    const handleScheduleChange = async (toolId: string, schedule: TimeWindow[]) => {
        const currentSettings = toolSettings[toolId] || {
            isHidden: false,
            restrictedTo: [],
            usageQuota: { dailyLimit: 0, monthlyLimit: 0, resetDay: 1 },
            accessSchedule: []
        };
        
        const newSettings = {
            ...currentSettings,
            accessSchedule: schedule
        };
        
        await updateToolSettings(toolId, newSettings);
        setToolSettings(prev => ({
            ...prev,
            [toolId]: newSettings
        }));
    };

    const filteredTools = tools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Spinner />;

    return (
        <div className="space-y-6 max-h-[calc(100vh-250px)] flex flex-col">
            <div className="mb-4 sticky top-0 bg-secondary z-10 p-4">
                <input
                    type="text"
                    placeholder="Search tools..."
                    className="w-full p-2 border rounded-md"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid gap-4 overflow-y-auto px-4">
                {filteredTools.map(tool => (
                    <div key={tool.id} className="p-4 border rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">{tool.name}</h3>
                                <p className="text-sm text-gray-600">{tool.category}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={!toolSettings[tool.id]?.isHidden}
                                        onChange={() => handleVisibilityToggle(tool.id)}
                                        className="w-4 h-4"
                                    />
                                    Visible
                                </label>
                                <button
                                    onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Manage Settings
                                </button>
                            </div>
                        </div>

                        {selectedTool === tool.id && (
                            <div className="mt-4 space-y-6">
                                {/* User Access Control */}
                                <div className="p-4 bg-gray-50 rounded-md">
                                    <h4 className="mb-2 font-medium sticky top-0 bg-gray-50 py-2">User Access Control</h4>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {users.map(user => (
                                            <div key={user.id} className="flex items-center justify-between py-1">
                                                <span className="text-sm">{user.email}</span>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={!toolSettings[tool.id]?.restrictedTo.includes(user.id)}
                                                        onChange={() => handleUserRestrictionToggle(tool.id, user.id)}
                                                        className="w-4 h-4"
                                                    />
                                                    Allow Access
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Advanced Settings */}
                                <ToolAdvancedSettings
                                    toolId={tool.id}
                                    usageQuota={toolSettings[tool.id]?.usageQuota}
                                    accessSchedule={toolSettings[tool.id]?.accessSchedule}
                                    onQuotaChange={handleQuotaChange}
                                    onScheduleChange={handleScheduleChange}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ToolManagement;
