import { db, auth } from '../../firebase/config';

export const fetchTrainerHistory = async (mode: string, limit: number = 20) => {
  const user = auth.currentUser;
  if (!user) return [];
  const q = db.collection('trainerResults')
    .where('userId', '==', user.uid)
    .where('mode', '==', mode)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  const snapshot = await q.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
