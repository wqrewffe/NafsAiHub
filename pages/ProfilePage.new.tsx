import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { BadgesDisplay } from '../components/BadgesDisplay';
import Spinner from '../components/Spinner';
import ProfileHeader from '../components/ProfileHeader';
import { getReferralInfo } from '../services/referralService';
import { getToolUsageInfo } from '../services/toolUsageService';
import { updateUserProfile } from '../services/profileService';
import type { ReferralInfo } from '../types';
import type { ToolUsageInfo } from '../services/toolUsageService';
import type { User } from 'firebase/auth';
import AvatarSelector from '../components/AvatarSelector';

interface ExtendedUser extends User {
  role?: string;
}

import type { PrivacySettings } from '../services/profileService';

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth() as { currentUser: ExtendedUser | null };
  const { profile, loading, error, updatePrivacySettings } = useProfile(username || currentUser?.uid || '');
  
  const isOwnProfile = currentUser?.uid === (profile?.uid || username?.split('-')[1]);

  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [toolUsageInfo, setToolUsageInfo] = useState<ToolUsageInfo | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('/avatars/avatar1.png');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Update selected avatar when profile loads
  useEffect(() => {
    if (profile?.avatarUrl) {
      setSelectedAvatar(profile.avatarUrl);
    }
  }, [profile]);

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!currentUser || !isOwnProfile) return;
    
    try {
      await updateUserProfile(currentUser.uid, { avatarUrl });
      setSelectedAvatar(avatarUrl);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };
  
  // Effect to load additional user info
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!profile) return;

      try {
        if (isOwnProfile && currentUser) {
          // Load both referral and tool data for own profile
          const [referralData, toolData] = await Promise.all([
            getReferralInfo(currentUser.uid),
            getToolUsageInfo(currentUser.uid)
          ]);
          setReferralInfo(referralData);
          setToolUsageInfo(toolData);
        } else {
          // For other users, only load tool usage data
          const toolData = await getToolUsageInfo(profile.uid);
          setToolUsageInfo(toolData);
          setReferralInfo(null); // Reset referral info for other users
        }
      } catch (err) {
        console.error('Error loading user info:', err);
      }
    };

    loadUserInfo();
  }, [currentUser, isOwnProfile, profile]);

  // Redirect to own profile if no username provided
  useEffect(() => {
    if (!username && currentUser?.uid && currentUser.displayName) {
      navigate(`/profile/${currentUser.displayName}-${currentUser.uid}`, { replace: true });
    }
  }, [username, currentUser, navigate]);

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
  if (!profile) return <div className="text-center p-8">Profile not found</div>;

  const handlePrivacyToggle = async (setting: keyof PrivacySettings) => {
    try {
      const newSettings = {
        ...privacySettings,
        [setting]: !privacySettings[setting]
      };
      await updatePrivacySettings(newSettings);
    } catch (err) {
      console.error('Failed to update privacy settings:', err);
      // Reset the UI to the previous state since the update failed
      setShowPrivacySettings(false);
      setShowPrivacySettings(true);
    }
  };

  // Default to showing everything if privacy settings are not set
  const privacySettings = profile.privacySettings || {
    showBio: true,
    showToolStats: true,
    showBadges: true,
    showFavoriteTools: true
  };

  const canViewBio = isOwnProfile || privacySettings.showBio;
  const canViewToolStats = isOwnProfile || privacySettings.showToolStats;
  const canViewBadges = isOwnProfile || privacySettings.showBadges;
  const canViewFavoriteTools = isOwnProfile || privacySettings.showFavoriteTools;

  return (
    <div className="space-y-8 max-w-2xl mx-auto p-4 md:p-0">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-light">
            {isOwnProfile ? 'My Profile' : `${profile.displayName}'s Profile`}
          </h1>
          <p className="text-light/80 mt-2">
            {isOwnProfile ? 'Manage your profile and privacy settings' : 'View user profile and achievements'}
          </p>
        </div>
        {isOwnProfile && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowPrivacySettings(!showPrivacySettings)}
              className="px-4 py-2 rounded-lg bg-secondary text-light hover:bg-secondary/80 transition-colors"
            >
              Privacy Settings
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
      
      {/* Avatar Selection Section */}
      {isOwnProfile && (
        <div className="bg-secondary p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4 text-light">Profile Avatar</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30">
              <img
                src={selectedAvatar}
                alt="Current Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-light">Current Avatar</h3>
              <p className="text-light/80">Choose from our collection of avatars below</p>
            </div>
          </div>
          <AvatarSelector
            selectedAvatar={selectedAvatar}
            onSelect={handleAvatarSelect}
          />
        </div>
      )}

      {/* Privacy Settings Panel */}
      {isOwnProfile && showPrivacySettings && (
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-light">Privacy Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-light">Show Bio</label>
              <input
                type="checkbox"
                checked={privacySettings.showBio}
                onChange={() => handlePrivacyToggle('showBio')}
                className="toggle"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-light">Show Tool Statistics</label>
              <input
                type="checkbox"
                checked={privacySettings.showToolStats}
                onChange={() => handlePrivacyToggle('showToolStats')}
                className="toggle"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-light">Show Badges</label>
              <input
                type="checkbox"
                checked={privacySettings.showBadges}
                onChange={() => handlePrivacyToggle('showBadges')}
                className="toggle"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-light">Show Favorite Tools</label>
              <input
                type="checkbox"
                checked={privacySettings.showFavoriteTools}
                onChange={() => handlePrivacyToggle('showFavoriteTools')}
                className="toggle"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Profile Header and Bio */}
      <div className="bg-secondary p-6 rounded-lg">
        <div className="flex items-center space-x-4 mb-6">
          {profile.avatarUrl ? (
            <img
              src={selectedAvatar}
              alt={profile.displayName}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/50"
            />
          ) : profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/50"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-3xl text-light">
                {profile.displayName?.[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-light">{profile.displayName}</h1>
            <p className="text-light/90 capitalize">{profile.role}</p>
            <p className="text-light/80 text-sm">
              Joined {new Date(profile.joinedDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isOwnProfile && (
          <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
            <AvatarSelector
              selectedAvatar={selectedAvatar}
              onSelect={handleAvatarSelect}
            />
          </div>
        )}

        {canViewBio && profile.bio && (
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
      {canViewToolStats && (
        <div className="bg-secondary p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-light">Tool Usage Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-secondary/50">
              <p className="text-light/80 text-sm">Total Tools Used</p>
              <p className="text-2xl font-bold text-light">{profile.toolUsageStats.totalUsage}</p>
            </div>
            {toolUsageInfo && (
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

          {/* Favorite Tools */}
          {canViewFavoriteTools && profile.toolUsageStats.favoriteTools.length > 0 && (
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

          {/* Category Breakdown */}
          {toolUsageInfo && Object.keys(toolUsageInfo.categoryBreakdown).length > 0 && (
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
      )}

      {/* Badges Display */}
      {canViewBadges && (
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
      )}

      {/* Social Interaction Buttons - Only shown when viewing other profiles */}
      {!isOwnProfile && (
        <div className="bg-secondary p-6 rounded-lg">
          <div className="flex gap-4">
            <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Send Message
            </button>
            <button className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold">
              Add to Study Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
