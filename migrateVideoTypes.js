// migrateVideoTypes.mjs
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔐 Load service account key
const serviceAccount = JSON.parse(
  await readFile(path.join(__dirname, './serviceAccountKey.json'), 'utf-8')
);

// 🔌 Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * Determines the video type based on duration, title, or stream markers.
 * @param {any} data Firestore video metadata
 */
function getVideoType(data) {
  const duration = data.duration || 0;
  const isShort = duration <= 240; // 4 minutes = 240 seconds

  if (isShort) return 'short';
  if (data.liveBroadcastContent === 'live' || data.liveStreamingDetails) return 'live';
  return 'video';
}

async function migrate() {
  const videosRef = db.collection('videoMetadata');
  const snapshot = await videosRef.get();

  console.log(`🎯 Found ${snapshot.size} videos.`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const type = getVideoType(data);

    if (!type) {
      console.warn(`⚠️ Skipping ${doc.id}, no type determined`);
      continue;
    }

    await doc.ref.update({ type });
    console.log(`✅ Updated video ${doc.id} with type: ${type}`);
  }

  console.log('🚀 Migration complete!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('🔥 Migration failed:', err);
    process.exit(1);
  });
