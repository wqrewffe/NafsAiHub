import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserCircleIcon, AcademicCapIcon, FireIcon, UsersIcon } from '@heroicons/react/24/solid';

interface UserProfile {
  displayName: string;
  bio: string;
  expertise: string[];
  achievements: Achievement[];
  followers: number;
  following: number;
  totalToolUses: number;
  level: number;
  title: string;
  joinedDate: Date;
  topTools: {
    toolId: string;
    uses: number;
  }[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedDate: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const UserProfileCard: React.FC = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [editedExpertise, setEditedExpertise] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    if (!currentUser) return;

    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (profileSnap.exists()) {
      setProfile(profileSnap.data() as UserProfile);
      setEditedBio(profileSnap.data().bio || '');
      setEditedExpertise(profileSnap.data().expertise || []);
    } else {
      // Create default profile
      const defaultProfile: UserProfile = {
        displayName: currentUser.displayName || 'User',
        bio: '',
        expertise: [],
        achievements: [],
        followers: 0,
        following: 0,
        totalToolUses: 0,
        level: 1,
        title: 'Novice Explorer',
        joinedDate: new Date(),
        topTools: []
      };
      await setDoc(profileRef, defaultProfile);
      setProfile(defaultProfile);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !profile) return;

    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    await updateDoc(profileRef, {
      bio: editedBio,
      expertise: editedExpertise
    });

    setProfile({
      ...profile,
      bio: editedBio,
      expertise: editedExpertise
    });
    setIsEditing(false);
  };

  if (!profile) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  const rarityColors = {
    common: 'bg-gray-100 text-gray-800',
    rare: 'bg-blue-100 text-blue-800',
    epic: 'bg-purple-100 text-purple-800',
    legendary: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header/Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8">
        <div className="flex items-center">
          <div className="relative">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-white"
              />
            ) : (
              <UserCircleIcon className="w-20 h-20 text-white" />
            )}
            <span className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></span>
          </div>
          <div className="ml-4 text-white">
            <h2 className="text-2xl font-bold">{profile.displayName}</h2>
            <p className="flex items-center text-purple-200">
              <AcademicCapIcon className="w-4 h-4 mr-1" />
              {profile.title}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b">
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{profile.level}</p>
          <p className="text-sm text-gray-600">Level</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{profile.followers}</p>
          <p className="text-sm text-gray-600">Followers</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{profile.following}</p>
          <p className="text-sm text-gray-600">Following</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{profile.totalToolUses}</p>
          <p className="text-sm text-gray-600">Tools Used</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Bio Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">About</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Edit
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={3}
                placeholder="Write something about yourself..."
              />
              <div>
                <label className="block text-sm font-medium mb-2">Expertise</label>
                <input
                  type="text"
                  value={editedExpertise.join(', ')}
                  onChange={(e) => setEditedExpertise(e.target.value.split(',').map(s => s.trim()))}
                  className="w-full p-2 border rounded-lg"
                  placeholder="AI, Machine Learning, Data Science..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">{profile.bio || 'No bio yet'}</p>
              {profile.expertise.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.expertise.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Achievements Section */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Recent Achievements</h3>
          <div className="space-y-3">
            {profile.achievements.slice(0, 3).map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg ${rarityColors[achievement.rarity]} flex items-center`}
              >
                <div className="flex-1">
                  <h4 className="font-medium">{achievement.name}</h4>
                  <p className="text-sm opacity-75">{achievement.description}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-white bg-opacity-25 rounded">
                  {achievement.rarity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Tools Section */}
        <div>
          <h3 className="font-semibold mb-4">Most Used Tools</h3>
          <div className="space-y-3">
            {profile.topTools.map((tool) => (
              <div
                key={tool.toolId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{tool.toolId}</span>
                <span className="text-gray-600">{tool.uses} uses</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
