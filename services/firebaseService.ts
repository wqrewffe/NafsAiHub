

import { db, serverTimestamp, auth } from '../firebase/config';
import { HistoryItem, FirestoreUser, Todo, Note } from '../types';
import firebase from 'firebase/compat/app';
import { generateReferralCode } from './referralService';

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        // Get user data first to verify it exists
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        // Start a batch write
        const batch = db.batch();

        // Delete user's tool usage data
        const toolUsageRef = db.collection('users').doc(userId).collection('toolUsage');
        const toolUsageDocs = await toolUsageRef.get();
        toolUsageDocs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Delete user document
        batch.delete(db.collection('users').doc(userId));

        // Commit the batch
        await batch.commit();

        console.log(`Successfully deleted user ${userId}`);
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

export const toggleUserBlock = async (userId: string, blocked: boolean): Promise<void> => {
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        await userRef.update({
            isBlocked: blocked
        });

        console.log(`Successfully ${blocked ? 'blocked' : 'unblocked'} user ${userId}`);
    } catch (error) {
        console.error('Error toggling user block status:', error);
        throw error;
    }
};

export const createUserProfileDocument = async (user: firebase.User, password?: string) => {
  if (!user) return;
  const userRef = db.collection('users').doc(user.uid);
  const snapshot = await userRef.get();
  const { email, displayName } = user;
  const createdAt = serverTimestamp();
  try {
    const referralCode = generateReferralCode(user.uid);
    const isAdmin = email === 'nafisabdullah424@gmail.com';

    // Base data we want to ensure exists for every user
    const baseUserData: any = {
      createdAt,
      totalUsage: 0,
      role: isAdmin ? 'admin' : 'user',
      points: isAdmin ? Number.MAX_SAFE_INTEGER : 0,
      referralInfo: {
        referralCode,
        referralsCount: 0,
        rewards: isAdmin ? Number.MAX_SAFE_INTEGER : 0,
        referralHistory: []
      }
    };

    // If the document doesn't exist, create it with full info
    if (!snapshot.exists) {
      const userData: any = {
        displayName: displayName || null,
        email: email || null,
        ...baseUserData
      };
      if (password) userData.password = password;

      await userRef.set(userData);
    } else {
      // If doc exists, merge any missing public identity fields (email/displayName/password)
      const existing = snapshot.data() || {};
      const updates: any = {};
      if ((!existing.email || existing.email === null) && email) updates.email = email;
      if ((!existing.displayName || existing.displayName === null) && displayName) updates.displayName = displayName;
      if (password) updates.password = password;

      // Also ensure createdAt is set if missing
      if (!existing.createdAt) updates.createdAt = createdAt;

      if (Object.keys(updates).length > 0) {
        await userRef.set(updates, { merge: true });
      }
    }

    // Try to persist the user's public IP (best-effort)
    try {
      const resp = await fetch('https://api.ipify.org?format=json');
      const json = await resp.json();
      const ip = json?.ip;
      if (ip) {
        await userRef.set({ lastIp: ip, lastIpUpdated: serverTimestamp() }, { merge: true });
      }
    } catch (e) {
      // Non-fatal: just log and continue
      console.warn('Failed to fetch or save user IP on profile creation', e);
    }
  } catch (error) {
    console.error("Error creating or updating user profile", error);
  }
};

// Follow/unfollow helpers
export const followUser = async (currentUserId: string, targetUserId: string) => {
  if (!currentUserId || !targetUserId) return;
  try {
    const batch = db.batch();
    const followerRef = db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId);
    const followingRef = db.collection('users').doc(currentUserId).collection('following').doc(targetUserId);

    batch.set(followerRef, { userId: currentUserId, followedAt: serverTimestamp() });
    batch.set(followingRef, { userId: targetUserId, followedAt: serverTimestamp() });

    // Increment counters on user docs for quick display
    batch.set(db.collection('users').doc(targetUserId), { followersCount: firebase.firestore.FieldValue.increment(1) }, { merge: true });
    batch.set(db.collection('users').doc(currentUserId), { followingCount: firebase.firestore.FieldValue.increment(1) }, { merge: true });

    await batch.commit();
  } catch (err) {
    console.error('Error following user:', err);
    throw err;
  }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  if (!currentUserId || !targetUserId) return;
  try {
    const batch = db.batch();
    const followerRef = db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId);
    const followingRef = db.collection('users').doc(currentUserId).collection('following').doc(targetUserId);

    batch.delete(followerRef);
    batch.delete(followingRef);

    // Decrement counters on user docs for quick display
    batch.set(db.collection('users').doc(targetUserId), { followersCount: firebase.firestore.FieldValue.increment(-1) }, { merge: true });
    batch.set(db.collection('users').doc(currentUserId), { followingCount: firebase.firestore.FieldValue.increment(-1) }, { merge: true });

    await batch.commit();
  } catch (err) {
    console.error('Error unfollowing user:', err);
    throw err;
  }
};

