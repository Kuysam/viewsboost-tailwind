const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to your service account key
const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const BUCKET = 'viewsboostv2.firebasestorage.app';
const STORAGE_PREFIX = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/Templates%2FImages%2F`;
const STORAGE_SUFFIX = '?alt=media';

function titleToFilename(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars except space and hyphen
    .replace(/\s+/g, '-')         // spaces to hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '')         // trim hyphens
    + '.jpg';
}

async function updatePreviews() {
  const templatesRef = db.collection('templates');
  const snapshot = await templatesRef.get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const title = data.title;
    if (!title) {
      console.warn(`Skipping ${doc.id}: no title`);
      continue;
    }
    const filename = titleToFilename(title);
    const encoded = encodeURIComponent(filename);
    const previewUrl = `${STORAGE_PREFIX}${encoded}${STORAGE_SUFFIX}`;
    await doc.ref.update({ preview: previewUrl });
    updated++;
    console.log(`Updated ${doc.id} -> ${previewUrl}`);
  }
  console.log(`\nDone. Updated ${updated} templates.`);
  process.exit(0);
}

updatePreviews().catch(err => {
  console.error('Error updating previews:', err);
  process.exit(1);
}); 