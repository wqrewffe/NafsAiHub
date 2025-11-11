import { db, auth } from '../firebase/config';
import { FirestoreUser } from '../types';
import firebase from 'firebase/compat/app';
import { notificationService } from './notificationService';
// Note: The original code mixed v9 modular imports (doc, getDoc) with the v8 compat syntax.
// This version consistently uses the v8 compat syntax (e.g., db.collection(...).doc(...))
// which matches the majority of the original code.

export const isUserAdmin = async (userId: string): Promise<boolean> => {
  if (!userId) {
    console.error('isUserAdmin called with no userId');
    return false;
  }
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    // console.log('Checking admin status for user:', { userId, exists: userDoc.exists, role: userData?.role });

    // Check for various ways admin status might be stored
    const isAdmin = userDoc.exists && (
      userData?.role === 'admin' ||
      userData?.role === 'administrator' ||
      userData?.isAdmin === true
    );

    return !!isAdmin;
  } catch (error) {
    console.error(`Error checking admin status for user ${userId}:`, error);
    return false;
  }
};

/**
 * Persist a global Unlock All Tools setting from the code-defined tools list.
 * Useful to set the global flag without re-running the heavy per-user batch.
 */
export const persistGlobalUnlockFromTools = async (): Promise<void> => {
  try {
    const { tools } = await import('../tools/index');
    const allToolIds = tools.map((t: any) => t.id);
    if (!allToolIds.length) throw new Error('No tools found to persist');

    await db.collection('adminSettings').doc('unlockAllTools').set({
      active: true,
      toolIds: allToolIds,
      unlockedAt: firebase.firestore.Timestamp.now()
    });
    console.log('[ADMIN] Persisted global unlockAllTools via persistGlobalUnlockFromTools');
  } catch (error) {
    console.error('[ADMIN] Failed to persist global unlock from tools:', error);
    throw error;
  }
};