export const getFollowersCount = async (userId: string): Promise<number> => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const data = userDoc.data() || {};
    return data.followersCount || 0;
  } catch (err) {
    console.error('Error getting followers count:', err);
    return 0;
  }
};

export const checkIsFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  if (!currentUserId || !targetUserId) return false;
  try {
    const doc = await db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId).get();
    return doc.exists;
  } catch (err) {
    console.error('Error checking follow relationship:', err);
    return false;
  }
};

export const logToolUsage = async (
  userId: string,
  tool: { id: string; name: string; category: string; },
  prompt: string,
  response: string
) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const historyCollection = userRef.collection('history');
    const userToolUsageRef = userRef.collection('toolUsage').doc(tool.id);
    const globalToolStatRef = db.collection('toolStats').doc(tool.id);
    const globalHistoryRef = db.collection('globalHistory');

    const timestamp = serverTimestamp();

    // 1. Add to user's personal history (fire and forget)
    historyCollection.add({
      toolId: tool.id,
      toolName: tool.name,
      prompt,
      response,
      timestamp,
    });
    
    // 2. Update global tool usage count
    globalToolStatRef.set({
        useCount: firebase.firestore.FieldValue.increment(1),
        toolName: tool.name,
        toolId: tool.id,
        category: tool.category,
    }, { merge: true });

    // 3. Update user-specific tool usage count
    userToolUsageRef.set({
        count: firebase.firestore.FieldValue.increment(1),
        lastUsed: timestamp,
        toolName: tool.name,
        toolId: tool.id,
    }, { merge: true });
    
    // 4. Update user's total usage count for admin dashboard
    userRef.set({
        totalUsage: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });

    // 5. Add to global history feed for admin dashboard
    globalHistoryRef.add({
        userId,
        toolId: tool.id,
        toolName: tool.name,
        timestamp,
    });

  } catch (error) {
    console.error('Error logging tool usage: ', error);
  }
};


export const onToolHistorySnapshot = (
  userId: string,
  toolId: string,
  onUpdate: (history: HistoryItem[]) => void
): (() => void) => {
  const historyRef = db.collection('users').doc(userId).collection('history');
  const q = historyRef.where('toolId', '==', toolId).orderBy('timestamp', 'desc').limit(25);

  const unsubscribe = q.onSnapshot((querySnapshot) => {
    const history: HistoryItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Firestore timestamps can be null temporarily on the client during optimistic writes
      if (data.timestamp) {
        history.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as HistoryItem);
      }
    });
    onUpdate(history);
  }, (error) => {
    console.error(`Error listening to history for tool ${toolId}:`, error);
  });

  return unsubscribe;
};

export const getTopUsedToolsGlobal = async (limit?: number) => {
  let query: firebase.firestore.Query = db.collection('toolStats').orderBy('useCount', 'desc');
  if (limit) {
    query = query.limit(limit);
  }
  const snapshot = await query.get();
  
  const tools = snapshot.docs.map(doc => ({
      toolId: doc.id,
      ...doc.data()
  }));
  
  return tools as { toolId: string, useCount: number, toolName: string, category: string }[];
};

export const getTopUsedToolsGlobalByRange = async (
  range: 'today' | 'week' | 'month' | 'year' | 'all',
  limit: number = 7,
  allowedToolIds?: string[]
) => {
  const historyRef = db.collection('globalHistory');

  let startDate: Date | null = null;
  const now = new Date();
  switch (range) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      break;
    case 'year':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case 'all':
    default:
      startDate = null;
  }

  let query: firebase.firestore.Query = historyRef;
  if (startDate) {
    query = query.where('timestamp', '>=', startDate);
  }

  // Limit to a reasonable window to keep reads bounded; we will aggregate client-side
  const snapshot = await query.orderBy('timestamp', 'desc').limit(1000).get();

  const counts: Record<string, { toolId: string; toolName: string; count: number }> = {};
  snapshot.forEach(doc => {
    const data: any = doc.data();
    const tid = data.toolId || data.tool;
    const tname = data.toolName || (data.tool && data.tool.name) || 'unknown';
    if (!tid) return;
    if (allowedToolIds && allowedToolIds.length > 0 && !allowedToolIds.includes(tid)) return;
    if (!counts[tid]) counts[tid] = { toolId: tid, toolName: tname, count: 0 };
    counts[tid].count += 1;
  });

  const arr = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, limit);
  return arr;
};

