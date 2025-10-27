import React from 'react';
import { FireIcon, GiftIcon, UserGroupIcon } from '@heroicons/react/24/solid';

interface EngagementBarProps {
  streak: number;
  dailyReward: string | null;
  activeUsers: number;
  points?: number;
  isAdmin?: boolean;
}

const EngagementBar: React.FC<EngagementBarProps> = ({ streak, dailyReward, activeUsers, points = 0, isAdmin = false }) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-lg mb-6 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 group cursor-pointer">
          <FireIcon className="h-6 w-6 text-yellow-400 group-hover:animate-bounce" />
          <div>
            <p className="text-sm font-medium">Daily Streak</p>
            <p className="text-lg font-bold group-hover:text-yellow-300 transition-colors">{streak} days</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <GiftIcon className="h-6 w-6 text-cyan-400" />
          <div>
            <p className="text-sm font-medium">Points Balance</p>
            <p className="text-lg font-bold">{isAdmin ? '∞' : points || 0}</p>
          </div>
        </div>

        {dailyReward && (
          <div className="flex items-center space-x-2">
            <GiftIcon className="h-6 w-6 text-pink-400" />
            <div>
              <p className="text-sm font-medium">Today's Reward!</p>
              <p className="text-lg font-bold">{dailyReward}</p>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-6 w-6 text-green-400" />
          <div>
            <p className="text-sm font-medium">Online Now</p>
            <p className="text-lg font-bold">{activeUsers} users</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementBar;
