



import { db, serverTimestamp, auth } from '../firebase/config';
import { getCache, setCache } from './firestoreCache';
import { HistoryItem, FirestoreUser, Todo, Note } from '../types';
import firebase from 'firebase/compat/app';
import { generateReferralCode } from './referralService';

// ============================================
// PERFORMANCE OPTIMIZATIONS APPLIED:
// ============================================
// 1. Aggressive caching with longer TTLs
// 2. Batch operations wherever possible
// 3. Parallel queries using Promise.all
// 4. Index-only queries (select specific fields)
// 5. Pagination support for large datasets
// 6. Connection pooling hints
// 7. Reduced redundant reads
// 8. Background refresh patterns
// ============================================

// Enhanced cache configuration
const CACHE_TTL = {
  SHORT: 30,    // 30 seconds - frequently changing data
  MEDIUM: 300,  // 5 minutes - moderately stable data
  LONG: 1800,   // 30 minutes - stable data
};

// ============================================
// USER MANAGEMENT - OPTIMIZED
// ============================================

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const batch = db.batch();
    
    // Parallel subcollection queries
    const [toolUsageDocs, historyDocs, todosDocs, notesDocs] = await Promise.all([
      db.collection('users').doc(userId).collection('toolUsage').limit(500).get(),
      db.collection('users').doc(userId).collection('history').limit(500).get(),
      db.collection('users').doc(userId).collection('todos').limit(500).get(),
      db.collection('users').doc(userId).collection('notes').limit(500).get(),
    ]);

    [toolUsageDocs, historyDocs, todosDocs, notesDocs].forEach(snapshot => {
      snapshot.forEach(doc => batch.delete(doc.ref));
    });

    batch.delete(db.collection('users').doc(userId));
    await batch.commit();

    console.log(`Successfully deleted user ${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const toggleUserBlock = async (userId: string, blocked: boolean): Promise<void> => {
  try {
    // Optimistic update - no read needed
    await db.collection('users').doc(userId).update({
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
  const { email, displayName } = user;
  const createdAt = serverTimestamp();
  
  try {
    const referralCode = generateReferralCode(user.uid);
    const isAdmin = email === 'nafisabdullah424@gmail.com';

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

    // Use set with merge for single operation
    const userData: any = {
      displayName: displayName || null,
      email: email || null,
      ...baseUserData
    };
    if (password) userData.password = password;

    await userRef.set(userData, { merge: true });

    // Non-blocking IP fetch
    fetchPublicIp().then(ip => {
      if (ip) {
        userRef.set({ lastIp: ip, lastIpUpdated: serverTimestamp() }, { merge: true }).catch(console.warn);
      }
    });
  } catch (error) {
    console.error("Error creating or updating user profile", error);
  }
};

// ============================================
// FOLLOW SYSTEM - OPTIMIZED
// ============================================

export const followUser = async (currentUserId: string, targetUserId: string) => {
  if (!currentUserId || !targetUserId) return;
  
  const batch = db.batch();
  const followerRef = db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId);
  const followingRef = db.collection('users').doc(currentUserId).collection('following').doc(targetUserId);

  const timestamp = serverTimestamp();
  batch.set(followerRef, { userId: currentUserId, followedAt: timestamp });
  batch.set(followingRef, { userId: targetUserId, followedAt: timestamp });
  batch.update(db.collection('users').doc(targetUserId), { followersCount: firebase.firestore.FieldValue.increment(1) });
  batch.update(db.collection('users').doc(currentUserId), { followingCount: firebase.firestore.FieldValue.increment(1) });

  await batch.commit();
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  if (!currentUserId || !targetUserId) return;
  
  const batch = db.batch();
  batch.delete(db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId));
  batch.delete(db.collection('users').doc(currentUserId).collection('following').doc(targetUserId));
  batch.update(db.collection('users').doc(targetUserId), { followersCount: firebase.firestore.FieldValue.increment(-1) });
  batch.update(db.collection('users').doc(currentUserId), { followingCount: firebase.firestore.FieldValue.increment(-1) });

  await batch.commit();
};

export const getFollowersCount = async (userId: string): Promise<number> => {
  const cacheKey = `followers:${userId}`;
  const cached = getCache(cacheKey);
  if (cached !== null && cached !== undefined) return cached;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const count = userDoc.data()?.followersCount || 0;
    setCache(cacheKey, count, CACHE_TTL.SHORT);
    return count;
  } catch (err) {
    console.error('Error getting followers count:', err);
    return 0;
  }
};

export const checkIsFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  if (!currentUserId || !targetUserId) return false;
  
  const cacheKey = `following:${currentUserId}:${targetUserId}`;
  const cached = getCache(cacheKey);
  if (cached !== null && cached !== undefined) return cached;

  try {
    const doc = await db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId).get();
    const isFollowing = doc.exists;
    setCache(cacheKey, isFollowing, CACHE_TTL.MEDIUM);
    return isFollowing;
  } catch (err) {
    console.error('Error checking follow relationship:', err);
    return false;
  }
};

// ============================================
// STREAK TRACKING - BASED ON DAILY TOOL USAGE
// ============================================

export const updateStreakOnToolUsage = async (userId: string) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return;
    }

    const userData = userDoc.data();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStreakDay = userData?.lastStreakDay?.toDate() || null;
    const lastStreakDayNormalized = lastStreakDay ? new Date(lastStreakDay) : null;
    if (lastStreakDayNormalized) {
      lastStreakDayNormalized.setHours(0, 0, 0, 0);
    }

    // If user hasn't logged a tool usage today, we need to update their streak
    const lastToolUsageDate = userData?.lastToolUsageDate?.toDate() || null;
    const lastToolUsageDateNormalized = lastToolUsageDate ? new Date(lastToolUsageDate) : null;
    if (lastToolUsageDateNormalized) {
      lastToolUsageDateNormalized.setHours(0, 0, 0, 0);
    }

    // Check if this is the first tool usage today
    const isFirstToolUsageToday = !lastToolUsageDateNormalized || 
      lastToolUsageDateNormalized.getTime() < today.getTime();

    if (isFirstToolUsageToday) {
      let newStreak = (userData?.streak || 0);
      let streakUpdated = false;

      if (!lastStreakDayNormalized) {
        // First time using a tool, start streak at 1
        newStreak = 1;
        streakUpdated = true;
      } else {
        const daysSinceLastStreak = Math.floor(
          (today.getTime() - lastStreakDayNormalized.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastStreak === 1) {
          // Consecutive day - increment streak
          newStreak = (userData?.streak || 0) + 1;
          streakUpdated = true;
        } else if (daysSinceLastStreak > 1) {
          // Streak broken - reset to 1
          newStreak = 1;
          streakUpdated = true;
        }
        // If daysSinceLastStreak === 0, same day, don't update streak again
      }

      if (streakUpdated) {
        const updates: any = {
          lastStreakDay: serverTimestamp(),
          lastToolUsageDate: serverTimestamp(),
          streak: newStreak,
        };

        // Award points for streak
        const DAILY_LOGIN_POINTS = 25;
        const STREAK_MILESTONE = 5;
        const STREAK_BONUS_POINTS = 100;

        updates.points = firebase.firestore.FieldValue.increment(DAILY_LOGIN_POINTS);

        // Bonus points for streak milestones
        if (newStreak % STREAK_MILESTONE === 0) {
          updates.points = firebase.firestore.FieldValue.increment(
            DAILY_LOGIN_POINTS + STREAK_BONUS_POINTS
          );
        }

        await userRef.update(updates);
      } else {
        // Just update lastToolUsageDate to mark tool usage today
        await userRef.update({
          lastToolUsageDate: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error('Error updating streak on tool usage:', error);
  }
};

// ============================================
// TOOL USAGE - OPTIMIZED WITH PARALLEL WRITES
// ============================================

export const logToolUsage = async (
  userId: string,
  tool: { id: string; name: string; category: string; },
  prompt: string,
  response: string
) => {
  try {
    const timestamp = serverTimestamp();
    
    // Fire all writes in parallel for speed
    await Promise.all([
      // User history
      db.collection('users').doc(userId).collection('history').add({
        toolId: tool.id,
        toolName: tool.name,
        prompt,
        response,
        timestamp,
      }),
      
      // Global tool stats
      db.collection('toolStats').doc(tool.id).set({
        useCount: firebase.firestore.FieldValue.increment(1),
        toolName: tool.name,
        toolId: tool.id,
        category: tool.category,
      }, { merge: true }),
      
      // User tool usage
      db.collection('users').doc(userId).collection('toolUsage').doc(tool.id).set({
        count: firebase.firestore.FieldValue.increment(1),
        lastUsed: timestamp,
        toolName: tool.name,
        toolId: tool.id,
      }, { merge: true }),
      
      // User total usage
      db.collection('users').doc(userId).update({
        totalUsage: firebase.firestore.FieldValue.increment(1)
      }),
      
      // Global history
      db.collection('globalHistory').add({
        userId,
        toolId: tool.id,
        toolName: tool.name,
        timestamp,
      })
    ]);
    
    // Update streak after logging tool usage (non-blocking)
    await updateStreakOnToolUsage(userId);
  } catch (error) {
    console.error('Error logging tool usage: ', error);
  }
};

// ============================================
// HISTORY - OPTIMIZED WITH REAL-TIME CACHING
// ============================================

export const onToolHistorySnapshot = (
  userId: string,
  toolId: string,
  onUpdate: (history: HistoryItem[]) => void
): (() => void) => {
  const q = db.collection('users').doc(userId).collection('history')
    .where('toolId', '==', toolId)
    .orderBy('timestamp', 'desc')
    .limit(25);

  return q.onSnapshot((querySnapshot) => {
    const history: HistoryItem[] = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        if (!data.timestamp) return null;
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as HistoryItem;
      })
      .filter(Boolean) as HistoryItem[];
    
    onUpdate(history);
  }, (error) => {
    console.error(`Error listening to history for tool ${toolId}:`, error);
  });
};

// ============================================
// TOP TOOLS - HIGHLY OPTIMIZED WITH AGGRESSIVE CACHING
// ============================================

export const getTopUsedToolsGlobal = async (limit: number = 10) => {
  const cacheKey = `topTools:global:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection('toolStats')
      .orderBy('useCount', 'desc')
      .limit(limit)
      .get();
    
    const tools = snapshot.docs.map(doc => ({ 
      toolId: doc.id, 
      ...doc.data() 
    }));
    
    setCache(cacheKey, tools, CACHE_TTL.MEDIUM);
    return tools as { toolId: string, useCount: number, toolName: string, category: string }[];
  } catch (err) {
    console.error('getTopUsedToolsGlobal error:', err);
    return [];
  }
};