export const getTopUsedToolsForUser = async (userId: string, limit: number = 7) => {
  const userToolUsageRef = db.collection('users').doc(userId).collection('toolUsage');
  const snapshot = await userToolUsageRef.orderBy('count', 'desc').limit(limit).get();
  
  const tools = snapshot.docs.map(doc => ({
      toolId: doc.id,
      ...doc.data()
  }));

  return tools as { toolId: string, count: number, toolName: string }[];
};

// Anonymous IP-based usage helpers
export const getAnonIpUsage = async (ip: string): Promise<Record<string, number>> => {
  try {
    const doc = await db.collection('anonIpUsage').doc(ip).get();
    if (!doc.exists) return {};
    const data = doc.data() || {};
    // Remove Firestore metadata fields
    const res: Record<string, number> = {};
    Object.keys(data).forEach(k => {
      if (k === 'lastUpdated') return;
      const v = (data as any)[k];
      if (typeof v === 'number') res[k] = v;
    });
    return res;
  } catch (error) {
    console.error('Error fetching anon IP usage:', error);
    return {};
  }
};

export const incrementAnonIpUsage = async (ip: string, toolId: string, increment: number = 1) => {
  try {
    const ref = db.collection('anonIpUsage').doc(ip);
    await ref.set({
      [toolId]: firebase.firestore.FieldValue.increment(increment),
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error incrementing anon IP usage:', error);
  }
};

export const getAllUsers = async (
    sortBy: 'createdAt' | 'totalUsage' = 'createdAt', 
    sortDir: 'desc' | 'asc' = 'desc', 
    limit?: number
): Promise<FirestoreUser[]> => {
    let query = db.collection('users').orderBy(sortBy, sortDir);
    if(limit) {
        query = query.limit(limit);
    }
    const snapshot = await query.get();

    const users = snapshot.docs.map(doc => {
    const data = doc.data() || {};
    // Some user docs might not have a server 'createdAt' yet (serverTimestamp). Use snapshot.createTime as a fallback.
    const fallbackCreatedAt = (doc as any).createTime || null;

    // Normalize email: treat empty string as null
    const rawEmail = typeof data.email === 'string' ? (data.email.trim() === '' ? null : data.email) : data.email || null;
    const normalizedDisplayName = data.displayName && data.displayName.trim() !== '' ? data.displayName : null;

    const userObj = {
      id: doc.id,
      displayName: normalizedDisplayName,
      email: rawEmail,
      createdAt: data.createdAt || fallbackCreatedAt,
      points: data.points || 0,
      totalUsage: data.totalUsage || 0,
      password: data.password || undefined,
      isBlocked: data.isBlocked || false,
    } as FirestoreUser;

    if (!userObj.email) {
      console.debug(`getAllUsers: user ${doc.id} has null/empty email`);
    }

    return userObj;
    });

    return users;
};

// User IP helpers and IP blocking
export const getUserIp = async (userId: string): Promise<string | null> => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data() || {};
    // Try common field names for IP stored on user document
    const ip = data.lastIp || data.ip || data.ipAddress || data.lastLoginIp || null;
    return ip || null;
  } catch (err) {
    console.error('Error fetching user IP:', err);
    return null;
  }
};

// Fetch client's public IP (best-effort). Returns null on failure.
export const fetchPublicIp = async (): Promise<string | null> => {
  try {
    const resp = await fetch('https://api.ipify.org?format=json');
    const json = await resp.json();
    return json?.ip || null;
  } catch (err) {
    console.warn('fetchPublicIp failed', err);
    return null;
  }
};

