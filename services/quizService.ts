import { db, serverTimestamp } from '../firebase/config';
import firebase from 'firebase/compat/app';

export interface QuizQuestionDTO {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

export interface QuizDTO {
  id?: string;
  title: string;
  organizerId: string;
  createdAt?: firebase.firestore.FieldValue | firebase.firestore.Timestamp;
  questions: QuizQuestionDTO[];
}

export interface CompetitionDTO {
  id?: string;
  quizId: string;
  startAt: firebase.firestore.Timestamp | string;
  endAt: firebase.firestore.Timestamp | string;
  // registration fields
  registrationEndsAt?: firebase.firestore.Timestamp | string;
  isPaid?: boolean;
  fee?: number;
  organizerPhone?: string;
  participants?: { userId: string; name: string; score?: number }[];
}

export const createQuiz = async (quiz: QuizDTO) => {
  const ref = await db.collection('quizzes').add({
    ...quiz,
    createdAt: serverTimestamp()
  });
  return ref.id;
};

export const updateQuiz = async (quizId: string, quiz: Partial<QuizDTO>) => {
  const payload: any = { ...quiz };
  Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
  await db.collection('quizzes').doc(quizId).set({ ...payload, updatedAt: serverTimestamp() }, { merge: true });
};

export const createCompetition = async (competition: CompetitionDTO) => {
  // Firestore rejects fields with `undefined` values. Remove any undefined keys first.
  const payload: any = { ...competition };
  Object.keys(payload).forEach(k => {
    if (payload[k] === undefined) delete payload[k];
  });
  const ref = await db.collection('competitions').add({
    ...payload,
    createdAt: serverTimestamp()
  });
  return ref.id;
};

export const updateCompetition = async (competitionId: string, competition: Partial<CompetitionDTO & { draft?: boolean; visible?: boolean; organizerId?: string }>) => {
  const payload: any = { ...competition };
  Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
  await db.collection('competitions').doc(competitionId).set({ ...payload, updatedAt: serverTimestamp() }, { merge: true });
};

export const saveCompetitionDraft = async (competition: any) => {
  // competition may include id (existing draft) or be new
  const payload: any = { ...competition };
  Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });
  payload.draft = true;
  // default hidden until published
  if (payload.visible === undefined) payload.visible = false;
  // embed quiz document into the draft so MCQs are preserved with the draft
  try {
    if (payload.quizId && !payload.quiz) {
      const qdoc = await db.collection('quizzes').doc(String(payload.quizId)).get();
      if (qdoc.exists) payload.quiz = { id: qdoc.id, ...qdoc.data() };
    }
  } catch (err) {
    console.error('Failed to fetch quiz for draft embedding', err);
  }

  if (payload.id) {
    const id = payload.id;
    delete payload.id;
    await db.collection('competitions').doc(id).set({ ...payload, updatedAt: serverTimestamp() }, { merge: true });
    return id;
  }
  const ref = await db.collection('competitions').add({ ...payload, createdAt: serverTimestamp() });
  return ref.id;
};

export const listDraftsForOrganizer = async (organizerId: string) => {
  const snapshot = await db.collection('competitions').where('draft', '==', true).where('organizerId', '==', organizerId).orderBy('createdAt', 'desc').get();
  const items = await Promise.all(snapshot.docs.map(async d => {
    const data: any = { id: d.id, ...d.data() };
    if (data.quizId && !data.quiz) {
      try {
        const qdoc = await db.collection('quizzes').doc(String(data.quizId)).get();
        if (qdoc.exists) data.quiz = { id: qdoc.id, ...qdoc.data() };
      } catch (err) {
        console.error('Failed to fetch quiz for draft', d.id, err);
      }
    }
    return data;
  }));
  return items;
};

export const getCompetition = async (competitionId: string) => {
  const doc = await db.collection('competitions').doc(competitionId).get();
  if (!doc.exists) return null;
  const data: any = { id: doc.id, ...doc.data() };
  if (data.quizId && !data.quiz) {
    try {
      const qdoc = await db.collection('quizzes').doc(String(data.quizId)).get();
      if (qdoc.exists) data.quiz = { id: qdoc.id, ...qdoc.data() };
    } catch (err) {
      console.error('Failed to fetch quiz for competition', competitionId, err);
    }
  }
  return data;
};

