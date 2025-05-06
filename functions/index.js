// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// 🔁 Track YouTube API quota usage
exports.logApiUsage = functions.https.onCall(async (data, context) => {
  const { keyUsed } = data;
  const today = new Date().toISOString().split("T")[0];

  const ref = db.collection("usage").doc(today);
  await db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const existing = doc.exists ? doc.data().quota || {} : {};
    const updated = {
      ...existing,
      [keyUsed]: (existing[keyUsed] || 0) + 1,
    };
    t.set(ref, { quota: updated }, { merge: true });
  });

  return { success: true };
});

// 👤 Track user login
exports.logLogin = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "User not logged in");
  }

  const today = new Date().toISOString().split("T")[0];
  const ref = db.collection("usage").doc(today);
  await db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const logins = doc.exists ? doc.data().logins || 0 : 0;
    t.set(ref, { logins: logins + 1 }, { merge: true });
  });

  return { success: true };
});
