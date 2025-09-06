import React, { useState, useEffect } from 'react';
import { adminNotificationService } from '../../services/adminNotificationService';
import {
  BellIcon,
  PlusIcon,
  TrashIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const NotificationControl: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<import('../../services/adminNotificationService').NotificationTemplate>>({
    title: '',
    message: '',
    type: 'achievement',
    priority: 'medium',
    active: true,
    reward: {
      type: 'xp',
      amount: 0
    },
    triggerCondition: {
      type: 'toolUse',
      value: 1
    }
  });

  useEffect(() => {
    loadTemplates();
    loadStats();
  }, []);

  const loadTemplates = async () => {
    const data = await adminNotificationService.getNotificationTemplates();
    setTemplates(data);
  };

  const loadStats = async () => {
    const data = await adminNotificationService.getNotificationStats();
    setStats(data);
  };

  const handleCreateTemplate = async () => {
  // cast to any because adminNotificationService accepts a loose shape
  await adminNotificationService.createNotificationTemplate(newTemplate as any);
    setShowNewTemplate(false);
    loadTemplates();
  };

  const handleToggleActive = async (templateId: string, active: boolean) => {
    await adminNotificationService.toggleTemplateActive(templateId, active);
    loadTemplates();
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this notification template?')) {
      await adminNotificationService.deleteTemplate(templateId);
      loadTemplates();
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Notification Control Panel</h2>
        
        {/* Stats Section */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Total Sent (24h)</h3>
                <BellIcon className="h-6 w-6 text-purple-500" />
              </div>
              <p className="text-3xl font-bold mt-2">{stats.totalSent}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Engagement Rates</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Clicked</span>
                  <span className="font-medium text-green-600">{stats.engagementRates.clicked}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Dismissed</span>
                  <span className="font-medium text-yellow-600">{stats.engagementRates.dismissed}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ignored</span>
                  <span className="font-medium text-red-600">{stats.engagementRates.ignored}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">By Type</h3>
              <div className="space-y-2">
        {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="capitalize">{type}</span>
          <span className="font-medium">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Template Management */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Notification Templates</h3>
              <button
                onClick={() => setShowNewTemplate(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Template
              </button>
            </div>
          </div>

          <div className="divide-y">
            {templates.map(template => (
              <div key={template.id} className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{template.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.message}</p>
                  <div className="flex items-center mt-2 space-x-4 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      template.priority === 'high' ? 'bg-red-100 text-red-800' :
                      template.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {template.priority}
                    </span>
                    {template.reward && (
                      <span className="text-green-600">
                        +{template.reward.amount} {template.reward.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleToggleActive(template.id, !template.active)}
                    className={`p-2 rounded-full ${
                      template.active ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {template.active ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <XCircleIcon className="h-6 w-6" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Template Modal */}
      {showNewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Create New Notification Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={e => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  value={newTemplate.message}
                  onChange={e => setNewTemplate(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={newTemplate.type}
                    onChange={e => setNewTemplate(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="achievement">Achievement</option>
                    <option value="reward">Reward</option>
                    <option value="streak">Streak</option>
                    <option value="referral">Referral</option>
                    <option value="suggestion">Suggestion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={newTemplate.priority}
                    onChange={e => setNewTemplate(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reward Type</label>
                  <select
                    value={newTemplate.reward.type}
                    onChange={e => setNewTemplate(prev => ({
                      ...prev,
                      reward: { ...prev.reward, type: e.target.value as any }
                    }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="xp">XP</option>
                    <option value="points">Points</option>
                    <option value="badge">Badge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Reward Amount</label>
                  <input
                    type="number"
                    value={newTemplate.reward.amount}
                    onChange={e => setNewTemplate(prev => ({
                      ...prev,
                      reward: { ...prev.reward, amount: parseInt(e.target.value) }
                    }))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Trigger Type</label>
                  <select
                    value={newTemplate.triggerCondition.type}
                    onChange={e => setNewTemplate(prev => ({
                      ...prev,
                      triggerCondition: { ...prev.triggerCondition, type: e.target.value as any }
                    }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="toolUse">Tool Use</option>
                    <option value="streak">Streak</option>
                    <option value="login">Login</option>
                    <option value="timeSpent">Time Spent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Trigger Value</label>
                  <input
                    type="number"
                    value={newTemplate.triggerCondition.value}
                    onChange={e => setNewTemplate(prev => ({
                      ...prev,
                      triggerCondition: { ...prev.triggerCondition, value: parseInt(e.target.value) }
                    }))}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowNewTemplate(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationControl;
