#!/usr/bin/env node
/*
  Seed editable templates into Firestore.
  Usage:
    node scripts/seed-templates.cjs auto            # generate 60 items (45 image, 15 video)
    node scripts/seed-templates.cjs seeds.json      # seed from file
  Requires serviceAccountKey.json at repo root.
*/
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function initAdmin() {
  const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    console.error('Missing serviceAccountKey.json at project root.');
    process.exit(1);
  }
  const serviceAccount = require(keyPath);
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  return admin.firestore();
}

const CATEGORIES = [
  { key: 'Shorts', ar: '9/16' },
  { key: 'Thumbnails', ar: '16/9' },
  { key: 'Docs', ar: '1/1' },
  { key: 'Social', ar: '1/1' },
  { key: 'Ads', ar: '16/9' },
  { key: 'Print', ar: '1/1' },
  { key: 'Web', ar: '16/9' },
  { key: 'Branding', ar: '1/1' },
  { key: 'Events', ar: '1/1' },
  { key: 'Commerce', ar: '1/1' },
];

function whFromAR(ar) {
  if (ar === '9/16') return { w: 1080, h: 1920 };
  if (ar === '16/9') return { w: 1280, h: 720 };
  return { w: 1080, h: 1080 };
}

function makeAutoRows(n = 60) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const cat = CATEGORIES[i % CATEGORIES.length];
    const { w, h } = whFromAR(cat.ar);
    const isVideo = i % 4 === 0; // ~15 videos
    const videoId = (i % 6) + 1; // reuse sample videos 1..6
    const item = {
      title: `${cat.key} Template ${i + 1}`,
      category: cat.key,
      width: w,
      height: h,
      tags: [cat.key.toLowerCase()],
      layers: isVideo
        ? [ { type: 'video', url: `/videos/video${videoId}.mp4`, x: 0, y: 0, w: Math.floor(w * 0.9), autoplay: true, muted: true, loop: true } ]
        : [ { type: 'image', url: `https://picsum.photos/seed/seed-${i}/${w}/${h}`, x: 0, y: 0, w: Math.floor(w * 0.95) } ],
    };
    rows.push(item);
  }
  return rows;
}

async function writeTemplates(db, rows) {
  const batch = db.batch();
  const col = db.collection('templates');
  let count = 0;
  for (const row of rows) {
    const ref = col.doc();
    const doc = {
      title: row.title,
      category: row.category,
      tags: row.tags || [],
      width: row.width,
      height: row.height,
      aspectRatio: `${row.width}:${row.height}`,
      baseDoc: {
        width: row.width,
        height: row.height,
        bg: row.bg || '#ffffff',
        layers: row.layers || [],
        schemaVersion: 1,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      featured: false,
      popularityScore: Math.random(),
    };
    batch.set(ref, doc, { merge: true });
    count++;
    if (count % 400 === 0) { // safety split (batch limit 500)
      await batch.commit();
    }
  }
  await batch.commit();
}

async function main() {
  const arg = process.argv[2];
  const db = initAdmin();
  let rows = [];
  if (arg === 'auto' || !arg) {
    rows = makeAutoRows(60);
  } else {
    const seedPath = path.resolve(process.cwd(), arg);
    rows = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  }
  console.log(`Seeding ${rows.length} templates…`);
  await writeTemplates(db, rows);
  console.log('✅ Done. You can now open /studio and see rows fill.');
}

main().catch((e)=>{ console.error(e); process.exit(1); });


