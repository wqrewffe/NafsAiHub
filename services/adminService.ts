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
