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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

// Enable offline persistence
try {
  db.enablePersistence()
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a time.
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore persistence not supported in this browser.');
      }
    });
} catch (error) {
    console.error("Error enabling Firestore persistence", error);
}

export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
export const googleProvider = new firebase.auth.GoogleAuthProvider();