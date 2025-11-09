import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


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

export const auth = app.auth();
export const db = app.firestore();

db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});




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

enableFirestorePersistence();


export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const googleProvider = new firebase.auth.GoogleAuthProvider();
