import React, { useState } from 'react';
import { FirestoreUser } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCongratulations } from '../../hooks/CongratulationsProvider';
import { toolAccessService } from '../../services/toolAccessService';
import Spinner from '../Spinner';
import { tools } from '../../tools';

interface ToolAwardManagementProps {
  user: FirestoreUser;
}

const ToolAwardManagement: React.FC<ToolAwardManagementProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [customCount, setCustomCount] = useState(5);
  const [selectedTool, setSelectedTool] = useState('');
  const { currentUser } = useAuth();
  const { showCongratulations } = useCongratulations();

  const handleAwardTools = async (type: 'all' | 'half' | 'custom', count?: number, specificToolId?: string) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const result = await toolAccessService.awardToolsToUser(
        currentUser.uid,
        user.id,
        type,
        count,
        specificToolId
      );

      if (result.success && result.unlockedTools.length > 0) {
        // Show admin feedback
        const message = specificToolId 
          ? `Successfully awarded ${tools.find(t => t.id === specificToolId)?.name} to ${user.displayName || 'user'}`
          : `Successfully awarded ${result.unlockedTools.length} tools to ${user.displayName || 'user'}`;

        showCongratulations('success', {
          title: '✅ Success',
          message
        });
      }
    } catch (error) {
      console.error('Error awarding tools:', error);
      showCongratulations('error', {
        title: '❌ Error',
        message: 'Failed to award tools. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Award Tools to {user.displayName || user.email}</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleAwardTools('all')}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          Award All Tools
        </button>

        <button
          onClick={() => handleAwardTools('half')}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          Award Half Tools
        </button>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="20"
            value={customCount}
            onChange={(e) => setCustomCount(parseInt(e.target.value))}
            className="w-20 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          />
          <button
            onClick={() => handleAwardTools('custom', customCount)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Award Custom
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="flex-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          >
            <option value="">Select Tool</option>
            {tools.map(tool => (
              <option key={tool.id} value={tool.id}>
                {tool.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedTool && handleAwardTools('custom', undefined, selectedTool)}
            disabled={loading || !selectedTool}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Award
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
};

export default ToolAwardManagement;