export const givePointsToUser = async (adminId: string, userIdOrEmail: string, points: number): Promise<{
  success: boolean;
  error?: string;
  newTotal?: number;
}> => {
  try {
    // 1. Verify that the requestor is an admin
    const isAdmin = await isUserAdmin(adminId);
    if (!isAdmin) {
      console.warn('Unauthorized attempt to give points by user:', adminId);
      return {
        success: false,
        error: 'Unauthorized: Only admins can give points'
      };
    }

    if (!userIdOrEmail || points === 0) {
      return {
        success: false,
        error: 'User identifier and a non-zero point value are required.'
      };
    }

    // 2. Find the target user by ID or email
    let userRef: firebase.firestore.DocumentReference;
    let userSnapshot: firebase.firestore.DocumentSnapshot;

    // Try finding by ID first
    const potentialUserRefById = db.collection('users').doc(userIdOrEmail);
    const userSnapshotById = await potentialUserRefById.get();

    if (userSnapshotById.exists) {
      userRef = potentialUserRefById;
      userSnapshot = userSnapshotById;
    } else if (userIdOrEmail.includes('@')) {
      // If not found by ID and it looks like an email, query by email
      const usersQuery = await db.collection('users').where('email', '==', userIdOrEmail.toLowerCase()).limit(1).get();
      if (!usersQuery.empty) {
        userSnapshot = usersQuery.docs[0];
        userRef = userSnapshot.ref;
      }
    }

    // @ts-ignore
    if (!userSnapshot || !userSnapshot.exists) {
      console.log('User not found with identifier:', userIdOrEmail);
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    const targetUserId = userSnapshot.id;
    const userData = userSnapshot.data();
    console.log('Found user:', { id: targetUserId, data: userData });

    // 3. Prepare the batched write for atomicity
    const batch = db.batch();
    const timestamp = firebase.firestore.Timestamp.now();

    // 4. Prepare updates for the 'users' document
    const currentUserPoints = userData?.points || 0;
    const currentReferralPoints = userData?.referralRewards || 0;
    const newTotalUserPoints = currentUserPoints + points;

    const pointsHistoryEntry = {
      amount: points,
      source: 'admin',
      adminId: adminId,
      timestamp: timestamp,
      message: `Points awarded by admin`,
    };

    // Create a notification for points awarded
    // Create the points notification using the notification service
    await notificationService.createPointsNotification(targetUserId, points, 'admin');
    
    const userUpdates = {
        points: newTotalUserPoints,
        pointsHistory: firebase.firestore.FieldValue.arrayUnion(pointsHistoryEntry),
        lastPointsUpdate: timestamp
    };

    batch.update(userRef, userUpdates);

    // 5. Prepare updates for the 'toolAccess' document (if it exists)
    const toolAccessRef = db.collection('toolAccess').doc(targetUserId);
    const toolAccessDoc = await toolAccessRef.get();

    if (toolAccessDoc.exists) {
      const toolAccessData = toolAccessDoc.data();
      const currentToolPoints = toolAccessData?.points || 0;
      const newTotalToolPoints = currentToolPoints + points;

      batch.update(toolAccessRef, {
        points: newTotalToolPoints
      });
      console.log('Updating toolAccess points:', { from: currentToolPoints, to: newTotalToolPoints });
    }
    
    // 6. Log the transaction in a separate collection for auditing
    await logPointsTransaction(adminId, targetUserId, points, batch);

    // 7. Commit all changes at once
    await batch.commit();

    const finalTotalPoints = newTotalUserPoints + currentReferralPoints;
    console.log(`Successfully gave ${points} points to user ${targetUserId}. New total: ${finalTotalPoints}`);

    // Create a congratulations event in Firebase for the user
    await db.collection('userEvents').add({
      userId: targetUserId,
      type: 'points',
      data: {
        points,
        message: `An admin has awarded you ${points} points! 🎁\nNew total: ${finalTotalPoints} points`
      },
      createdAt: new Date(),
      read: false
    });

    return {
      success: true,
      newTotal: finalTotalPoints
    };
  } catch (error) {
    console.error('Error in givePointsToUser function:', error);
    return {
      success: false,
      error: 'An internal error occurred while giving points.'
    };
  }
};

export const logPointsTransaction = async (adminId: string, userId: string, points: number, batch?: firebase.firestore.WriteBatch) => {
  try {
    const transactionData = {
      adminId,
      userId,
      points,
      timestamp: firebase.firestore.Timestamp.now(),
      type: 'admin_grant'
    };
    const transactionRef = db.collection('pointsTransactions').doc(); // Auto-generate ID

    if (batch) {
      // If a batch is provided, add the set operation to it
      batch.set(transactionRef, transactionData);
    } else {
      // Otherwise, perform the set operation directly
      await transactionRef.set(transactionData);
    }
  } catch (error) {
    console.error('Error logging points transaction:', error);
    // Don't throw an error, as this is a non-critical logging operation
  }
};

export const getUserPoints = async (userId: string): Promise<number> => {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return 0;

    const userData = userDoc.data();

    // Admins have unlimited points
    if (userData?.role === 'admin' || userData?.isAdmin === true) {
      return Infinity;
    }

    return userData?.points || 0;
  } catch (error) {
    console.error('Error getting user points:', error);
    return 0;
  }
};

