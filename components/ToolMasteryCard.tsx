import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { masteryService, ToolMastery } from '../services/masteryService';
import { StarIcon, LockOpenIcon, SparklesIcon, FireIcon } from '@heroicons/react/24/solid';

interface ToolMasteryCardProps {
  toolId: string;
}

const ToolMasteryCard: React.FC<ToolMasteryCardProps> = ({ toolId }) => {
  const { currentUser } = useAuth();
  const [mastery, setMastery] = useState<ToolMastery | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadMasteryData();
    }
  }, [currentUser, toolId]);

  const loadMasteryData = async () => {
    if (!currentUser) return;
    const data = await masteryService.getToolMastery(currentUser.uid, toolId);
    setMastery(data);
  };

  if (!mastery) {
    return <div className="text-center py-4">Loading mastery data...</div>;
  }

  const progressPercent = (mastery.currentXp / mastery.nextLevelXp) * 100;

  const getMasteryColor = (level: number) => {
    switch (true) {
      case level >= 7: return 'from-yellow-400 to-yellow-600';
      case level >= 6: return 'from-purple-500 to-purple-700';
      case level >= 5: return 'from-red-500 to-red-700';
      case level >= 4: return 'from-blue-500 to-blue-700';
      case level >= 3: return 'from-green-500 to-green-700';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getLevelTitle = (level: number) => {
    switch (true) {
      case level >= 7: return 'Legendary';
      case level >= 6: return 'Grandmaster';
      case level >= 5: return 'Master';
      case level >= 4: return 'Expert';
      case level >= 3: return 'Practitioner';
      case level >= 2: return 'Apprentice';
      default: return 'Beginner';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Level Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getMasteryColor(mastery.level)} flex items-center justify-center text-white font-bold text-lg`}>
            {mastery.level}
          </div>
          <div className="ml-4">
            <h3 className="font-bold text-lg">{getLevelTitle(mastery.level)}</h3>
            <p className="text-sm text-gray-600">Tool Mastery</p>
          </div>
        </div>
        {mastery.usageStreak > 0 && (
          <div className="flex items-center text-orange-500">
            <FireIcon className="h-5 w-5 mr-1" />
            <span className="font-medium">{mastery.usageStreak} day streak!</span>
          </div>
        )}
      </div>

      {/* XP Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{mastery.currentXp} XP</span>
          <span>{mastery.nextLevelXp} XP</span>
        </div>
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`absolute left-0 top-0 h-full bg-gradient-to-r ${getMasteryColor(mastery.level)} transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Skill Points */}
      {mastery.skillPoints > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center text-yellow-800">
            <StarIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">{mastery.skillPoints} Skill Points Available!</span>
          </div>
        </div>
      )}

      {/* Features */}
      <div>
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className="flex items-center text-purple-600 hover:text-purple-800 mb-4"
        >
          <LockOpenIcon className="h-5 w-5 mr-2" />
          {showFeatures ? 'Hide Features' : 'Show Unlocked Features'}
        </button>
        
        {showFeatures && (
          <div className="space-y-3">
            {mastery.unlockedFeatures.map((feature) => (
              <div key={feature} className="flex items-center p-3 bg-purple-50 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-purple-800">{feature.split('_').join(' ').toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolMasteryCard;
