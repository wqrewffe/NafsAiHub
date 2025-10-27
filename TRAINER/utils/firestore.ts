import { db, auth, serverTimestamp } from '../../firebase/config';
import firebase from 'firebase/compat/app';

export interface TrainerResult {
  userId?: string | null;
  mode: string;
  stats: any;
  createdAt?: any;
}

/**
 * Save a trainer run result and also emit the same telemetry used by regular tools so
 * admin dashboards (recent activity, toolStats, user toolUsage) pick it up.
 */
export const saveTrainerResult = async (mode: string, stats: any) => {
  try {
    const user = auth.currentUser;
    const payload: TrainerResult = {
      userId: user ? user.uid : null,
      mode,
      stats,
      createdAt: serverTimestamp()
    };

    const docRef = await db.collection('trainerResults').add(payload);

    // Mirror the same telemetry recorded by logToolUsage so admin Recent Activity shows entries
    const timestamp = serverTimestamp();
    const toolId = `trainer-${mode}`;
    const toolName = `Trainer - ${mode}`;

    if (user) {
      try {
        const userRef = db.collection('users').doc(user.uid);

        // 1) Add to user's personal history
        userRef.collection('history').add({
          toolId,
          toolName,
          prompt: '',
          response: typeof stats === 'string' ? stats : JSON.stringify(stats, null, 2),
          timestamp,
        }).catch(() => {});

        // 2) Update global tool usage count
        const globalToolStatRef = db.collection('toolStats').doc(toolId);
        globalToolStatRef.set({
          useCount: firebase.firestore.FieldValue.increment(1),
          toolName,
          toolId,
          category: 'Trainer'
        }, { merge: true }).catch(() => {});

        // 3) Update user-specific tool usage count
        const userToolUsageRef = userRef.collection('toolUsage').doc(toolId);
        userToolUsageRef.set({
          count: firebase.firestore.FieldValue.increment(1),
          lastUsed: timestamp,
          toolName,
          toolId,
        }, { merge: true }).catch(() => {});

        // 4) Update user's total usage count for admin dashboard
        userRef.set({
          totalUsage: firebase.firestore.FieldValue.increment(1)
        }, { merge: true }).catch(() => {});

        // 5) Add to global history feed for admin dashboard
        db.collection('globalHistory').add({
          userId: user.uid,
          toolId,
          toolName,
          timestamp,
        }).catch(() => {});
      } catch (e) {
        // Non-fatal: telemetry best-effort
        console.warn('Failed to write trainer telemetry:', e);
      }
    }

    return { id: docRef.id };
  } catch (err) {
    console.error('Failed to save trainer result', err);
    throw err;
  }
};
