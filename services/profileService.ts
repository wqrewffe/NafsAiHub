import { db } from '../firebase/config';

export interface PrivacySettings {
  showBio: boolean;
  showToolStats: boolean;
  showBadges: boolean;
  showFavoriteTools: boolean;
}

export interface PublicUserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  avatarUrl?: string;
  bio: string;
  badges: string[];
  joinedDate: string;
  role: string;
  toolUsageStats: {
    totalUsage: number;
    favoriteTools: string[];
  };
  privacySettings?: PrivacySettings;
}

export const defaultPrivacySettings: PrivacySettings = {
  showBio: true,
  showToolStats: true,
  showBadges: true,
  showFavoriteTools: true
};

export const getPublicUserProfile = async (uid: string): Promise<PublicUserProfile | null> => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (!userData) return null;

    const toolUsageDoc = await db.collection('toolUsage').doc(uid).get();
    const toolUsageData = toolUsageDoc.data() || {};

    // Use avatarUrl exactly as stored
    const avatarUrl = userData.avatarUrl;

    return {
      uid,
      displayName: userData.displayName || 'Anonymous User',
      photoURL: userData.photoURL,
      avatarUrl: avatarUrl,
      bio: userData.bio || '',
      badges: userData.badges || [],
      joinedDate: userData.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      role: userData.role || 'user',
      toolUsageStats: {
        totalUsage: toolUsageData.totalUsage || 0,
        favoriteTools: toolUsageData.favoriteTools || []
      },
      privacySettings: userData.privacySettings || defaultPrivacySettings
    };
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, profile: Partial<PublicUserProfile>): Promise<void> => {
  try {
    const userRef = db.collection('users').doc(uid);
    
    // Only update allowed fields
    const updates: any = {};
    
    if (profile.bio !== undefined) updates.bio = profile.bio;
    if (profile.privacySettings) updates.privacySettings = profile.privacySettings;
    if (profile.avatarUrl !== undefined) {
      // Store the exact path from public/avatars
      updates.avatarUrl = `/avatars/${profile.avatarUrl.split('/').pop()}`; // Get just the filename
    }
    
    console.log('Updating profile with:', updates);
    await userRef.update(updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserByUsername = async (username: string): Promise<string | null> => {
  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).limit(1).get();
    
    if (snapshot.empty) return null;
    
    return snapshot.docs[0].id;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return null;
  }
};