export const setUserIp = async (userId: string, ip: string | null): Promise<void> => {
  if (!userId || !ip) return;
  try {
    await db.collection('users').doc(userId).set({ lastIp: ip, lastIpUpdated: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error('Error setting user IP:', err);
  }
};

export const blockIp = async (ip: string): Promise<void> => {
  try {
    if (!ip) throw new Error('Invalid IP');
    await db.collection('blockedIps').doc(ip).set({ blockedAt: serverTimestamp() });
    console.log(`Blocked IP ${ip}`);
  } catch (err) {
    console.error('Error blocking IP:', err);
    throw err;
  }
};

export const unblockIp = async (ip: string): Promise<void> => {
  try {
    if (!ip) throw new Error('Invalid IP');
    await db.collection('blockedIps').doc(ip).delete();
    console.log(`Unblocked IP ${ip}`);
  } catch (err) {
    console.error('Error unblocking IP:', err);
    throw err;
  }
};

export const isIpBlocked = async (ip: string): Promise<boolean> => {
  try {
    if (!ip) return false;
    const doc = await db.collection('blockedIps').doc(ip).get();
    return doc.exists;
  } catch (err) {
    console.error('Error checking IP blocked status:', err);
    return false;
  }
};

export const getFullUserHistory = async (userId: string): Promise<HistoryItem[]> => {
    const historyRef = db.collection('users').doc(userId).collection('history');
    const snapshot = await historyRef.orderBy('timestamp', 'desc').get();
    
    const history: HistoryItem[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
            history.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp.toDate(),
            } as HistoryItem);
        }
    });

    return history;
};

// Access logs (per-user). Records of when a user or a client at an IP accessed the app.
export interface AccessLogItem {
  id?: string;
  ip?: string | null;
  userAgent?: string | null;
  platform?: string | null;
  locale?: string | null;
  path?: string | null;
  location?: string | null; // optional geolocation / place string if available
  timestamp?: firebase.firestore.Timestamp | Date | null;
}

export const logUserAccess = async (
  userId: string | null | undefined,
  data: Partial<Omit<AccessLogItem, 'id' | 'timestamp'>>
): Promise<void> => {
  try {
    if (!userId) return;
    await db.collection('users').doc(userId).collection('accessLogs').add({ ...data, timestamp: serverTimestamp() });
  } catch (err) {
    console.error('Failed to log user access', err);
  }
};

// Log a page view or generic event to a top-level collection useful for time-series charts
export const logPageView = async (
  data: { userId?: string | null; ip?: string | null; path?: string | null; userAgent?: string | null; timestamp?: any }
): Promise<void> => {
  try {
    await db.collection('globalPageViews').add({ ...data, timestamp: serverTimestamp() });
  } catch (err) {
    console.error('Failed to log page view', err);
  }
};

export const getUserAccessLogs = async (userId: string, limit: number = 200): Promise<AccessLogItem[]> => {
  try {
    if (!userId) return [];
    const snapshot = await db.collection('users').doc(userId).collection('accessLogs').orderBy('timestamp', 'desc').limit(limit).get();
    const items: AccessLogItem[] = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...(doc.data() as any) } as AccessLogItem);
    });
    return items;
  } catch (err) {
    console.error('Failed to fetch access logs', err);
    return [];
  }
};

export const onUserAccessLogsSnapshot = (userId: string, onUpdate: (logs: AccessLogItem[]) => void): (() => void) => {
  const ref = db.collection('users').doc(userId).collection('accessLogs').orderBy('timestamp', 'desc').limit(500);
  const unsub = ref.onSnapshot(snapshot => {
    const arr: AccessLogItem[] = [];
    snapshot.forEach(doc => arr.push({ id: doc.id, ...(doc.data() as any) } as AccessLogItem));
    onUpdate(arr);
  }, err => console.error('access logs subscription error', err));
  return unsub;
};

// Admin Dashboard Specific Functions
export interface DashboardStats {
  totalUsers: number;
  totalUsage: number;
  newUsers7Days: number;
  newUsers30Days: number;
  // Additional aggregate stats used by the admin UI
  activeUsers?: number;
  totalToolsUsed?: number;
  avgToolsPerUser?: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const usersRef = db.collection('users');
    const toolStatsRef = db.collection('toolStats');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  // Fetch users and tool stats in parallel, but compute "new users" counts client-side
  const [usersSnapshot, toolStatsSnapshot] = await Promise.all([
    usersRef.get(),
    toolStatsRef.get(),
  ]);

  const totalUsers = usersSnapshot.size;

