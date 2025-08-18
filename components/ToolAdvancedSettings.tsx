import React, { useState } from 'react';
import { TimeWindow, UsageQuota } from '../types';

interface ToolAdvancedSettingsProps {
    toolId: string;
    usageQuota?: UsageQuota;
    accessSchedule?: TimeWindow[];
    onQuotaChange: (toolId: string, quota: UsageQuota) => void;
    onScheduleChange: (toolId: string, schedule: TimeWindow[]) => void;
}

const DAYS_OF_WEEK = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
] as const;

const ToolAdvancedSettings: React.FC<ToolAdvancedSettingsProps> = ({
    toolId,
    usageQuota,
    accessSchedule = [],
    onQuotaChange,
    onScheduleChange
}) => {
    const [isAddingSchedule, setIsAddingSchedule] = useState(false);
    const [newSchedule, setNewSchedule] = useState<TimeWindow>({
        startHour: 9,
        endHour: 17,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });

    const handleQuotaChange = (field: keyof UsageQuota, value: number) => {
        const updatedQuota: UsageQuota = {
            ...(usageQuota || { dailyLimit: 0, monthlyLimit: 0, resetDay: 1 }),
            [field]: value
        };
        onQuotaChange(toolId, updatedQuota);
    };

    const handleAddSchedule = () => {
        const updatedSchedule = [...accessSchedule, newSchedule];
        onScheduleChange(toolId, updatedSchedule);
        setIsAddingSchedule(false);
        setNewSchedule({
            startHour: 9,
            endHour: 17,
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        });
    };

    const handleRemoveSchedule = (index: number) => {
        const updatedSchedule = accessSchedule.filter((_, i) => i !== index);
        onScheduleChange(toolId, updatedSchedule);
    };

    return (
        <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
            {/* Usage Quotas */}
            <div>
                <h4 className="text-lg font-medium mb-4">Usage Quotas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Daily Limit</label>
                        <input
                            type="number"
                            min="0"
                            value={usageQuota?.dailyLimit || 0}
                            onChange={(e) => handleQuotaChange('dailyLimit', parseInt(e.target.value))}
                            className="w-full p-2 border rounded-md"
                            placeholder="0 for unlimited"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Monthly Limit</label>
                        <input
                            type="number"
                            min="0"
                            value={usageQuota?.monthlyLimit || 0}
                            onChange={(e) => handleQuotaChange('monthlyLimit', parseInt(e.target.value))}
                            className="w-full p-2 border rounded-md"
                            placeholder="0 for unlimited"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Monthly Reset Day</label>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            value={usageQuota?.resetDay || 1}
                            onChange={(e) => handleQuotaChange('resetDay', parseInt(e.target.value))}
                            className="w-full p-2 border rounded-md"
                            placeholder="Day of month (1-31)"
                        />
                    </div>
                </div>
            </div>

            {/* Access Schedule */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium">Access Schedule</h4>
                    <button
                        onClick={() => setIsAddingSchedule(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Add Schedule
                    </button>
                </div>

                {/* Existing Schedules */}
                <div className="space-y-3">
                    {accessSchedule.map((schedule, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-white">
                            <div>
                                <span className="font-medium">
                                    {schedule.startHour}:00 - {schedule.endHour}:00
                                </span>
                                <span className="ml-3 text-sm text-gray-600">
                                    {schedule.days.join(', ')}
                                </span>
                            </div>
                            <button
                                onClick={() => handleRemoveSchedule(index)}
                                className="text-red-600 hover:text-red-800"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add New Schedule Form */}
                {isAddingSchedule && (
                    <div className="mt-4 p-4 border rounded-md bg-white">
                        <h5 className="font-medium mb-3">New Schedule</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Start Time</label>
                                <select
                                    value={newSchedule.startHour}
                                    onChange={(e) => setNewSchedule({
                                        ...newSchedule,
                                        startHour: parseInt(e.target.value)
                                    })}
                                    className="w-full p-2 border rounded-md"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">End Time</label>
                                <select
                                    value={newSchedule.endHour}
                                    onChange={(e) => setNewSchedule({
                                        ...newSchedule,
                                        endHour: parseInt(e.target.value)
                                    })}
                                    className="w-full p-2 border rounded-md"
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>{i}:00</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Days Available</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <label key={day} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={newSchedule.days.includes(day)}
                                            onChange={(e) => {
                                                const days = e.target.checked
                                                    ? [...newSchedule.days, day]
                                                    : newSchedule.days.filter(d => d !== day);
                                                setNewSchedule({ ...newSchedule, days });
                                            }}
                                            className="rounded"
                                        />
                                        <span className="capitalize">{day}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsAddingSchedule(false)}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddSchedule}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                disabled={newSchedule.days.length === 0}
                            >
                                Add Schedule
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ToolAdvancedSettings;