export const deductPointsFromUser = async (adminId: string, userIdOrEmail: string, points: number): Promise<{
  success: boolean;
  error?: string;
  newTotal?: number;
}> => {
  try {
    const isAdmin = await isUserAdmin(adminId);
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Only admins can deduct points' };
    }

    const deduction = Math.abs(points);
    if (!userIdOrEmail || deduction === 0) {
      return { success: false, error: 'User identifier and a non-zero point value are required.' };
    }

    let userRef: firebase.firestore.DocumentReference | undefined;
    let userSnapshot: firebase.firestore.DocumentSnapshot | undefined;

    const byIdRef = db.collection('users').doc(userIdOrEmail);
    const byIdSnap = await byIdRef.get();
    if (byIdSnap.exists) {
      userRef = byIdRef;
      userSnapshot = byIdSnap;
    } else if (userIdOrEmail.includes('@')) {
      const q = await db.collection('users').where('email', '==', userIdOrEmail.toLowerCase()).limit(1).get();
      if (!q.empty) {
        userSnapshot = q.docs[0];
        userRef = userSnapshot.ref;
      }
    }

    if (!userRef || !userSnapshot || !userSnapshot.exists) {
      return { success: false, error: 'User not found' };
    }

    const targetUserId = userSnapshot.id;
    const userData: any = userSnapshot.data() || {};

    if (userData?.role === 'admin' || userData?.isAdmin === true) {
      return { success: false, error: 'Cannot modify points for admin users' };
    }

    const batch = db.batch();
    const timestamp = firebase.firestore.Timestamp.now();

    const currentUserPoints = userData?.points || 0;
    const currentReferralPoints = userData?.referralRewards || 0;
    const newUserPoints = Math.max(0, currentUserPoints - deduction);

    const historyEntry = {
      amount: -deduction,
      source: 'admin',
      adminId: adminId,
      timestamp: timestamp,
      message: 'Points deducted by admin',
    };

    await notificationService.createPointsNotification(targetUserId, -deduction, 'admin');

    batch.update(userRef, {
      points: newUserPoints,
      pointsHistory: firebase.firestore.FieldValue.arrayUnion(historyEntry),
      lastPointsUpdate: timestamp,
    });

    const toolAccessRef = db.collection('toolAccess').doc(targetUserId);
    const toolAccessDoc = await toolAccessRef.get();
    if (toolAccessDoc.exists) {
      const toolAccessData = toolAccessDoc.data();
      const currentToolPoints = toolAccessData?.points || 0;
      const newToolPoints = Math.max(0, currentToolPoints - deduction);
      batch.update(toolAccessRef, { points: newToolPoints });
    }

    await logPointsTransaction(adminId, targetUserId, -deduction, batch);
    await batch.commit();

    const finalTotalPoints = newUserPoints + currentReferralPoints;

    await db.collection('userEvents').add({
      userId: targetUserId,
      type: 'points',
      data: {
        points: -deduction,
        message: `An admin has deducted ${deduction} points. Current total: ${finalTotalPoints} points`,
      },
      createdAt: new Date(),
      read: false,
    });

    return { success: true, newTotal: finalTotalPoints };
  } catch (error) {
    console.error('Error in deductPointsFromUser function:', error);
    return { success: false, error: 'An internal error occurred while deducting points.' };
  }
};


/**
 * Deletes a user's data from Firestore collections.
 * @param userId The ID of the user to delete
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      throw new Error(`User with ID ${userId} not found in Firestore.`);
    }

    console.log(`Starting deletion for user ${userId}...`);
    const batch = db.batch();

    // 1. Delete user's tool usage sub-collection
    const toolUsageRef = userDocRef.collection('toolUsage');
    const toolUsageDocs = await toolUsageRef.get();
    if (!toolUsageDocs.empty) {
      console.log(`Deleting ${toolUsageDocs.size} documents from toolUsage sub-collection...`);
      toolUsageDocs.forEach(doc => batch.delete(doc.ref));
    }

    // 2. Delete related documents in other collections (e.g., toolAccess)
    const toolAccessRef = db.collection('toolAccess').doc(userId);
    batch.delete(toolAccessRef);

    // 3. Delete the main user document
    batch.delete(userDocRef);

    // Commit all deletions
    await batch.commit();

    console.log(`Successfully deleted Firestore data for user ${userId}.`);

    // DANGER ZONE: Deleting from Firebase Authentication
    // The following code can ONLY be run on the client-side by the user THEMSELVES after a recent sign-in.
    // It WILL NOT WORK from an admin panel or a server environment.
    // To delete a user from an admin context, you MUST use the Firebase Admin SDK on a secure server (e.g., Cloud Function).
    // Example of what NOT to do in an admin panel:
    /*
    if (auth.currentUser?.uid === userId) {
        await auth.currentUser.delete();
        console.log("Deleted user from Firebase Authentication.");
    } else {
        console.warn("CANNOT delete user from Auth. This must be done via the Admin SDK on a server.");
    }
    */

  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};


/**
 * Toggle a user's blocked status.
 * @param userId The ID of the user to block/unblock
 * @param blocked The new blocked status
 */