  // Helper to obtain a JS Date for a user doc's creation time. Prefer server field `createdAt` (Firestore Timestamp).
  // Fall back to snapshot.createTime / doc.createTime (may be a string or timestamp-like) when `createdAt` is missing.
  const getDocCreatedDate = (doc: firebase.firestore.DocumentSnapshot): Date | null => {
    const data: any = doc.data() || {};
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      try { return data.createdAt.toDate(); } catch (e) { /* ignore */ }
    }
    const ct: any = (doc as any).createTime || (doc as any).createAt || null;
    if (!ct) return null;
    // createTime may be an ISO string
    if (typeof ct === 'string') {
      const d = new Date(ct);
      if (!isNaN(d.getTime())) return d;
    }
    // createTime may be an object with `seconds`
    if (ct && typeof ct.seconds === 'number') {
      return new Date(ct.seconds * 1000);
    }
    // as a last resort, try to convert to Date
    try {
      const d = new Date(ct as any);
      if (!isNaN(d.getTime())) return d;
    } catch (e) {}
    return null;
  };

  let newUsers7Days = 0;
  let newUsers30Days = 0;

  usersSnapshot.forEach(doc => {
    const createdDate = getDocCreatedDate(doc);
    if (!createdDate) return;
    if (createdDate >= sevenDaysAgo) newUsers7Days += 1;
    if (createdDate >= thirtyDaysAgo) newUsers30Days += 1;
  });

  let totalUsage = 0;
  toolStatsSnapshot.forEach(doc => {
    totalUsage += doc.data().useCount || 0;
  });

  // Debugging: log when counts appear inconsistent with expectations
  console.debug('getDashboardStats:', { totalUsers, newUsers7Days, newUsers30Days, totalUsage });

  return { totalUsers, totalUsage, newUsers7Days, newUsers30Days };
};


export interface GlobalHistoryItem {
    id: string;
    userId: string;
    toolId: string;
    toolName: string;
    timestamp: Date;
}

export const getRecentActivity = async (limit: number = 5): Promise<GlobalHistoryItem[]> => {
    const historyRef = db.collection('globalHistory');
    const snapshot = await historyRef.orderBy('timestamp', 'desc').limit(limit).get();
    
    const activity: GlobalHistoryItem[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
            activity.push({
                id: doc.id,
                ...data,
                timestamp: data.timestamp.toDate(),
            } as GlobalHistoryItem);
        }
    });
    return activity;
};

// Compute event counts and unique user counts for various time ranges
export const getActivityCounts = async (
  range: 'online' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'all',
  limit: number = 10000
): Promise<{ events: number; uniqueUsers: number }> => {
  try {
    const historyRef = db.collection('globalHistory');
    let startDate: Date | null = null;
    const now = new Date();
    switch (range) {
      case 'online':
        // define 'online' as users active within last 5 minutes
        startDate = new Date(now.getTime() - 5 * 60 * 1000);
        break;
      case 'second':
        startDate = new Date(now.getTime() - 1 * 1000);
        break;
      case 'minute':
        startDate = new Date(now.getTime() - 60 * 1000);
        break;
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = null;
    }

    let query: firebase.firestore.Query = historyRef;
    if (startDate) query = query.where('timestamp', '>=', startDate);

    const snapshot = await query.orderBy('timestamp', 'desc').limit(limit).get();
    const events = snapshot.size;
    const users = new Set<string>();
    snapshot.forEach(doc => {
      const d: any = doc.data();
      if (d.userId) users.add(d.userId);
    });

    return { events, uniqueUsers: users.size };
  } catch (err) {
    console.error('Failed to compute activity counts', err);
    return { events: 0, uniqueUsers: 0 };
  }
};

// Build a time-series of events and unique users per bucket for a given number of points (days/hours)
export const getActivityTimeSeries = async (
  points: number = 30, // number of buckets
  unit: 'day' | 'hour' = 'day',
  source: 'globalHistory' | 'globalPageViews' = 'globalHistory'
): Promise<{ label: string; timestamp: number; events: number; uniqueUsers: number }[]> => {
  try {
    const now = new Date();
    const buckets: { start: number; end: number; label: string }[] = [];
    for (let i = points - 1; i >= 0; i--) {
      if (unit === 'day') {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
        const label = d.toLocaleDateString();
        buckets.push({ start, end, label });
      } else {
        const base = new Date(now.getTime() - i * 60 * 60 * 1000);
        const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), 0, 0).getTime();
        const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), 59, 59, 999).getTime();
        const label = `${base.getHours()}:00 ${base.toLocaleDateString()}`;
        buckets.push({ start, end, label });
      }
    }

    const earliest = new Date(buckets[0].start);
    // fetch events since earliest
  const collectionName = source || 'globalHistory';
  const snapshot = await db.collection(collectionName).where('timestamp', '>=', earliest).orderBy('timestamp', 'asc').limit(10000).get();

    // initialize results
    const results = buckets.map(b => ({ label: b.label, timestamp: b.start, events: 0, uniqueUsers: 0 }));
    const usersPerBucket: Set<string>[] = results.map(() => new Set<string>());

    snapshot.forEach(doc => {
      const data: any = doc.data();
      if (!data.timestamp) return;
      const ts = data.timestamp.toDate ? data.timestamp.toDate().getTime() : (data.timestamp.seconds ? data.timestamp.seconds * 1000 : Date.now());
      // find bucket index
      for (let i = 0; i < buckets.length; i++) {
        if (ts >= buckets[i].start && ts <= buckets[i].end) {
          results[i].events += 1;
          if (data.userId) usersPerBucket[i].add(data.userId);
          break;
        }
      }
    });

    // assign uniqueUsers
    for (let i = 0; i < results.length; i++) {
      results[i].uniqueUsers = usersPerBucket[i].size;
    }

    return results;
  } catch (err) {
    console.error('Failed to build activity time series', err);
    return [];
  }
};