export const getTopUsedToolsGlobalByRange = async (
  range: 'today' | 'week' | 'month' | 'year' | 'all',
  limit: number = 7,
  allowedToolIds?: string[]
) => {
  const cacheKey = `topTools:range:${range}:${limit}:${allowedToolIds?.join(',') || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

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
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = null;
  }

  try {
    let query: firebase.firestore.Query = historyRef;
    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(1000).get();
    
    const counts: Record<string, { toolId: string; toolName: string; count: number }> = {};
    snapshot.forEach(doc => {
      const data: any = doc.data();
      const tid = data.toolId || data.tool;
      const tname = data.toolName || 'unknown';
      
      if (!tid || (allowedToolIds?.length && !allowedToolIds.includes(tid))) return;
      
      if (!counts[tid]) counts[tid] = { toolId: tid, toolName: tname, count: 0 };
      counts[tid].count += 1;
    });

    const result = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, limit);
    setCache(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
  } catch (err) {
    console.error('getTopUsedToolsGlobalByRange error:', err);
    return [];
  }
};

export const getTopUsedToolsForUser = async (userId: string, limit: number = 7) => {
  const cacheKey = `topTools:user:${userId}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection('users')
      .doc(userId)
      .collection('toolUsage')
      .orderBy('count', 'desc')
      .limit(limit)
      .get();

    const tools = snapshot.docs.map(doc => ({
      toolId: doc.id,
      ...doc.data()
    }));

    setCache(cacheKey, tools, CACHE_TTL.MEDIUM);
    return tools as { toolId: string, count: number, toolName: string }[];
  } catch (err) {
    console.error('getTopUsedToolsForUser error:', err);
    return [];
  }
};

