import React, { useState, useEffect } from 'react';
import { 
  getPublicUserProfile, 
  updateUserProfile, 
  PublicUserProfile, 
  getUserByUsername, 
  PrivacySettings,
  defaultPrivacySettings
} from '../services/profileService';
import { db } from '../firebase/config';

export const useProfile = (usernameOrUid: string) => {
  type ProfileHook = {
    profile: PublicUserProfile | null;
    loading: boolean;
    error: string | null;
    updatePrivacySettings: (settings: PrivacySettings) => Promise<void>;
    setProfile: React.Dispatch<React.SetStateAction<PublicUserProfile | null>>;
  };
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updatePrivacySettings = async (newSettings: PrivacySettings) => {
    if (!profile) return;
    try {
      await updateUserProfile(profile.uid, { privacySettings: newSettings });
      setProfile(prev => prev ? { ...prev, privacySettings: newSettings } : null);
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      throw err;
    }
  };

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

        // Set up real-time listener for profile changes
        const unsubscribe = db.collection('users').doc(uid)
          .onSnapshot(doc => {
            if (doc.exists) {
              const userData = doc.data();
              if (userData) {
                const profileData = {
                  uid,
                  displayName: userData.displayName || 'Anonymous User',
                  photoURL: userData.photoURL,
                  avatarUrl: userData.avatarUrl,
                  avatarBase64: userData.avatarBase64,
                  bannerBase64: userData.bannerBase64,
                  location: userData.location || '',
                  website: userData.website || '',
                  pronouns: userData.pronouns || '',
                  socialLinks: userData.socialLinks || {},
                  bio: userData.bio || '',
                  badges: userData.badges || [],
                  joinedDate: userData.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
                  role: userData.role || 'user',
                  // Will be filled below with actual tool usage info if available
                  toolUsageStats: {
                    totalUsage: 0,
                    favoriteTools: []
                  },
                  privacySettings: userData.privacySettings || defaultPrivacySettings
                };

                // Attempt to merge tool usage information from the separate `toolUsage` collection.
                // Fall back to `users.totalUsage` (kept updated by logToolUsage) when present.
                (async () => {
                  try {
                    const toolUsageDoc = await db.collection('toolUsage').doc(uid).get();
                    const tuData = toolUsageDoc.exists ? toolUsageDoc.data() : {};

                    profileData.toolUsageStats = {
                      totalUsage: (tuData && (tuData.totalUsage || tuData.totalUses)) || (userData.totalUsage || 0),
                      favoriteTools: (tuData && tuData.favoriteTools) || []
                    };
                  } catch (err) {
                    console.error('Error loading tool usage for profile:', err);
                    // still populate with whatever is on the users doc
                    profileData.toolUsageStats = {
                      totalUsage: userData.totalUsage || 0,
                      favoriteTools: []
                    };
                  } finally {
                    console.log('Profile updated:', profileData);
                    setProfile(profileData);
                  }
                })();
              }
            } else {
              setError('Profile not found');
            }
            setLoading(false);
          }, error => {
            console.error('Error loading profile:', error);
            setError('Error loading profile');
            setLoading(false);
          });

        return () => unsubscribe();
      } catch (err) {
        setError('Error loading profile');
        console.error('Error in useProfile:', err);
        setLoading(false);
      }
    };

    loadProfile();
  }, [usernameOrUid]);

  return {
    profile,
    loading,
    error,
    updatePrivacySettings,
    setProfile
  } as ProfileHook;
};