// Presence helpers: store lastSeen timestamps in a 'presence' collection under users for simple online tracking
export const setUserPresenceHeartbeat = async (userId: string): Promise<void> => {
  try {
    if (!userId) return;
    await db.collection('presence').doc(userId).set({ lastSeen: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error('Failed to set presence heartbeat', err);
  }
};

export const setUserOffline = async (userId: string): Promise<void> => {
  try {
    if (!userId) return;
    await db.collection('presence').doc(userId).set({ lastSeen: null }, { merge: true });
  } catch (err) {
    console.error('Failed to mark user offline', err);
  }
};

export const getOnlineUsersCount = async (thresholdSeconds: number = 120): Promise<number> => {
  try {
    const cutoff = new Date(Date.now() - thresholdSeconds * 1000);
    const snapshot = await db.collection('presence').where('lastSeen', '>=', cutoff).get();
    return snapshot.size;
  } catch (err) {
    console.error('Failed to query online users count', err);
    return 0;
  }
};

// Alerts helpers for admin
export interface AlertItem {
  id?: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  createdAt?: firebase.firestore.Timestamp;
  resolved?: boolean;
  metadata?: Record<string, any>;
}

export const createAlert = async (alert: Omit<AlertItem, 'id' | 'createdAt' | 'resolved'>): Promise<string> => {
  try {
    const ref = await db.collection('alerts').add({ ...alert, createdAt: serverTimestamp(), resolved: false });
    return ref.id;
  } catch (err) {
    console.error('Error creating alert:', err);
    throw err;
  }
};

export const getAlerts = async (limit: number = 50): Promise<AlertItem[]> => {
  try {
    const snapshot = await db.collection('alerts').orderBy('createdAt', 'desc').limit(limit).get();
    const items: AlertItem[] = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...(doc.data() as any) } as AlertItem);
    });
    return items;
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return [];
  }
};