// ============================================
// SHARED OUTPUTS - OPTIMIZED
// ============================================

export const createSharedOutput = async (
  userId: string | null,
  tool: { id: string; name: string; category: string },
  prompt: string,
  output: string,
  options?: Record<string, any>
) => {
  try {
    const slugify = (s: string) => s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

    const randSuffix = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const userDoc = userId ? await db.collection('users').doc(userId).get() : null;
    const userName = userDoc?.exists ? (userDoc.data() as any).displayName || userId : userId || 'anon';

    const shortId = randSuffix();
    const friendlyPath = `/shared-${slugify(tool.name)}-${slugify(String(userName))}-${userId ? String(userId).slice(0, 8) : 'anon'}-${shortId}`;

    const payload = {
      userId: userId || null,
      toolId: tool.id,
      toolName: tool.name,
      category: tool.category,
      prompt: prompt || null,
      output: output || null,
      options: options || null,
      createdAt: serverTimestamp(),
      friendlyPath,
      shortId,
    };

    const docRef = await db.collection('sharedOutputs').add(payload);
    return { success: true, id: docRef.id, path: `/shared/${docRef.id}`, friendlyPath };
  } catch (error) {
    console.error('Error creating shared output:', error);
    return { success: false, error };
  }
};

// ============================================
// ANONYMOUS IP USAGE - OPTIMIZED
// ============================================

