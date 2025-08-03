// update-firestore-template-videos.cjs
// Bulk update Firestore templates with real Firebase Storage URLs for videoSource and preview fields

const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

console.log('Using Firebase project ID:', serviceAccount.project_id);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'viewsboostv2.firebasestorage.app' // <-- Updated with correct bucket name
});

const db = admin.firestore();
const bucket = getStorage().bucket();

const VIDEO_DIR = 'Templates/Video/';
const TEMPLATES_COLLECTION = 'templates';

async function getAllVideoFiles() {
  const [files] = await bucket.getFiles({ prefix: VIDEO_DIR });
  return files.filter(f => f.name.endsWith('.mp4'));
}

function getPublicUrl(file) {
  // Firebase Storage public URL format
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
}

async function updateTemplates() {
  const videoFiles = await getAllVideoFiles();
  const videoNames = videoFiles.map(f => path.basename(f.name, '.mp4'));
  console.log('Video filenames in Storage:');
  videoNames.forEach(name => console.log(' -', name));

  const snapshot = await db.collection(TEMPLATES_COLLECTION).get();
  const templates = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
  console.log('\nTemplate titles, Firestore IDs, and template IDs:');
  templates.forEach(t => {
    console.log(` - title: ${t.title || ''} | firestoreId: ${t.firestoreId} | id field: ${t.id}`);
  });

  let updatedCount = 0;

  for (const file of videoFiles) {
    const baseName = path.basename(file.name, '.mp4');
    // Match by 'title' field (case-insensitive, ignore spaces)
    const template = templates.find(t =>
      t.title && t.title.replace(/\s+/g, '').toLowerCase() === baseName.replace(/\s+/g, '').toLowerCase()
    );
    if (!template) {
      console.warn(`No template found for video: ${file.name}`);
      continue;
    }
    const url = getPublicUrl(file);
    const docPath = `${TEMPLATES_COLLECTION}/${template.firestoreId}`;
    console.log(`Attempting update at path: ${docPath} (template.title: ${template.title})`);
    try {
      await db.collection(TEMPLATES_COLLECTION).doc(template.firestoreId).update({
        videoSource: url,
        preview: url
      });
      updatedCount++;
      console.log(`Updated template '${template.title}' (Firestore ID: ${template.firestoreId}) with video: ${file.name}`);
    } catch (err) {
      console.error(`Failed to update template '${template.title}' (Firestore ID: ${template.firestoreId}) at path: ${docPath}:`, err);
    }
  }
  console.log(`\nUpdate complete. ${updatedCount} templates updated.`);
}

updateTemplates().then(() => process.exit(0)).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});