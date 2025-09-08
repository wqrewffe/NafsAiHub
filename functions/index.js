// Basic aggregation script for globalPageViews -> hourly aggregates.
// This file is a starting point. Deploying as a Cloud Function requires firebase-functions and proper setup.
const admin = require('firebase-admin');
try { admin.initializeApp(); } catch (e) { /* already initialized in local runs */ }
const db = admin.firestore();

async function aggregateHourly() {
  const now = new Date();
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0, 0);
  const hourKey = `${hourStart.getFullYear()}-${String(hourStart.getMonth()+1).padStart(2,'0')}-${String(hourStart.getDate()).padStart(2,'0')}-${String(hourStart.getHours()).padStart(2,'0')}`;
  const since = new Date(hourStart.getTime());
  // Query page views for this hour
  const snapshot = await db.collection('globalPageViews').where('timestamp', '>=', since).get();
  const events = snapshot.size;
  const users = new Set();
  snapshot.forEach(doc => { const d = doc.data(); if (d.userId) users.add(d.userId); });
  await db.collection('aggregates').doc('activity').collection('hourly').doc(hourKey).set({ events, uniqueUsers: users.size, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log('Aggregated hour', hourKey, { events, uniqueUsers: users.size });
}

if (require.main === module) {
  aggregateHourly().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { aggregateHourly };