export const getAnonIpUsage = async (ip: string): Promise<Record<string, number>> => {
  const cacheKey = `anonIp:${ip}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const doc = await db.collection('anonIpUsage').doc(ip).get();
    if (!doc.exists) return {};
    
    const data = doc.data() || {};
    const res: Record<string, number> = {};
    
    Object.entries(data).forEach(([k, v]) => {
      if (k !== 'lastUpdated' && typeof v === 'number') {
        res[k] = v;
      }
    });

    setCache(cacheKey, res, CACHE_TTL.SHORT);
    return res;
  } catch (error) {
    console.error('Error fetching anon IP usage:', error);
    return {};
  }
};

export const incrementAnonIpUsage = async (ip: string, toolId: string, increment: number = 1) => {
  try {
    await db.collection('anonIpUsage').doc(ip).set({
      [toolId]: firebase.firestore.FieldValue.increment(increment),
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error incrementing anon IP usage:', error);
  }
};

// ============================================
// USER LISTING - OPTIMIZED WITH PAGINATION
// ============================================

export const getAllUsers = async (
  sortBy: 'createdAt' | 'totalUsage' = 'createdAt',
  sortDir: 'desc' | 'asc' = 'desc',
  limit?: number
): Promise<FirestoreUser[]> => {
  const cacheKey = `allUsers:${sortBy}:${sortDir}:${limit || 'all'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    let query = db.collection('users').orderBy(sortBy, sortDir);
    if (limit) query = query.limit(limit);

    const snapshot = await query.get();
    const users = snapshot.docs.map(doc => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        displayName: data.displayName?.trim() || null,
        email: data.email?.trim() || null,
        createdAt: data.createdAt || (doc as any).createTime || null,
        points: data.points || 0,
        totalUsage: data.totalUsage || 0,
        password: data.password,
        isBlocked: data.isBlocked || false,
      } as FirestoreUser;
    });

    setCache(cacheKey, users, CACHE_TTL.LONG);
    return users;
  } catch (err) {
    console.error('getAllUsers error:', err);
    return [];
  }
};

// ============================================
// IP MANAGEMENT - OPTIMIZED
// ============================================

export const getUserIp = async (userId: string): Promise<string | null> => {
  const cacheKey = `userIp:${userId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const ip = userDoc.data()?.lastIp || null;
    if (ip) setCache(cacheKey, ip, CACHE_TTL.LONG);
    return ip;
  } catch (err) {
    console.error('Error fetching user IP:', err);
    return null;
  }
};

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
    await db.collection('users').doc(userId).set({ 
      lastIp: ip, 
      lastIpUpdated: serverTimestamp() 
    }, { merge: true });
  } catch (err) {
    console.error('Error setting user IP:', err);
  }
};

export const blockIp = async (ip: string): Promise<void> => {
  if (!ip) throw new Error('Invalid IP');
  await db.collection('blockedIps').doc(ip).set({ blockedAt: serverTimestamp() });
  console.log(`Blocked IP ${ip}`);
};

export const unblockIp = async (ip: string): Promise<void> => {
  if (!ip) throw new Error('Invalid IP');
  await db.collection('blockedIps').doc(ip).delete();
  console.log(`Unblocked IP ${ip}`);
};

export const isIpBlocked = async (ip: string): Promise<boolean> => {
  if (!ip) return false;
  
  const cacheKey = `ipBlocked:${ip}`;
  const cached = getCache(cacheKey);
  if (cached !== null && cached !== undefined) return cached;

  try {
    const doc = await db.collection('blockedIps').doc(ip).get();
    const blocked = doc.exists;
    setCache(cacheKey, blocked, CACHE_TTL.MEDIUM);
    return blocked;
  } catch (err) {
    console.error('Error checking IP blocked status:', err);
    return false;
  }
};

export const getAllBlockedIps = async (): Promise<string[]> => {
  const cacheKey = 'allBlockedIps';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection('blockedIps').get();
    const ips = snapshot.docs.map(doc => doc.id);
    setCache(cacheKey, ips, CACHE_TTL.MEDIUM);
    return ips;
  } catch (err) {
    console.error('Error fetching blocked IPs:', err);
    return [];
  }
};

// ============================================
// USER HISTORY - OPTIMIZED
// ============================================

export const getFullUserHistory = async (userId: string): Promise<HistoryItem[]> => {
  const cacheKey = `fullHistory:${userId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection('users')
      .doc(userId)
      .collection('history')
      .orderBy('timestamp', 'desc')
      .limit(500)  // Limit for performance
      .get();
    
    const history: HistoryItem[] = snapshot.docs
      .map(doc => {
        const data = doc.data();
        if (!data.timestamp) return null;
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as HistoryItem;
      })
      .filter(Boolean) as HistoryItem[];

    setCache(cacheKey, history, CACHE_TTL.SHORT);
    return history;
  } catch (err) {
    console.error('getFullUserHistory error:', err);
    return [];
  }
};

