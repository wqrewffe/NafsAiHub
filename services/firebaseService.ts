

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
  if (!snapshot.exists) {
    const { email, displayName } = user;
    const createdAt = serverTimestamp();
    try {
      const referralCode = generateReferralCode(user.uid);
      const isAdmin = email === 'nafisabdullah424@gmail.com';
      const userData: any = {
        displayName,
        email,
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

      if (password) {
        userData.password = password;
      }

      await userRef.set(userData);
    } catch (error) {
      console.error("Error creating user profile", error);
    }
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
        const data = doc.data();
        return {
            id: doc.id,
            displayName: data.displayName || 'N/A',
            email: data.email || 'N/A',
            createdAt: data.createdAt,
            totalUsage: data.totalUsage || 0,
            password: data.password || undefined,
        } as FirestoreUser
    });

    return users;
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

    const [usersSnapshot, toolStatsSnapshot, newUsers7DaysSnapshot, newUsers30DaysSnapshot] = await Promise.all([
        usersRef.get(),
        toolStatsRef.get(),
        usersRef.where('createdAt', '>=', sevenDaysAgo).get(),
        usersRef.where('createdAt', '>=', thirtyDaysAgo).get()
    ]);

    const totalUsers = usersSnapshot.size;
    const newUsers7Days = newUsers7DaysSnapshot.size;
    const newUsers30Days = newUsers30DaysSnapshot.size;

    let totalUsage = 0;
    toolStatsSnapshot.forEach(doc => {
        totalUsage += doc.data().useCount || 0;
    });

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
