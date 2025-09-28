// Re-use the project's primary Firebase (compat) initialization to avoid
// loading multiple SDK variants which can cause "Service firestore is not available".
// The root `firebase/config.ts` initializes firebase using the compat SDK and
// exports `auth` and `db`. Here we import those and provide small wrapper
// functions so the ai-tools-showcase code can continue to call the modular-like
// helpers it expects (onAuthStateChanged, signInWithEmailAndPassword, signOut).

import { auth as compatAuth, db as compatDb } from '../firebase/config';

export const auth = compatAuth as any;
export const db = compatDb as any;

export const onAuthStateChanged = (a: any, cb: any) => {
  // compat: auth.onAuthStateChanged(callback)
  // Some callers pass the auth instance as first arg; ignore and use compatAuth
  return (compatAuth as any).onAuthStateChanged(cb);
};

export const signInWithEmailAndPassword = async (_a: any, email: string, password: string) => {
  // compat: auth.signInWithEmailAndPassword(email, password)
  return (compatAuth as any).signInWithEmailAndPassword(email, password);
};

export const signOut = async (_a?: any) => {
  return (compatAuth as any).signOut();
};