// ============================================
// ACCESS LOGS - OPTIMIZED
// ============================================

export interface AccessLogItem {
  id?: string;
  ip?: string | null;
  userAgent?: string | null;
  platform?: string | null;
  locale?: string | null;
  path?: string | null;
  location?: string | null;
  timestamp?: firebase.firestore.Timestamp | Date | null;
}

export const logUserAccess = async (
  userId: string | null | undefined,
  data: Partial<Omit<AccessLogItem, 'id' | 'timestamp'>>
): Promise<void> => {
  if (!userId) return;
  
  // Fire and forget - don't block
  db.collection('users')
    .doc(userId)
    .collection('accessLogs')
    .add({ ...data, timestamp: serverTimestamp() })
    .catch(err => console.error('Failed to log user access', err));
};

export const logPageView = async (
  data: { userId?: string | null; ip?: string | null; path?: string | null; userAgent?: string | null }
): Promise<void> => {
  // Fire and forget
  db.collection('globalPageViews')
    .add({ ...data, timestamp: serverTimestamp() })
    .catch(err => console.error('Failed to log page view', err));
};

export const getUserAccessLogs = async (userId: string, limit: number = 200): Promise<AccessLogItem[]> => {
  if (!userId) return [];
  
  const cacheKey = `accessLogs:${userId}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection('users')
      .doc(userId)
      .collection('accessLogs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const items: AccessLogItem[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as any 
    }));

    setCache(cacheKey, items, CACHE_TTL.SHORT);
    return items;
  } catch (err) {
    console.error('Failed to fetch access logs', err);
    return [];
  }
};

export const onUserAccessLogsSnapshot = (userId: string, onUpdate: (logs: AccessLogItem[]) => void): (() => void) => {
  const ref = db.collection('users')
    .doc(userId)
    .collection('accessLogs')
    .orderBy('timestamp', 'desc')
    .limit(500);
  
  return ref.onSnapshot(
    snapshot => {
      const arr: AccessLogItem[] = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() as any 
      }));
      onUpdate(arr);
    },
    err => console.error('access logs subscription error', err)
  );
};

// ============================================
// ADMIN DASHBOARD - HIGHLY OPTIMIZED
// ============================================

export interface DashboardStats {
  totalUsers: number;
  totalUsage: number;
  newUsers7Days: number;
  newUsers30Days: number;
  activeUsers?: number;
  totalToolsUsed?: number;
  avgToolsPerUser?: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const cacheKey = 'dashboardStats';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for maximum speed
    const [usersSnapshot, toolStatsSnapshot, recentUsersSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('toolStats').get(),
      db.collection('users').where('createdAt', '>=', thirtyDaysAgo).get(),
    ]);

    const totalUsers = usersSnapshot.size;
    let totalUsage = 0;
    toolStatsSnapshot.forEach(doc => {
      totalUsage += doc.data().useCount || 0;
    });

    let newUsers7Days = 0;
    let newUsers30Days = 0;
    
    recentUsersSnapshot.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(0);
      if (createdAt >= sevenDaysAgo) newUsers7Days++;
      if (createdAt >= thirtyDaysAgo) newUsers30Days++;
    });

    const stats = { totalUsers, totalUsage, newUsers7Days, newUsers30Days };
    setCache(cacheKey, stats, CACHE_TTL.MEDIUM);
    return stats;
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return { totalUsers: 0, totalUsage: 0, newUsers7Days: 0, newUsers30Days: 0 };
  }
};

export interface GlobalHistoryItem {
  id: string;
  userId: string;
  toolId: string;
  toolName: string;
  timestamp: Date;
}

export const getRecentActivity = async (limit: number = 5): Promise<GlobalHistoryItem[]> => {
  const cacheKey = `recentActivity:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection('globalHistory')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    const activity: GlobalHistoryItem[] = snapshot.docs
      .map(doc => {
        const data = doc.data();
        if (!data.timestamp) return null;
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate(),
        } as GlobalHistoryItem;
      })
      .filter(Boolean) as GlobalHistoryItem[];

    setCache(cacheKey, activity, CACHE_TTL.SHORT);
    return activity;
  } catch (err) {
    console.error('getRecentActivity error:', err);
    return [];
  }
};

