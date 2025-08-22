import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { personalizationService } from '../services/personalizationService';
import { Tool } from '../types';
import { tools } from '../tools';
import { SparklesIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/solid';

interface PersonalizedSectionProps {
  onToolSelect: (toolId: string) => void;
}

const PersonalizedSection: React.FC<PersonalizedSectionProps> = ({ onToolSelect }) => {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [interests, setInterests] = useState<string[]>([]);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    loadRecommendations();
    loadUserPreferences();
  }, [currentUser]);

  const loadRecommendations = async () => {
    try {
      const recs = await personalizationService.getPersonalizedRecommendations(currentUser!.uid);
      const recommendedTools = recs.map(rec => ({
        ...tools.find(t => t.id === rec.toolId)!,
        reason: rec.reason
      }));
      setRecommendations(recommendedTools as Tool[]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const prefs = await personalizationService.getUserPreferences(currentUser!.uid);
      setInterests(prefs.interests);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleAddInterest = async () => {
    if (!newInterest.trim()) return;
    
    const updatedInterests = [...interests, newInterest.trim()];
    try {
      await personalizationService.updateInterests(currentUser!.uid, updatedInterests);
      setInterests(updatedInterests);
      setNewInterest('');
      loadRecommendations(); // Refresh recommendations
    } catch (error) {
      console.error('Error updating interests:', error);
    }
  };

  const handleRemoveInterest = async (interest: string) => {
    const updatedInterests = interests.filter(i => i !== interest);
    try {
      await personalizationService.updateInterests(currentUser!.uid, updatedInterests);
      setInterests(updatedInterests);
      loadRecommendations(); // Refresh recommendations
    } catch (error) {
      console.error('Error updating interests:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <SparklesIcon className="h-6 w-6 text-purple-500 mr-2" />
          Personalized For You
        </h2>
        <button
          onClick={() => setIsEditingInterests(!isEditingInterests)}
          className="text-sm text-purple-600 hover:text-purple-800"
        >
          {isEditingInterests ? 'Done' : 'Customize'}
        </button>
      </div>

      {/* Interests Section */}
      {isEditingInterests && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium mb-3">Your Interests</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {interests.map(interest => (
              <span
                key={interest}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
              >
                {interest}
                <button
                  onClick={() => handleRemoveInterest(interest)}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add new interest..."
              className="flex-1 px-3 py-2 border rounded-lg"
              onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
            />
            <button
              onClick={handleAddInterest}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {loading ? (
        <div className="text-center py-4">Loading your recommendations...</div>
      ) : (
        <div className="grid gap-4">
          {recommendations.map((tool) => (
            <div
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-medium">{tool.name}</h3>
                <p className="text-sm text-gray-600">{(tool as any).reason}</p>
              </div>
              <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonalizedSection;
