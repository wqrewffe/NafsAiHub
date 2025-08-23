import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { BadgesDisplay } from '../components/BadgesDisplay';
import Spinner from '../components/Spinner';
import { getReferralInfo } from '../services/referralService';
import { getToolUsageInfo } from '../services/toolUsageService';
import type { ReferralInfo } from '../types';
import type { ToolUsageInfo } from '../services/toolUsageService';
import type { User } from 'firebase/auth';
import AvatarPicker from '../components/AvatarPicker';
import { updateUserProfile } from '../services/profileService';

// The User type from firebase/auth might not have a 'role' property.
// This interface extends it to include the custom role property for our app.
interface ExtendedUser extends User {
  role?: string;
}

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth() as { currentUser: ExtendedUser | null };
  const { profile, loading, error, setProfile } = useProfile(username || currentUser?.uid || '');
  
  // Determine if the currently viewed profile belongs to the logged-in user.
  // It checks against the fetched profile's UID or falls back to parsing the UID from the URL.
  const isOwnProfile = currentUser?.uid === (profile?.uid || username?.split('-')[1]);

  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [toolUsageInfo, setToolUsageInfo] = useState<ToolUsageInfo | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [selectedAvatar, setSelectedAvatar] = useState<string>(profile?.avatarUrl || '/avatars/avatar1.png');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  // Update selected avatar when profile changes
  useEffect(() => {
    if (profile?.avatarUrl) {
      setSelectedAvatar(profile.avatarUrl);
    }
  }, [profile]);

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!currentUser || !isOwnProfile) return;
    
    try {
      // Store the avatar URL exactly as received from AvatarPicker
      const rawAvatarUrl = avatarUrl.startsWith('/avatars/') ? avatarUrl : `/avatars/${avatarUrl.split('/').pop()}`;
      await updateUserProfile(currentUser.uid, { avatarUrl: rawAvatarUrl });
      
      // After successful Firebase update, update local states
      if (profile) {
        const updatedProfile = { ...profile, avatarUrl: rawAvatarUrl };
        setProfile(updatedProfile);
        setSelectedAvatar(rawAvatarUrl);
      }
      
      // Close the avatar picker
      setShowAvatarPicker(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  // Effect to load additional private user info (referrals, detailed tool usage)
  // This runs only when viewing one's own profile.
  useEffect(() => {
    const loadPrivateUserInfo = async () => {
      if (isOwnProfile && currentUser) {
        try {
          // Fetch referral and tool data in parallel for efficiency
          const [referralData, toolData] = await Promise.all([
            getReferralInfo(currentUser.uid),
            getToolUsageInfo(currentUser.uid)
          ]);
          
          setReferralInfo(referralData);
          setToolUsageInfo(toolData);
        } catch (err) {
          console.error('Error loading private user info:', err);
        }
      }
    };

    loadPrivateUserInfo();
  }, [currentUser, isOwnProfile]);

  // Effect to redirect to the user's own profile page if they navigate to /profile directly
  useEffect(() => {
    if (!username && currentUser?.uid && currentUser.displayName) {
      navigate(`/profile/${currentUser.displayName}-${currentUser.uid}`, { replace: true });
    }
  }, [username, currentUser, navigate]);

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
  if (!profile) return <div className="text-center p-8">Profile not found</div>;

  return (
    <div className="space-y-8 max-w-2xl mx-auto p-4 md:p-0">
      <div>
        <h1 className="text-3xl font-bold text-light">Profile</h1>
        <p className="text-light/80 mt-2">View account information and achievements.</p>
      </div>
      
      {/* Profile Header and Bio */}
      <div className="bg-secondary p-6 rounded-lg">
        <div className="flex items-center space-x-4 mb-6">
          {selectedAvatar || profile.avatarUrl ? (
            <div 
              className="relative cursor-pointer"
              onClick={() => isOwnProfile && setShowAvatarPicker(true)}
            >
              <img
                src={selectedAvatar || profile.avatarUrl}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full object-cover border-2 border-primary/50"
              />
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-full transition-all duration-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 hover:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
              )}
            </div>
          ) : profile.photoURL ? (
            <div 
              className="relative cursor-pointer"
              onClick={() => isOwnProfile && setShowAvatarPicker(true)}
            >
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="w-24 h-24 rounded-full object-cover border-2 border-primary/50"
              />
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-full transition-all duration-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 hover:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center border-2 border-primary/50"
              style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
              onClick={() => isOwnProfile && setShowAvatarPicker(true)}
            >
              <span className="text-4xl text-light">
                {profile.displayName?.[0].toUpperCase()}
              </span>
            </div>
          )}
          {isOwnProfile && (
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/80 transition-colors"
              title="Change Avatar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
          {showAvatarPicker && isOwnProfile && (
            <AvatarPicker
              currentAvatar={profile.avatarUrl}
              onSelect={handleAvatarSelect}
              onClose={() => setShowAvatarPicker(false)}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-light">{profile.displayName}</h1>
            <p className="text-light/90 capitalize">{profile.role}</p>
            <p className="text-light/80 text-sm">
              Joined {new Date(profile.joinedDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {profile.bio && (
          <div>
            <h2 className="text-lg font-semibold mb-2 text-light">About</h2>
            <p className="text-light/90 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}
      </div>

      {/* Referral Stats - Only shown on own profile */}
      {isOwnProfile && referralInfo && (
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-light">Referral Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold text-light">{referralInfo.referralsCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Rewards Points</p>
              <p className="text-2xl font-bold text-light">
                {currentUser?.role === 'admin' ? '∞' : referralInfo.rewards}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Referral Code</p>
              <p className="text-xl font-mono text-light">{referralInfo.referralCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tool Usage Stats */}
      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-light">Tool Usage Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
            <p className="text-light/80 text-sm">Total Tools Used</p>
            <p className="text-2xl font-bold text-light">{profile.toolUsageStats.totalUsage}</p>
          </div>
          {/* Detailed stats only for own profile */}
          {isOwnProfile && toolUsageInfo && (
            <>
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
                <p className="text-light/80 text-sm">Unique Tools</p>
                <p className="text-2xl font-bold text-light">
                  {Object.keys(toolUsageInfo.categoryBreakdown).length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
                <p className="text-light/80 text-sm">Tool Level</p>
                <p className="text-2xl font-bold text-light">{toolUsageInfo.level}</p>
              </div>
            </>
          )}
        </div>

        {/* Favorite Tools - Publicly visible */}
        {profile.toolUsageStats.favoriteTools.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-light">Favorite Tools</h3>
            <div className="flex flex-wrap gap-3">
              {profile.toolUsageStats.favoriteTools.map((tool) => (
                <div key={tool} className="p-3 rounded bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
                  <p className="text-light/90">{tool}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Breakdown - Only shown on own profile */}
        {isOwnProfile && toolUsageInfo && Object.keys(toolUsageInfo.categoryBreakdown).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-light">Usage by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(toolUsageInfo.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="p-3 rounded bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
                  <p className="text-light/80 text-sm capitalize">{category}</p>
                  <p className="text-lg font-bold text-light">{count} uses</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Badges Display */}
      <div className="bg-secondary p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-light">Badges & Achievements</h2>
        <BadgesDisplay 
          badges={profile.badges}
          toolBadges={toolUsageInfo?.badges}
          referralLevel={referralInfo?.level}
          nextLevelPoints={referralInfo?.nextLevelPoints}
          toolLevel={toolUsageInfo?.level}
          nextLevelTools={toolUsageInfo?.nextLevelTools}
          totalUsage={profile.toolUsageStats.totalUsage}
          categoryBreakdown={toolUsageInfo?.categoryBreakdown}
          isOwnProfile={isOwnProfile}
        />
      </div>

      {/* Edit Profile Button */}
      {isOwnProfile && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/settings')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;