export const toggleUserBlock = async (userId: string, blocked: boolean): Promise<void> => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    await userRef.update({
      isBlocked: blocked
    });

    console.log(`Successfully ${blocked ? 'blocked' : 'unblocked'} user ${userId}`);
  } catch (error) {
    console.error(`Error toggling block status for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get all users with their associated data from the 'users' collection.
 */
export const getAllUsers = async (): Promise<FirestoreUser[]> => {
  try {
    const usersSnapshot = await db.collection('users').get();
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirestoreUser));
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

/**
 * Lock (block) a specific tool for all users by preventing access in toolAccess documents
 * @param toolId The ID of the tool to lock
 * @returns Count of users affected
 */
export const blockToolForAllUsers = async (toolId: string): Promise<number> => {
  try {
    const batch = db.batch();
    let count = 0;

    // Get all toolAccess documents
    const toolAccessSnapshot = await db.collection('toolAccess').get();

    toolAccessSnapshot.forEach(doc => {
      const data = doc.data();
      const unlockedTools = data.unlockedTools || [];
      
      // Only update if the tool is in the unlockedTools array
      if (unlockedTools.includes(toolId)) {
        const updatedTools = unlockedTools.filter((id: string) => id !== toolId);
        batch.update(doc.ref, {
          unlockedTools: updatedTools
        });
        count++;
      }
    });

    await batch.commit();
    console.log(`Successfully locked tool ${toolId} for ${count} users`);
    return count;
  } catch (error) {
    console.error(`Error locking tool ${toolId} for all users:`, error);
    throw error;
  }
};

/**
 * Unlock a specific tool for all users by adding it to their toolAccess documents
 * @param toolId The ID of the tool to unlock
 * @returns Count of users affected
 */
export const unlockToolForAllUsers = async (toolId: string): Promise<number> => {
  try {
    const batch = db.batch();
    let count = 0;

    // Get all toolAccess documents
    const toolAccessSnapshot = await db.collection('toolAccess').get();

    toolAccessSnapshot.forEach(doc => {
      const data = doc.data();
      const unlockedTools = data.unlockedTools || [];
      
      // Only update if the tool is not already in the unlockedTools array
      if (!unlockedTools.includes(toolId)) {
        batch.update(doc.ref, {
          unlockedTools: [...unlockedTools, toolId]
        });
        count++;
      }
    });

    await batch.commit();
    console.log(`Successfully unlocked tool ${toolId} for ${count} users`);
    return count;
  } catch (error) {
    console.error(`Error unlocking tool ${toolId} for all users:`, error);
    throw error;
  }
};

/**
 * Lock (block) all tools for all users
 * Only removes admin-unlocked tools, preserves purchased/earned tools
 * @returns Count of users affected
 */
export const blockAllToolsForAllUsers = async (): Promise<number> => {
  try {
    console.log('[LOCK] Starting blockAllToolsForAllUsers...');
    const batch = db.batch();
    let count = 0;

    // Get all toolAccess documents
    const toolAccessSnapshot = await db.collection('toolAccess').get();
    console.log(`[LOCK] Found ${toolAccessSnapshot.size} users to update`);

    toolAccessSnapshot.forEach(doc => {
      const data = doc.data();
      // Check if user is not admin
      if (!data.isAdmin) {
        // Get tools that were admin-unlocked
        const adminUnlockedTools = data.adminUnlockedTools || [];
        const currentUnlockedTools = data.unlockedTools || [];
        
        console.log(`[LOCK] User ${doc.id}: has ${currentUnlockedTools.length} tools, ${adminUnlockedTools.length} were admin-granted`);
        
        // Remove only admin-unlocked tools, keep purchased ones
        const remainingTools = currentUnlockedTools.filter(
          (toolId: string) => !adminUnlockedTools.includes(toolId)
        );
        
        console.log(`[LOCK] User ${doc.id}: will have ${remainingTools.length} tools after lock (purchased only)`);
        
        batch.update(doc.ref, {
          unlockedTools: remainingTools,
          adminUnlockedAt: null, // Clear admin unlock timestamp
          adminUnlockedTools: [] // Clear admin unlocked tools list
        });
        count++;
      }
    });

    console.log(`[LOCK] Committing batch for ${count} users...`);
    await batch.commit();
    // Also clear the global admin unlock flag so new users won't be auto-unlocked
    try {
      await db.collection('adminSettings').doc('unlockAllTools').set({
        active: false,
        toolIds: [],
        unlockedAt: null
      }, { merge: true });
      console.log('[LOCK] ✅ Cleared global unlockAllTools setting');
    } catch (e) {
      console.warn('[LOCK] ⚠️ Failed to clear global unlockAllTools setting', e);
    }

    console.log(`[LOCK] ✅ Successfully locked admin-unlocked tools for ${count} non-admin users (preserved purchases)`);
    return count;
  } catch (error) {
    console.error('[LOCK] ❌ Error locking all tools for all users:', error);
    throw error;
  }
};

/**
 * Unlock all tools for all users (preserves purchased tools)
 * Adds a flag to track which tools are admin-unlocked vs purchased
 * @returns Count of users affected
 */
export const unlockAllToolsForAllUsers = async (): Promise<number> => {
  try {
    console.log('[UNLOCK] Starting unlockAllToolsForAllUsers...');
    const batch = db.batch();
    let count = 0;

    // Import tools from the tools folder (81+ tools defined in code)
    // This ensures we unlock ALL tools, not just the ones in Firestore
    const { tools } = await import('../tools/index');
    const allToolIds = tools.map(tool => tool.id);
    console.log(`[UNLOCK] Found ${allToolIds.length} total tools from tools/index.tsx`);
    console.log(`[UNLOCK] Tool IDs: [${allToolIds.slice(0, 10).join(', ')}${allToolIds.length > 10 ? '...' : ''}]`);

    if (allToolIds.length === 0) {
      console.warn('[UNLOCK] No tools found in tools/index.tsx!');
      throw new Error('No tools found in tools/index.tsx');
    }

    // Get all toolAccess documents
    const toolAccessSnapshot = await db.collection('toolAccess').get();
    console.log(`[UNLOCK] Found ${toolAccessSnapshot.size} users to update`);

    toolAccessSnapshot.forEach(doc => {
      const data = doc.data();
      // Check if user is not admin
      if (!data.isAdmin) {
        const currentUnlockedTools = data.unlockedTools || [];
        console.log(`[UNLOCK] User ${doc.id}: currently has ${currentUnlockedTools.length} tools`);
        
        // Combine existing (purchased) tools with new (admin-unlocked) tools
        const mergedTools = [...new Set([...currentUnlockedTools, ...allToolIds])];
        
        console.log(`[UNLOCK] User ${doc.id}: will have ${mergedTools.length} tools after unlock`);
        
        batch.update(doc.ref, {
          unlockedTools: mergedTools,
          adminUnlockedAt: firebase.firestore.Timestamp.now(), // Use Firestore server timestamp
          adminUnlockedTools: allToolIds // Track which tools were admin-unlocked
        });
        count++;
      }
    });

    console.log(`[UNLOCK] Committing batch for ${count} users...`);
    await batch.commit();
    console.log(`[UNLOCK] Committing global unlock state...`);
    try {
      // Persist a global flag so future users also get unlocked tools on account creation
      await db.collection('adminSettings').doc('unlockAllTools').set({
        active: true,
        toolIds: allToolIds,
        unlockedAt: firebase.firestore.Timestamp.now()
      });
      console.log('[UNLOCK] ✅ Persisted global unlockAllTools setting');
    } catch (e) {
      console.warn('[UNLOCK] ⚠️ Failed to persist global unlockAllTools setting', e);
    }

    console.log(`[UNLOCK] ✅ Successfully unlocked all ${allToolIds.length} tools for ${count} non-admin users (preserving purchases)`);
    return count;
  } catch (error) {
    console.error('[UNLOCK] ❌ Error unlocking all tools for all users:', error);
    throw error;
  }
};

/**
 * Check the current unlock status globally
 * Returns info about how many users have admin-unlocked tools
 */
export const checkUnlockStatus = async (): Promise<{
  isAdminUnlockActive: boolean;
  affectedUsers: number;
  totalUsers: number;
}> => {
  try {
    console.log('[STATUS] Checking admin unlock status...');
    const toolAccessSnapshot = await db.collection('toolAccess').get();
    const totalUsers = toolAccessSnapshot.size;
    
    let affectedUsers = 0;
    toolAccessSnapshot.forEach(doc => {
      const data = doc.data();
      if (!data.isAdmin && data.adminUnlockedAt) {
        affectedUsers++;
      }
    });

    const isAdminUnlockActive = affectedUsers > 0;
    console.log(`[STATUS] Admin unlock is ${isAdminUnlockActive ? '✅ ACTIVE' : '❌ INACTIVE'} for ${affectedUsers}/${totalUsers} users`);
    
    return {
      isAdminUnlockActive,
      affectedUsers,
      totalUsers
    };
  } catch (error) {
    console.error('[STATUS] ❌ Error checking unlock status:', error);
    throw error;
  }
};
