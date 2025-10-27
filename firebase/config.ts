import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


// WARNING: It is strongly recommended to use environment variables for your Firebase config
export const firebaseConfig = {
   apiKey: "AIzaSyA5Ejm2hcRQv-ZEne_1Eo7wOHw6asweg3A",
  authDomain: "nafs--hub.firebaseapp.com",
  projectId: "nafs--hub",
  storageBucket: "nafs--hub.firebasestorage.app",
  messagingSenderId: "165407273951",
  appId: "1:165407273951:web:690556f5da6ce6fe3eca6a",
  measurementId: "G-7F8R9GYM93"
};

// Initialize Firebase App
let app: firebase.app.App;
try {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw new Error("Critical: Firebase initialization failed");
}

// Initialize Firebase services
export const auth = app.auth();
export const db = app.firestore();

// Configure Firestore settings
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// NOTE: Firestore offline persistence was previously enabled here. That can cause
// Firestore to return cached (stale) data immediately via onSnapshot/getDocs when
// the network response is still pending — which can produce the "past content"
// flash users reported. To avoid showing stale UI we disable persistence by
// default. If you need offline support, re-enable persistence and ensure
// components check snapshot.metadata.fromCache before rendering cached results.

/*
const enableFirestorePersistence = async () => {
  try {
    await db.enablePersistence({
      synchronizeTabs: true
    });
    console.log('Firestore persistence enabled successfully');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open. Only one tab can enable persistence.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence not supported in this browser');
    } else {
      console.error('Unexpected error enabling Firestore persistence:', err);
    }
  }
};

// Disabled by default to prevent stale cached UI from appearing on first render
// enableFirestorePersistence();
*/

export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const googleProvider = new firebase.auth.GoogleAuthProvider();