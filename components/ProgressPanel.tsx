import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { gamificationService, UserLevel } from '../services/gamificationService';
import { StarIcon, TrophyIcon, FireIcon } from '@heroicons/react/24/solid';

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  completed: boolean;
}

const ProgressPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [xpAnimation, setXpAnimation] = useState<{ amount: number; visible: boolean }>({ amount: 0, visible: false });

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserProgress = async () => {
      const doc = await gamificationService.getDailyQuests(currentUser.uid);
      if (doc) {
        setDailyQuests(doc.quests);
      }
    };

    fetchUserProgress();
  }, [currentUser]);

  const showXpGain = (amount: number) => {
    setXpAnimation({ amount, visible: true });
    setTimeout(() => setXpAnimation({ amount: 0, visible: false }), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Level Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <StarIcon className="h-6 w-6 text-yellow-500" />
            <span className="text-lg font-bold">Level {userLevel?.level || 1}</span>
          </div>
          <span className="text-sm text-gray-600">{userLevel?.title || 'Novice Explorer'}</span>
        </div>
        <div className="relative w-full h-4 bg-gray-200 rounded-full">
          <div 
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ 
              width: `${((userLevel?.currentXp || 0) / (userLevel?.nextLevelXp || 1000)) * 100}%`
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>{userLevel?.currentXp || 0} XP</span>
          <span>{userLevel?.nextLevelXp || 1000} XP</span>
        </div>
      </div>

      {/* Daily Quests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
          Daily Quests
        </h3>
        <div className="space-y-4">
          {dailyQuests.map(quest => (
            <div key={quest.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{quest.title}</h4>
                  <p className="text-sm text-gray-600">{quest.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-green-600">+{quest.reward} XP</span>
                </div>
              </div>
              <div className="relative w-full h-2 bg-gray-200 rounded-full">
                <div 
                  className="absolute left-0 top-0 h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{quest.progress} / {quest.target}</span>
                {quest.completed && <span className="text-green-600">Complete!</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* XP Gain Animation */}
      {xpAnimation.visible && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full animate-bounce">
          +{xpAnimation.amount} XP
        </div>
      )}
    </div>
  );
};

export default ProgressPanel;
