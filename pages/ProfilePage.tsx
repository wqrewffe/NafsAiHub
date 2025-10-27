import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { BadgesDisplay } from '../components/BadgesDisplay';
import Spinner from '../components/Spinner';
import { getReferralInfo } from '../services/referralService';
import { getToolUsageInfo } from '../services/toolUsageService';
import { followUser, unfollowUser, getFollowersCount, checkIsFollowing } from '../services/firebaseService';
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
  const isOwnProfile = currentUser?.uid === profile?.uid;

  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [toolUsageInfo, setToolUsageInfo] = useState<ToolUsageInfo | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  
  // State for UI controls
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editing, setEditing] = useState(false);

  // State for previews and editing form fields
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(profile?.avatarUrl);
  const [bannerPreview, setBannerPreview] = useState<string | undefined>(profile?.bannerBase64);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile?.avatarBase64);
  const [location, setLocation] = useState(profile?.location || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [pronouns, setPronouns] = useState(profile?.pronouns || '');
  const [socialLinks, setSocialLinks] = useState<{[k:string]:string}>(profile?.socialLinks || {});
  
  // Effect to synchronize local state when the profile data is loaded or updated.
  useEffect(() => {
    if (profile) {
      setSelectedAvatar(profile.avatarUrl);
      setAvatarPreview(profile.avatarBase64 || undefined); // Ensure preview is cleared if base64 is removed
      setBannerPreview(profile.bannerBase64 || undefined);
      setLocation(profile.location || '');
      setWebsite(profile.website || '');
      setPronouns(profile.pronouns || '');
      setSocialLinks(profile.socialLinks || {});
    }
  }, [profile]);

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!currentUser || !isOwnProfile) return;
    
    try {
      // Store the avatar URL and clear any existing base64 upload
      await updateUserProfile(currentUser.uid, { avatarUrl: avatarUrl, avatarBase64: undefined });
      
      if (profile) {
        const updatedProfile = { ...profile, avatarUrl, avatarBase64: undefined };
        setProfile(updatedProfile);
        setAvatarPreview(undefined); // Clear local preview
        setSelectedAvatar(avatarUrl);
      }
      
      setShowAvatarPicker(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  // Helper: convert file to base64 (data url)
  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read file as base64'));
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

  const handleAvatarUpload = async (file: File) => {
    if (!currentUser || !isOwnProfile) return;
    try {
      // Limit file size to 2MB
      if (file.size > 1024 * 1024 * 2) {
        alert('Please choose an image smaller than 2MB');
        return;
      }
      const base64 = await fileToBase64(file);
      // Save base64 into Firestore and clear the avatar URL
      await updateUserProfile(currentUser.uid, { avatarBase64: base64, avatarUrl: undefined });
      setAvatarPreview(base64);
      setSelectedAvatar(undefined);
      if (profile) setProfile({ ...profile, avatarBase64: base64, avatarUrl: undefined });
    } catch (err) {
      console.error('Error uploading avatar file:', err);
    }
  };

  const handleBannerUpload = async (file: File) => {
    if (!currentUser || !isOwnProfile) return;
    try {
      if (file.size > 1024 * 1024 * 3) { // 3MB limit for banners
        alert('Please choose a banner smaller than 3MB');
        return;
      }
      const base64 = await fileToBase64(file);
      await updateUserProfile(currentUser.uid, { bannerBase64: base64 });
      setBannerPreview(base64);
      if (profile) setProfile({ ...profile, bannerBase64: base64 });
    } catch (err) {
      console.error('Error uploading banner file:', err);
    }
  };

  const handleSaveProfileDetails = async () => {
    if (!currentUser || !isOwnProfile) return;
    try {
      const updatedDetails = { location, website, pronouns, socialLinks };
      await updateUserProfile(currentUser.uid, updatedDetails);
      if (profile) setProfile({ ...profile, ...updatedDetails });
      setEditing(false);
      alert('Profile updated');
    } catch (err) {
      console.error('Error saving profile details:', err);
    }
  };

  // Load referral and tool usage info for the profile being viewed (publicly visible)
  useEffect(() => {
    const loadProfileExtras = async () => {
      if (profile?.uid) {
        try {
          const referralPromise = getReferralInfo(profile.uid);
          const toolUsagePromise = getToolUsageInfo(profile.uid);
          const followersPromise = getFollowersCount(profile.uid);
          const isFollowingPromise = currentUser ? checkIsFollowing(currentUser.uid, profile.uid) : Promise.resolve(false);

          const [referralData, toolData, fc, following] = await Promise.all([
            referralPromise,
            toolUsagePromise,
            followersPromise,
            isFollowingPromise
          ]);

          setReferralInfo(referralData);
          setToolUsageInfo(toolData);
          setFollowersCount(fc || 0);
          setIsFollowing(Boolean(following));
        } catch (err) {
          console.error('Error loading profile extras:', err);
        }
      }
    };
    loadProfileExtras();
  }, [profile?.uid, currentUser]);

  // Effect to redirect to the user's own profile page if they navigate to /profile directly
  useEffect(() => {
    if (!username && currentUser?.uid && currentUser.displayName) {
      navigate(`/profile/${currentUser.displayName}-${currentUser.uid}`, { replace: true });
    }
  }, [username, currentUser, navigate]);

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
  if (!profile) return <div className="text-center p-8">Profile not found</div>;

  const avatarSrc = avatarPreview || selectedAvatar || profile.photoURL;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4">
      <div>
        <h1 className="text-3xl font-bold text-light">Profile</h1>
        <p className="text-light/80 mt-2">View account information and achievements. Your profile details, avatar, and banner are publicly visible.</p>
      </div>
      
      {/* Profile Header, Banner and Bio */}
      <div className="bg-secondary rounded-lg overflow-hidden shadow-lg">
        {/* Banner area */}
        <div className="relative w-full h-48 bg-primary/10">
          {bannerPreview ? (
            <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-light/60">No banner</div>
          )}
          {isOwnProfile && (
            <div className="absolute top-3 right-3">
              <label className="bg-primary/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-md cursor-pointer text-sm hover:bg-primary transition-colors">
                Upload Banner
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleBannerUpload(e.target.files[0]); }} />
              </label>
            </div>
          )}
        </div>

        {/* Profile Content Area */}
        <div className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-20">
              {/* Avatar Column */}
              <div className="flex-shrink-0 flex flex-col items-center">
                  <div 
                    className="relative group w-32 h-32"
                    onClick={() => isOwnProfile && setShowAvatarPicker(true)}
                  >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={profile.displayName}
                      className="w-full h-full rounded-full object-cover border-4 border-secondary shadow-md"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center border-4 border-secondary shadow-md">
                      <span className="text-5xl text-light">
                        {profile.displayName?.[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="mt-3 text-center">
                    <label className="text-accent hover:underline cursor-pointer text-sm">
                        Upload an image
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }} />
                    </label>
                    <p className="text-light/60 text-xs mt-1">or click to pick one</p>
                  </div>
                )}
              </div>

              {/* Info Column */}
              <div className="flex-grow text-center sm:text-left pt-6 sm:pt-14">
                <h1 className="text-3xl font-bold text-light">{profile.displayName}</h1>
                <p className="text-light/90 capitalize">{profile.role}</p>
                <p className="text-light/80 text-sm">
                  Joined {new Date(profile.joinedDate).toLocaleDateString()}
                </p>
                <p className="text-light/90 text-sm mt-2">Followers: <span className="font-bold">{followersCount}</span></p>
                
                {profile.bio && (
                  <div className="mt-4">
                    <h2 className="text-lg font-semibold mb-2 text-light">About</h2>
                    <p className="text-light/90 whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}
                {!isOwnProfile && currentUser && (
                  <div className="mt-4">
                    <button
                      onClick={async () => {
                        try {
                          if (isFollowing) {
                            await unfollowUser(currentUser.uid, profile.uid);
                            setIsFollowing(false);
                            setFollowersCount(c => Math.max(0, c - 1));
                          } else {
                            await followUser(currentUser.uid, profile.uid);
                            setIsFollowing(true);
                            setFollowersCount(c => c + 1);
                          }
                        } catch (err) {
                          console.error('Follow action failed', err);
                        }
                      }}
                      className={`px-4 py-2 rounded-md ${isFollowing ? 'bg-secondary/80 text-light' : 'bg-accent text-white'}`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Public Profile Details */}
            <div className="mt-8 pt-6 border-t border-primary/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-light/80 text-sm font-semibold">Location</p>
                  {editing && isOwnProfile ? (
                    <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full mt-1 p-2 rounded bg-primary/20 text-light border border-primary/30 focus:ring-accent focus:border-accent" />
                  ) : (
                    <p className="text-light/90">{profile.location || '—'}</p>
                  )}
                </div>
                <div>
                  <p className="text-light/80 text-sm font-semibold">Website</p>
                  {editing && isOwnProfile ? (
                    <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full mt-1 p-2 rounded bg-primary/20 text-light border border-primary/30 focus:ring-accent focus:border-accent" />
                  ) : (
                    profile.website ? <a className="text-accent underline hover:text-accent/80" href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a> : <p className="text-light/90">—</p>
                  )}
                </div>
                <div>
                  <p className="text-light/80 text-sm font-semibold">Pronouns</p>
                  {editing && isOwnProfile ? (
                    <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} className="w-full mt-1 p-2 rounded bg-primary/20 text-light border border-primary/30 focus:ring-accent focus:border-accent" />
                  ) : (
                    <p className="text-light/90">{profile.pronouns || '—'}</p>
                  )}
                </div>
                <div>
                  <p className="text-light/80 text-sm font-semibold">Social</p>
                  {editing && isOwnProfile ? (
                    <input value={socialLinks['twitter'] || ''} onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })} placeholder="Twitter URL" className="w-full mt-1 p-2 rounded bg-primary/20 text-light border border-primary/30 focus:ring-accent focus:border-accent" />
                  ) : (
                    profile.socialLinks?.twitter ? <a className="text-accent underline hover:text-accent/80" href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">Twitter</a> : <p className="text-light/90">—</p>
                  )}
                </div>
              </div>
              {isOwnProfile && (
                <div className="mt-6">
                  {editing ? (
                    <div className="flex gap-3">
                      <button onClick={handleSaveProfileDetails} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/80 transition-colors">Save</button>
                      <button onClick={() => setEditing(false)} className="bg-secondary/70 text-light px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditing(true)} className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/80 transition-colors">Edit Profile Details</button>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>

      {showAvatarPicker && isOwnProfile && (
        <AvatarPicker
          currentAvatar={profile.avatarUrl}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      {/* Referral Stats - Only shown on own profile */}
  {referralInfo && (
        <div className="bg-secondary p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-light">Referral Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-primary/20">
              <p className="text-light/80 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold text-light">{referralInfo.referralsCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-primary/20">
              <p className="text-light/80 text-sm">Rewards Points</p>
              <p className="text-2xl font-bold text-light">
                {currentUser?.role === 'admin' ? '∞' : referralInfo.rewards}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-primary/20">
              <p className="text-light/80 text-sm">Referral Code</p>
              <p className="text-xl font-mono text-accent">{referralInfo.referralCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tool Usage Stats */}
      <div className="bg-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-light">Tool Usage Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-primary/20">
            <p className="text-light/80 text-sm">Total Tools Used</p>
            <p className="text-2xl font-bold text-light">{profile.toolUsageStats.totalUsage}</p>
          </div>
          {toolUsageInfo && (
            <>
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-primary/20">
                <p className="text-light/80 text-sm">Unique Tools</p>
                <p className="text-2xl font-bold text-light">
                  {toolUsageInfo.totalTools ?? Object.keys(toolUsageInfo.categoryBreakdown).length}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/40 border border-primary/20">
                <p className="text-light/80 text-sm">Tool Level</p>
                <p className="text-2xl font-bold text-light">{toolUsageInfo.level}</p>
              </div>
            </>
          )}
        </div>

        {profile.toolUsageStats.favoriteTools.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-light">Favorite Tools</h3>
            <div className="flex flex-wrap gap-3">
              {profile.toolUsageStats.favoriteTools.map((tool) => (
                <div key={tool} className="px-3 py-2 rounded-md bg-gradient-to-br from-primary/30 to-secondary/40 border border-primary/20">
                  <p className="text-light/90">{tool}</p>
                </div>
              ))}
            </div>
          </div>
        )}

  {toolUsageInfo && Object.keys(toolUsageInfo.categoryBreakdown).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-light">Usage by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(toolUsageInfo.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="p-3 rounded-md bg-gradient-to-br from-primary/30 to-secondary/40 border border-primary/20">
                  <p className="text-light/80 text-sm capitalize">{category}</p>
                  <p className="text-lg font-bold text-light">{count} uses</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Badges Display */}
      <div className="bg-secondary p-6 rounded-lg shadow-lg">
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

  {(
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/settings')}
            className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/80 transition-colors font-semibold"
          >
            Go to Settings
          </button>
        </div>
  )}
    </div>
  );
}

export default ProfilePage;
