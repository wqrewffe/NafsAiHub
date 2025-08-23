import { useState, useEffect } from 'react';
import { getPublicUserProfile, updateUserProfile, PublicUserProfile, getUserByUsername } from '../services/profileService';

export interface PrivacySettings {
  showBio: boolean;
  showToolStats: boolean;
  showBadges: boolean;
  showFavoriteTools: boolean;
}

export const useProfile = (usernameOrUid: string) => {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Handle URL encoded username-uid format
        const decodedParam = decodeURIComponent(usernameOrUid);
        let uid = decodedParam;
        
        if (decodedParam.includes('-')) {
          // Extract UID from the username-uid format
          uid = decodedParam.split('-')[1];
        } else {
          // If it's just a username, try to fetch the UID
          const fetchedUid = await getUserByUsername(decodedParam);
          if (!fetchedUid) {
            setError('User not found');
            setLoading(false);
            return;
          }
          uid = fetchedUid;
        }

        const profileData = await getPublicUserProfile(uid);
        if (!profileData) {
          setError('Profile not found');
          return;
        }

        // Initialize default privacy settings if they don't exist
        if (!profileData.privacySettings) {
          profileData.privacySettings = {
            showBio: true,
            showToolStats: true,
            showBadges: true,
            showFavoriteTools: true
          };
        }

        setProfile(profileData);
      } catch (err) {
        setError('Error loading profile');
        console.error('Error in useProfile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [usernameOrUid]);

  const updatePrivacySettings = async (newSettings: PrivacySettings) => {
    if (!profile) return;

    try {
      await updateUserProfile(profile.uid, {
        ...profile,
        privacySettings: newSettings
      });

      setProfile({
        ...profile,
        privacySettings: newSettings
      });
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      throw new Error('Failed to update privacy settings');
    }
  };

  return {
    profile,
    loading,
    error,
    updatePrivacySettings
  };
};
