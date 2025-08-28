Firebase setup for Collaborative Study Room

This project uses Firebase Firestore to persist rooms, messages, and participants.

Recommended security rules (in `firestore.rules`) protect message creation shape and limit writes.

Quick steps to configure and deploy:

1. Install Firebase CLI (if not already):

   npm install -g firebase-tools

2. Login and initialize your project (if not already):

   firebase login
   firebase init firestore

   When prompted, choose your existing Firebase project and answer "No" for default rules overwrite if you want to keep this repo's `firebase/firestore.rules`.

3. Replace the generated `firestore.rules` with `firebase/firestore.rules` from this repo (or copy its contents into the console during init).

4. Deploy rules:

   firebase deploy --only firestore:rules

5. Optional: if you need to test locally, you can start the emulator (install emulators during `firebase init`):

   firebase emulators:start --only firestore

Notes:
- The rules allow reads so new joiners can fetch notes/messages. They restrict client-side writes to message creation with validation and participant create/delete only for self.
- For stronger security in production, require authentication for message writes and participants.
- Consider adding server-side Cloud Functions to enforce moderation, purge stale participants, or to process messages.

If you want, I can add an example `firebase.json` and `firestore.indexes.json` for emulators and local testing.