export const getQuiz = async (quizId: string) => {
  const doc = await db.collection('quizzes').doc(quizId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const registerForCompetition = async (competitionId: string, registration: { userId: string; name: string; paymentTxn?: string; payerPhone?: string; fbProfile?: string; registeredAt?: any }) => {
  const regRef = await db.collection('competitions').doc(competitionId).collection('registrations').add({
    ...registration,
    verified: false,
    registeredAt: registration.registeredAt || serverTimestamp()
  });
  // if competition is free, auto-verify by adding to participants array
  try {
    const compDoc = await db.collection('competitions').doc(competitionId).get();
    const data: any = compDoc.exists ? compDoc.data() : null;
    if (data && !data.isPaid) {
      // add to participants; include fbProfile if provided in registration
      const participantObj: any = { userId: registration.userId, name: registration.name };
      if ((registration as any).fbProfile) participantObj.fbProfile = (registration as any).fbProfile;
      await db.collection('competitions').doc(competitionId).set({ participants: firebase.firestore.FieldValue.arrayUnion(participantObj) }, { merge: true });
      // mark registration verified
      await regRef.set({ verified: true }, { merge: true });
    }
  } catch (err) {
    console.error('Error during auto-verify registration', err);
  }
  return regRef.id;
};

// Start an attempt for a user (records startedAt in competitions/{id}/attempts/{userId})
export const startAttempt = async (competitionId: string, userId: string, name?: string) => {
  const attemptRef = db.collection('competitions').doc(competitionId).collection('attempts').doc(userId);
  await attemptRef.set({ userId, name: name || null, startedAt: serverTimestamp(), status: 'started' }, { merge: true });
  return attemptRef.id;
};

export const getAttempt = async (competitionId: string, userId: string) => {
  const attemptRef = db.collection('competitions').doc(competitionId).collection('attempts').doc(userId);
  const doc = await attemptRef.get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

export const onRegistrationsSnapshot = (competitionId: string, onUpdate: (items: any[]) => void) => {
  const q = db.collection('competitions').doc(competitionId).collection('registrations').orderBy('registeredAt', 'asc');
  return q.onSnapshot(snapshot => {
    const items: any[] = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    onUpdate(items);
  });
};

export const verifyRegistration = async (competitionId: string, registrationId: string, allow: boolean) => {
  const regRef = db.collection('competitions').doc(competitionId).collection('registrations').doc(registrationId);
  const regDoc = await regRef.get();
  if (!regDoc.exists) throw new Error('Registration not found');
  const reg = regDoc.data() as any;
  await regRef.set({ verified: allow, verifiedAt: serverTimestamp() }, { merge: true });
  if (allow) {
  // add to participants array (include fbProfile if present)
  const participantObj: any = { userId: reg.userId, name: reg.name };
  if (reg.fbProfile) participantObj.fbProfile = reg.fbProfile;
  await db.collection('competitions').doc(competitionId).set({ participants: firebase.firestore.FieldValue.arrayUnion(participantObj) }, { merge: true });
  }
};

export const listCompetitions = async () => {
  const snapshot = await db.collection('competitions').orderBy('startAt', 'desc').get();
  const items = await Promise.all(snapshot.docs.map(async d => {
    const data: any = { id: d.id, ...d.data() };
    // if competition stores only quizId, fetch the quiz doc so callers have quiz.title and questions
    if (data.quizId && !data.quiz) {
      try {
        const qdoc = await db.collection('quizzes').doc(String(data.quizId)).get();
        if (qdoc.exists) data.quiz = { id: qdoc.id, ...qdoc.data() };
      } catch (err) {
        console.error('Failed to fetch quiz for competition', d.id, err);
      }
    }
    return data;
  }));
  return items;
};

export const onCompetitionsSnapshot = (onUpdate: (items: any[]) => void) => {
  const q = db.collection('competitions').orderBy('startAt', 'asc');
  return q.onSnapshot(snapshot => {
    // we need to enrich competition docs with the quiz document when only quizId is stored
    (async () => {
      const docs = snapshot.docs;
      const items = await Promise.all(docs.map(async doc => {
        const data: any = { id: doc.id, ...doc.data() };
        if (data.quizId && !data.quiz) {
          try {
            const qdoc = await db.collection('quizzes').doc(String(data.quizId)).get();
            if (qdoc.exists) data.quiz = { id: qdoc.id, ...qdoc.data() };
          } catch (err) {
            console.error('Failed to fetch quiz for competition', doc.id, err);
          }
        }
        return data;
      }));
      onUpdate(items);
    })();
  });
};

export const joinCompetition = async (competitionId: string, participant: { userId: string; name: string }) => {
  const compRef = db.collection('competitions').doc(competitionId);
  await compRef.set({ participants: firebase.firestore.FieldValue.arrayUnion(participant) }, { merge: true });
};

export const submitCompetitionScore = async (competitionId: string, participant: { userId: string; name: string; score: number }) => {
  const compRef = db.collection('competitions').doc(competitionId);
  // Ensure we have a display name for the participant. If not provided, try to fetch from users collection.
  let name = participant.name;
  try {
    if (!name || name === 'Anonymous') {
      const userDoc = await db.collection('users').doc(participant.userId).get();
      if (userDoc.exists) {
        const data: any = userDoc.data();
        if (data && data.displayName) name = data.displayName;
      }
    }
  } catch (err) {
    console.error('Failed to lookup user displayName', err);
  }

  // Try to compute elapsedMs relative to competition.startAt (client-side fallback)
  let elapsedMs: number | undefined = undefined;
  try {
    const compDoc = await compRef.get();
    if (compDoc.exists) {
      const cdata: any = compDoc.data();
      if (cdata && cdata.startAt) {
        const start = new Date(cdata.startAt).getTime();
        if (!isNaN(start)) elapsedMs = Date.now() - start;
      }
    }
  } catch (err) {
    console.error('Failed to read competition start time for elapsedMs', err);
  }

  const payload: any = { userId: participant.userId, name: name || 'Anonymous', score: participant.score, timestamp: serverTimestamp() };
  if (typeof elapsedMs === 'number') payload.elapsedMs = elapsedMs;
  await compRef.collection('scores').add(payload);
  // update attempt doc if present
  try {
    const attemptRef = db.collection('competitions').doc(competitionId).collection('attempts').doc(participant.userId);
    const aDoc = await attemptRef.get();
    if (aDoc.exists) {
      await attemptRef.set({ finishedAt: serverTimestamp(), elapsedMs: payload.elapsedMs, status: 'finished' }, { merge: true });
    }
  } catch (err) {
    console.error('Failed to update attempt doc', err);
  }
};

// Admin helpers
export const deleteCompetition = async (competitionId: string) => {
  await db.collection('competitions').doc(competitionId).delete();
};

export const setCompetitionVisibility = async (competitionId: string, visible: boolean) => {
  await db.collection('competitions').doc(competitionId).set({ visible }, { merge: true });
};

// Hide all competitions that have already ended (endAt < now)
export const hidePastCompetitions = async () => {
  const now = new Date();
  const snapshot = await db.collection('competitions').where('endAt', '<', now).get();
  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.set(doc.ref, { visible: false }, { merge: true });
  });
  await batch.commit();
  return snapshot.size;
};

// Hide all competitions that are scheduled in the future (startAt > now)
export const hideFutureCompetitions = async () => {
  const now = new Date();
  const snapshot = await db.collection('competitions').where('startAt', '>', now).get();
  const batch = db.batch();
  snapshot.forEach(doc => {
    batch.set(doc.ref, { visible: false }, { merge: true });
  });
  await batch.commit();
  return snapshot.size;
};

// Make all competitions visible (bulk operation)
export const showAllCompetitions = async () => {
  const snapshot = await db.collection('competitions').get();
  const batch = db.batch();
  snapshot.forEach(doc => batch.set(doc.ref, { visible: true }, { merge: true }));
  await batch.commit();
  return snapshot.size;
};