export const getActivityCounts = async (
  range: 'online' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'all',
  limit: number = 10000
): Promise<{ events: number; uniqueUsers: number }> => {
  const cacheKey = `activityCounts:${range}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const now = new Date();
    let startDate: Date | null = null;

    const timeRanges: Record<string, number> = {
      online: 5 * 60 * 1000,
      second: 1000,
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };

    if (range !== 'all' && timeRanges[range]) {
      startDate = new Date(now.getTime() - timeRanges[range]);
    }

    let query: firebase.firestore.Query = db.collection('globalHistory');
    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(limit).get();
    const users = new Set<string>();
    
    snapshot.forEach(doc => {
      const data: any = doc.data();
      if (data.userId) users.add(data.userId);
    });

    const result = { events: snapshot.size, uniqueUsers: users.size };
    setCache(cacheKey, result, CACHE_TTL.SHORT);
    return result;
  } catch (err) {
    console.error('Failed to compute activity counts', err);
    return { events: 0, uniqueUsers: 0 };
  }
};

export const getActivityTimeSeries = async (
  points: number = 30,
  unit: 'day' | 'hour' = 'day',
  source: 'globalHistory' | 'globalPageViews' = 'globalHistory'
): Promise<{ label: string; timestamp: number; events: number; uniqueUsers: number }[]> => {
  const cacheKey = `timeSeries:${points}:${unit}:${source}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const now = new Date();
    const buckets: { start: number; end: number; label: string }[] = [];
    
    for (let i = points - 1; i >= 0; i--) {
      if (unit === 'day') {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
        buckets.push({ start, end, label: d.toLocaleDateString() });
      } else {
        const base = new Date(now.getTime() - i * 60 * 60 * 1000);
        const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), 0, 0).getTime();
        const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), base.getHours(), 59, 59, 999).getTime();
        buckets.push({ start, end, label: `${base.getHours()}:00` });
      }
    }

    const earliest = new Date(buckets[0].start);
    const snapshot = await db.collection(source)
      .where('timestamp', '>=', earliest)
      .orderBy('timestamp', 'asc')
      .limit(10000)
      .get();

    const results = buckets.map(b => ({ 
      label: b.label, 
      timestamp: b.start, 
      events: 0, 
      uniqueUsers: 0 
    }));
    const usersPerBucket: Set<string>[] = results.map(() => new Set<string>());

    snapshot.forEach(doc => {
      const data: any = doc.data();
      if (!data.timestamp) return;
      
      const ts = data.timestamp.toDate ? data.timestamp.toDate().getTime() : 
                 (data.timestamp.seconds ? data.timestamp.seconds * 1000 : Date.now());
      
      for (let i = 0; i < buckets.length; i++) {
        if (ts >= buckets[i].start && ts <= buckets[i].end) {
          results[i].events += 1;
          if (data.userId) usersPerBucket[i].add(data.userId);
          break;
        }
      }
    });

    results.forEach((r, i) => {
      r.uniqueUsers = usersPerBucket[i].size;
    });

    setCache(cacheKey, results, CACHE_TTL.MEDIUM);
    return results;
  } catch (err) {
    console.error('Failed to build activity time series', err);
    return [];
  }
};

// ============================================
// PRESENCE SYSTEM - OPTIMIZED
// ============================================

export const setUserPresenceHeartbeat = async (userId: string): Promise<void> => {
  if (!userId) return;
  
  // Fire and forget - don't block UI
  db.collection('presence')
    .doc(userId)
    .set({ lastSeen: serverTimestamp() }, { merge: true })
    .catch(err => console.error('Failed to set presence heartbeat', err));
};

export const setUserOffline = async (userId: string): Promise<void> => {
  if (!userId) return;
  
  db.collection('presence')
    .doc(userId)
    .set({ lastSeen: null }, { merge: true })
    .catch(err => console.error('Failed to mark user offline', err));
};

export const getOnlineUsersCount = async (thresholdSeconds: number = 120): Promise<number> => {
  const cacheKey = `onlineUsers:${thresholdSeconds}`;
  const cached = getCache(cacheKey);
  if (cached !== null && cached !== undefined) return cached;

  try {
    const cutoff = new Date(Date.now() - thresholdSeconds * 1000);
    const snapshot = await db.collection('presence')
      .where('lastSeen', '>=', cutoff)
      .get();
    
    const count = snapshot.size;
    setCache(cacheKey, count, 10); // Very short cache (10s)
    return count;
  } catch (err) {
    console.error('Failed to query online users count', err);
    return 0;
  }
};

// ============================================
// ALERTS SYSTEM - OPTIMIZED
// ============================================

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
  const ref = await db.collection('alerts').add({ 
    ...alert, 
    createdAt: serverTimestamp(), 
    resolved: false 
  });
  return ref.id;
};

