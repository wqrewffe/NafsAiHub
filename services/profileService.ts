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
  avatarBase64?: string; // optional custom uploaded avatar encoded as base64
  bannerBase64?: string; // optional uploaded banner encoded as base64
  location?: string;
  website?: string;
  pronouns?: string;
  socialLinks?: { [key: string]: string };
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

    // Try to read aggregated toolUsage document (root collection) first
    let totalUsage = userData.totalUsage || 0;
    let favoriteTools: string[] = [];
    try {
      // Some deployments keep a per-user aggregated doc in `toolUsage/{uid}`
      const toolUsageDoc = await db.collection('toolUsage').doc(uid).get();
      const toolUsageData = toolUsageDoc.exists ? (toolUsageDoc.data() || {}) : {};
      if (toolUsageData && (toolUsageData.totalUsage || toolUsageData.totalUses)) {
        totalUsage = toolUsageData.totalUsage || toolUsageData.totalUses || totalUsage;
      }
      if (toolUsageData && Array.isArray(toolUsageData.favoriteTools)) {
        favoriteTools = toolUsageData.favoriteTools;
      }
    } catch (err) {
      console.warn('Failed to read root toolUsage doc, falling back to users.totalUsage', err);
    }

    // Fallback: try to compute totals from the user's subcollection entries if the aggregated doc isn't present
    try {
      const userToolUsageRef = db.collection('users').doc(uid).collection('toolUsage');
      const snapshot = await userToolUsageRef.get();
      if (!snapshot.empty) {
        let computedTotal = 0;
        snapshot.forEach(doc => {
          const d = doc.data();
          if (typeof d.count === 'number') computedTotal += d.count;
        });
        if (computedTotal > 0) totalUsage = computedTotal;
      }
    } catch (err) {
      // ignore and use existing totals
    }

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
        totalUsage: totalUsage || 0,
        favoriteTools: favoriteTools || []
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
    // Preserve existing behavior for avatarUrl when provided, but allow raw paths
    if (profile.avatarUrl !== undefined) {
      updates.avatarUrl = profile.avatarUrl;
    }

    // Support storing base64 payloads directly into Firestore (as requested)
    if (profile.avatarBase64 !== undefined) {
      updates.avatarBase64 = profile.avatarBase64;
    }
    if (profile.bannerBase64 !== undefined) {
      updates.bannerBase64 = profile.bannerBase64;
    }

    if (profile.location !== undefined) updates.location = profile.location;
    if (profile.website !== undefined) updates.website = profile.website;
    if (profile.pronouns !== undefined) updates.pronouns = profile.pronouns;
    if (profile.socialLinks !== undefined) updates.socialLinks = profile.socialLinks;
    
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