export const resolveAlert = async (alertId: string): Promise<void> => {
  try {
    if (!alertId) throw new Error('Invalid alert id');
    await db.collection('alerts').doc(alertId).set({ resolved: true, resolvedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error('Failed to resolve alert', err);
    throw err;
  }
};

export const getAllBlockedIps = async (): Promise<string[]> => {
  try {
    const snapshot = await db.collection('blockedIps').get();
    const ips: string[] = [];
    snapshot.forEach(doc => ips.push(doc.id));
    return ips;
  } catch (err) {
    console.error('Error fetching blocked IPs:', err);
    return [];
  }
};

// Soft-revoke user sessions: set a timestamp on the user doc; clients should check this and sign out if their token issuedAt < sessionRevokedAt
export const revokeUserSessions = async (userId: string): Promise<void> => {
  try {
    if (!userId) throw new Error('Invalid userId');
    await db.collection('users').doc(userId).set({ sessionRevokedAt: serverTimestamp() }, { merge: true });
    console.log(`Revoked sessions for user ${userId}`);
  } catch (err) {
    console.error('Error revoking user sessions:', err);
    throw err;
  }
};

interface AuthSettingsUpdate {
    isGoogleAuthDisabled?: boolean;
    featureFlags?: Record<string, boolean>;
}

export const updateAuthSettings = async (settings: AuthSettingsUpdate) => {
    const settingsRef = db.collection('settings').doc('auth');
    await settingsRef.set(settings, { merge: true });
};

// Send a password reset email to a user (admin can trigger this for any user email)
export const sendPasswordResetEmailToUser = async (email: string): Promise<void> => {
  try {
    await auth.sendPasswordResetEmail(email);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Update the stored password in the user's Firestore document (note: this does NOT change the Firebase Auth password)
// Use with caution - storing plaintext passwords is insecure. This helper only updates the Firestore copy.
export const setUserPasswordInFirestore = async (userId: string, password: string): Promise<void> => {
  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({ password });
    console.log(`Updated password field in Firestore for user ${userId}`);
  } catch (error) {
    console.error('Error updating user password in Firestore:', error);
    throw error;
  }
};

// ------------------------------
// Account Deletion Helpers
// ------------------------------

const deleteCollection = async (collectionRef: firebase.firestore.CollectionReference) => {
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  if (!snapshot.empty) {
    await batch.commit();
  }
};

export const deleteUserData = async (userId: string) => {
  const userRef = db.collection('users').doc(userId);
  // Known subcollections we maintain
  const historyRef = userRef.collection('history');
  const toolUsageRef = userRef.collection('toolUsage');
  const todosRef = userRef.collection('todos');
  const notesRef = userRef.collection('notes');

  // Delete subcollection docs in batches
  await Promise.all([
    deleteCollection(historyRef),
    deleteCollection(toolUsageRef),
    deleteCollection(todosRef),
    deleteCollection(notesRef),
  ]);

  // Finally delete the user document itself
  await userRef.delete().catch(() => {});
};

export const deleteUserAccount = async (): Promise<{ ok: boolean; message?: string }> => {
  const user = auth.currentUser;
  if (!user) return { ok: false, message: 'No authenticated user.' };
  try {
    await deleteUserData(user.uid);
    await user.delete();
    return { ok: true };
  } catch (error: any) {
    if (error && (error.code === 'auth/requires-recent-login' || String(error).includes('requires-recent-login'))) {
      return { ok: false, message: 'Recent login required. Please sign out and log back in, then try deleting again.' };
    }
    console.error('Account deletion failed:', error);
    return { ok: false, message: 'Failed to delete account. Please try again.' };
  }
};

// Todo Functions
export const onTodosSnapshot = (
  userId: string,
  onUpdate: (todos: Todo[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  const todosRef = db.collection('users').doc(userId).collection('todos');
  const unsubscribe = todosRef.onSnapshot((querySnapshot) => {
    const todos: Todo[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      todos.push({
        id: doc.id,
        text: data.text || '',
        completed: data.completed || false,
        priority: data.priority || 'medium',
        dueDate: data.dueDate || null,
        createdAt: data.createdAt, 
        completedAt: data.completedAt || null,
        subtasks: data.subtasks || [],
        tags: data.tags || [],
        recurring: data.recurring || 'none',
      } as Todo);
    });
    onUpdate(todos);
  }, (error) => {
    console.error(`Error listening to todos:`, error);
    onError(error);
  });
  return unsubscribe;
};

export const addTodo = async (userId: string, todoData: Omit<Todo, 'id' | 'createdAt' | 'completedAt'>) => {
  const todosRef = db.collection('users').doc(userId).collection('todos');
  await todosRef.add({
    ...todoData,
    createdAt: serverTimestamp(),
    completedAt: null,
  });
};

export const updateTodo = async (userId: string, todoId: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
  const todoRef = db.collection('users').doc(userId).collection('todos').doc(todoId);
  const updatePayload: { [key: string]: any } = { ...updates };
  if (updates.completed !== undefined) {
      updatePayload.completedAt = updates.completed ? serverTimestamp() : null;
  }
  await todoRef.update(updatePayload);
};

export const updateSubtask = async (userId: string, todoId: string, subtaskId: string, completed: boolean) => {
    const todoRef = db.collection('users').doc(userId).collection('todos').doc(todoId);
    const todoDoc = await todoRef.get();
    if (!todoDoc.exists) throw new Error("Todo not found");

    const todoData = todoDoc.data() as Todo;
    const updatedSubtasks = todoData.subtasks.map(sub => 
        sub.id === subtaskId ? { ...sub, completed } : sub
    );
    
    // Check if all subtasks are completed to mark the parent task as completed
    const allSubtasksCompleted = updatedSubtasks.every(s => s.completed);
    const updates: { subtasks: any, completed?: boolean, completedAt?: any } = { subtasks: updatedSubtasks };
    
    if (allSubtasksCompleted && !todoData.completed) {
        updates.completed = true;
        updates.completedAt = serverTimestamp();
    } else if (!allSubtasksCompleted && todoData.completed) {
        updates.completed = false;
        updates.completedAt = null;
    }

    await todoRef.update(updates);
};

export const deleteTodo = async (userId: string, todoId: string) => {
  const todoRef = db.collection('users').doc(userId).collection('todos').doc(todoId);
  await todoRef.delete();
};


// Note Functions
export const onNotesSnapshot = (
  userId: string,
  onUpdate: (notes: Note[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  const notesRef = db.collection('users').doc(userId).collection('notes');
  const unsubscribe = notesRef.orderBy('lastModified', 'desc').onSnapshot((querySnapshot) => {
    const notes: Note[] = [];
    querySnapshot.forEach((doc) => {
      notes.push({ id: doc.id, ...doc.data() } as Note);
    });
    onUpdate(notes);
  }, (error) => {
    console.error(`Error listening to notes:`, error);
    onError(error);
  });
  return unsubscribe;
};

export const addNote = async (userId: string, noteData: Omit<Note, 'id'>) => {
  const notesRef = db.collection('users').doc(userId).collection('notes');
  const newNoteRef = await notesRef.add(noteData);
  return newNoteRef.id;
};

export const updateNote = async (userId: string, noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
  const noteRef = db.collection('users').doc(userId).collection('notes').doc(noteId);
  await noteRef.update({
    ...updates,
    lastModified: Date.now(), // Always update lastModified on update
  });
};

export const deleteNote = async (userId: string, noteId: string) => {
  const noteRef = db.collection('users').doc(userId).collection('notes').doc(noteId);
  await noteRef.delete();
};

// ------------------------------
// Purchase Requests (Buy Coins) Helpers
// ------------------------------

export interface PurchaseRequest {
  id?: string;
  userId: string;
  name?: string | null;
  phone?: string | null;
  provider?: string | null;
  transactionId?: string | null;
  points: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
  approvedBy?: string | null;
  approvedAt?: any;
}

export const createPurchaseRequest = async (req: Omit<PurchaseRequest, 'id' | 'createdAt' | 'approvedAt'>) => {
  const doc = await db.collection('purchaseRequests').add({
    ...req,
    status: req.status || 'pending',
    createdAt: serverTimestamp(),
  });
  return doc.id;
};

export const getPendingPurchaseRequests = async (): Promise<PurchaseRequest[]> => {
  const snapshot = await db.collection('purchaseRequests').where('status', '==', 'pending').orderBy('createdAt', 'asc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as PurchaseRequest));
};

// Real-time listener for pending purchase requests.
// Returns an unsubscribe function. The callback receives a deduplicated array of PurchaseRequest.
export const listenPendingPurchaseRequests = (onUpdate: (reqs: PurchaseRequest[]) => void, onError?: (err: any) => void) => {
  try {
    const q = db.collection('purchaseRequests').where('status', '==', 'pending').orderBy('createdAt', 'asc');
    const unsubscribe = q.onSnapshot((snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as PurchaseRequest));
      // Deduplicate by id to be extra-safe against duplicate events
      const map = new Map<string, PurchaseRequest>();
      items.forEach(i => { if (i.id) map.set(i.id, i); });
      onUpdate(Array.from(map.values()));
    }, (err) => {
      console.error('listenPendingPurchaseRequests error', err);
      if (onError) onError(err);
    });
    return unsubscribe;
  } catch (err) {
    console.error('listenPendingPurchaseRequests failed to initialize', err);
    if (onError) onError(err);
    return () => {};
  }
};

export const approvePurchaseRequest = async (requestId: string, approverId?: string) => {
  const reqRef = db.collection('purchaseRequests').doc(requestId);
  try {
    await db.runTransaction(async (tx) => {
      const reqSnap = await tx.get(reqRef);
      if (!reqSnap.exists) throw new Error('Request not found');
      const data: any = reqSnap.data();
      if (!data || !data.userId) throw new Error('Invalid request data: missing userId');

      const points = Number(data.points);
      if (!isFinite(points) || points <= 0) throw new Error(`Invalid points value on request: ${data.points}`);

      const userRef = db.collection('users').doc(data.userId);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new Error(`Target user document does not exist: ${data.userId}`);
      }

      // Use update to perform an increment transform (user doc exists)
      tx.update(userRef, { points: firebase.firestore.FieldValue.increment(points) });

      // Mark request approved
      tx.update(reqRef, { status: 'approved', approvedBy: approverId || null, approvedAt: serverTimestamp() });
    });
  } catch (err) {
    console.error('approvePurchaseRequest transaction failed', err);
    try {
      // Try to surface common firestore error fields
      const e: any = err as any;
      const code = e.code || e.status || (e && e._code) || 'UNKNOWN';
      const msg = e.message || e.details || String(e);
      throw new Error(`Firestore transaction failed (${code}): ${msg}`);
    } catch (re) {
      throw err;
    }
  }
};

export const rejectPurchaseRequest = async (requestId: string, approverId?: string) => {
  const reqRef = db.collection('purchaseRequests').doc(requestId);
  await reqRef.set({ status: 'rejected', approvedBy: approverId || null, approvedAt: serverTimestamp() }, { merge: true });
};
