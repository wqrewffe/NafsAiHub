import React, { useState } from 'react';
import NotificationControl from './NotificationControl';
import {
  Cog6ToothIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface AdminTabsProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
  ];

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon
                className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${activeTab === tab.id
                    ? 'text-purple-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </div>
  );
};

export default AdminTabs;