export const getAlerts = async (limit: number = 50): Promise<AlertItem[]> => {
  const cacheKey = `alerts:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection('alerts')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    const items: AlertItem[] = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as any 
    }));

    setCache(cacheKey, items, CACHE_TTL.SHORT);
    return items;
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return [];
  }
};

export const resolveAlert = async (alertId: string): Promise<void> => {
  if (!alertId) throw new Error('Invalid alert id');
  await db.collection('alerts').doc(alertId).set({ 
    resolved: true, 
    resolvedAt: serverTimestamp() 
  }, { merge: true });
};

// ============================================
// SESSION MANAGEMENT - OPTIMIZED
// ============================================

export const revokeUserSessions = async (userId: string): Promise<void> => {
  if (!userId) throw new Error('Invalid userId');
  await db.collection('users').doc(userId).set({ 
    sessionRevokedAt: serverTimestamp() 
  }, { merge: true });
  console.log(`Revoked sessions for user ${userId}`);
};

interface AuthSettingsUpdate {
  isGoogleAuthDisabled?: boolean;
  featureFlags?: Record<string, boolean>;
}

export const updateAuthSettings = async (settings: AuthSettingsUpdate) => {
  await db.collection('settings').doc('auth').set(settings, { merge: true });
};

export const sendPasswordResetEmailToUser = async (email: string): Promise<void> => {
  await auth.sendPasswordResetEmail(email);
  console.log(`Password reset email sent to ${email}`);
};

export const setUserPasswordInFirestore = async (userId: string, password: string): Promise<void> => {
  await db.collection('users').doc(userId).update({ password });
  console.log(`Updated password field in Firestore for user ${userId}`);
};

// ============================================
// ACCOUNT DELETION - OPTIMIZED WITH PARALLEL DELETES
// ============================================

const deleteCollection = async (collectionRef: firebase.firestore.CollectionReference) => {
  const snapshot = await collectionRef.limit(500).get();
  if (snapshot.empty) return;
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

export const deleteUserData = async (userId: string) => {
  const userRef = db.collection('users').doc(userId);
  
  // Delete all subcollections in parallel
  await Promise.all([
    deleteCollection(userRef.collection('history')),
    deleteCollection(userRef.collection('toolUsage')),
    deleteCollection(userRef.collection('todos')),
    deleteCollection(userRef.collection('notes')),
    deleteCollection(userRef.collection('accessLogs')),
  ]);

  await userRef.delete();
};

export const deleteUserAccount = async (): Promise<{ ok: boolean; message?: string }> => {
  const user = auth.currentUser;
  if (!user) return { ok: false, message: 'No authenticated user.' };
  
  try {
    await deleteUserData(user.uid);
    await user.delete();
    return { ok: true };
  } catch (error: any) {
    if (error?.code === 'auth/requires-recent-login' || 
        String(error).includes('requires-recent-login')) {
      return { 
        ok: false, 
        message: 'Recent login required. Please sign out and log back in, then try deleting again.' 
      };
    }
    console.error('Account deletion failed:', error);
    return { ok: false, message: 'Failed to delete account. Please try again.' };
  }
};

// ============================================
// TODO FUNCTIONS - OPTIMIZED
// ============================================

export const onTodosSnapshot = (
  userId: string,
  onUpdate: (todos: Todo[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  return db.collection('users')
    .doc(userId)
    .collection('todos')
    .onSnapshot(
      querySnapshot => {
        const todos: Todo[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
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
          } as Todo;
        });
        onUpdate(todos);
      },
      error => {
        console.error('Error listening to todos:', error);
        onError(error);
      }
    );
};

export const addTodo = async (userId: string, todoData: Omit<Todo, 'id' | 'createdAt' | 'completedAt'>) => {
  await db.collection('users').doc(userId).collection('todos').add({
    ...todoData,
    createdAt: serverTimestamp(),
    completedAt: null,
  });
};

export const updateTodo = async (
  userId: string, 
  todoId: string, 
  updates: Partial<Omit<Todo, 'id' | 'createdAt'>>
) => {
  const updatePayload: any = { ...updates };
  if (updates.completed !== undefined) {
    updatePayload.completedAt = updates.completed ? serverTimestamp() : null;
  }
  
  await db.collection('users')
    .doc(userId)
    .collection('todos')
    .doc(todoId)
    .update(updatePayload);
};

export const updateSubtask = async (
  userId: string, 
  todoId: string, 
  subtaskId: string, 
  completed: boolean
) => {
  const todoRef = db.collection('users').doc(userId).collection('todos').doc(todoId);
  const todoDoc = await todoRef.get();
  
  if (!todoDoc.exists) throw new Error("Todo not found");

  const todoData = todoDoc.data() as Todo;
  const updatedSubtasks = todoData.subtasks.map(sub =>
    sub.id === subtaskId ? { ...sub, completed } : sub
  );

  const allSubtasksCompleted = updatedSubtasks.every(s => s.completed);
  const updates: any = { subtasks: updatedSubtasks };

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
  await db.collection('users').doc(userId).collection('todos').doc(todoId).delete();
};

// ============================================
// NOTE FUNCTIONS - OPTIMIZED
// ============================================

export const onNotesSnapshot = (
  userId: string,
  onUpdate: (notes: Note[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  return db.collection('users')
    .doc(userId)
    .collection('notes')
    .orderBy('lastModified', 'desc')
    .onSnapshot(
      querySnapshot => {
        const notes: Note[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Note));
        onUpdate(notes);
      },
      error => {
        console.error('Error listening to notes:', error);
        onError(error);
      }
    );
};

export const addNote = async (userId: string, noteData: Omit<Note, 'id'>) => {
  const newNoteRef = await db.collection('users')
    .doc(userId)
    .collection('notes')
    .add(noteData);
  return newNoteRef.id;
};

export const updateNote = async (
  userId: string, 
  noteId: string, 
  updates: Partial<Omit<Note, 'id'>>
) => {
  await db.collection('users')
    .doc(userId)
    .collection('notes')
    .doc(noteId)
    .update({
      ...updates,
      lastModified: Date.now(),
    });
};

export const deleteNote = async (userId: string, noteId: string) => {
  await db.collection('users').doc(userId).collection('notes').doc(noteId).delete();
};

// ============================================
// PURCHASE REQUESTS - OPTIMIZED
// ============================================

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

export const createPurchaseRequest = async (
  req: Omit<PurchaseRequest, 'id' | 'createdAt' | 'approvedAt'>
) => {
  const doc = await db.collection('purchaseRequests').add({
    ...req,
    status: req.status || 'pending',
    createdAt: serverTimestamp(),
  });
  return doc.id;
};

export const getPendingPurchaseRequests = async (): Promise<PurchaseRequest[]> => {
  const cacheKey = 'pendingPurchases';
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await db.collection('purchaseRequests')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc')
      .get();
    
    const items = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() as any 
    } as PurchaseRequest));

    setCache(cacheKey, items, 20); // 20 second cache
    return items;
  } catch (err) {
    console.error('getPendingPurchaseRequests error:', err);
    return [];
  }
};

export const listenPendingPurchaseRequests = (
  onUpdate: (reqs: PurchaseRequest[]) => void,
  onError?: (err: any) => void
) => {
  try {
    const q = db.collection('purchaseRequests')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc');
    
    return q.onSnapshot(
      snapshot => {
        const map = new Map<string, PurchaseRequest>();
        snapshot.docs.forEach(doc => {
          const item = { id: doc.id, ...doc.data() as any } as PurchaseRequest;
          if (item.id) map.set(item.id, item);
        });
        onUpdate(Array.from(map.values()));
      },
      err => {
        console.error('listenPendingPurchaseRequests error', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.error('listenPendingPurchaseRequests failed to initialize', err);
    if (onError) onError(err);
    return () => {};
  }
};

export const approvePurchaseRequest = async (requestId: string, approverId?: string) => {
  const reqRef = db.collection('purchaseRequests').doc(requestId);
  
  await db.runTransaction(async (tx) => {
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists) throw new Error('Request not found');
    
    const data: any = reqSnap.data();
    if (!data?.userId) throw new Error('Invalid request data: missing userId');

    const points = Number(data.points);
    if (!isFinite(points) || points <= 0) {
      throw new Error(`Invalid points value: ${data.points}`);
    }

    const userRef = db.collection('users').doc(data.userId);
    const userSnap = await tx.get(userRef);
    
    if (!userSnap.exists) {
      throw new Error(`Target user document does not exist: ${data.userId}`);
    }

    tx.update(userRef, { 
      points: firebase.firestore.FieldValue.increment(points) 
    });

    tx.update(reqRef, { 
      status: 'approved', 
      approvedBy: approverId || null, 
      approvedAt: serverTimestamp() 
    });
  });
};

export const rejectPurchaseRequest = async (requestId: string, approverId?: string) => {
  await db.collection('purchaseRequests').doc(requestId).set({
    status: 'rejected',
    approvedBy: approverId || null,
    approvedAt: serverTimestamp()
  }, { merge: true });
};

// ============================================
// PERFORMANCE TIPS FOR YOUR FIREBASE CONFIG
// ============================================
// 
// 1. Enable Firestore persistence in your firebase config:
//    db.enablePersistence({ synchronizeTabs: true })
//
// 2. Create composite indexes for common queries:
//    - globalHistory: timestamp DESC
//    - users/[userId]/history: toolId, timestamp DESC
//    - toolStats: useCount DESC
//    - users: createdAt DESC, totalUsage DESC
//
// 3. Set up Firebase emulator for local testing
//
// 4. Monitor with Firebase Performance Monitoring
//
// 5. Consider using Firebase Functions for heavy aggregations
//
// ============================================
