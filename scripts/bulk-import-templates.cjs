#!/usr/bin/env node

/*
  Bulk import up to 500 templates (images, videos, docs) into Firestore + Storage.
  - Detects category from filename/folder using rules aligned with docs/templateslistdocs.md
  - Uploads assets to Firebase Storage and creates Firestore documents in `templates`
  - Generates long-lived signed URLs for previews/sources when needed
  - Supports dry-run and limits

  Usage examples:
    node scripts/bulk-import-templates.cjs --input ./assets --limit 500 --dry-run
    node scripts/bulk-import-templates.cjs -i ./public/videos -i ./import/images --limit 300

  Requirements:
    - serviceAccountKey.json at project root (Firebase Admin)
*/

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');

// ------------------- CLI -------------------
const argv = require('yargs/yargs')(process.argv.slice(2))
  .usage('Usage: $0 --input <dir> [--input <dir> ...] [--limit 500] [--dry-run]')
  .option('input', { alias: 'i', type: 'array', demandOption: true, describe: 'Input directory/directories to scan' })
  .option('limit', { type: 'number', default: 500, describe: 'Max templates to import' })
  .option('dry-run', { type: 'boolean', default: false, describe: 'Do not write to Firestore/Storage' })
  .help().argv;

// ------------------- Admin init -------------------
function initAdmin() {
  const keyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    console.error('Missing serviceAccountKey.json at repo root. Aborting.');
    process.exit(1);
  }
  const serviceAccount = require(keyPath);
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: serviceAccount.project_id + '.firebasestorage.app'
    });
  }
  return { db: admin.firestore(), bucket: getStorage().bucket() };
}

// ------------------- Detection rules -------------------
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.m4v']);
const DOC_EXT = new Set(['.pdf']);

function detectFileType(file) {
  const ext = path.extname(file).toLowerCase();
  if (IMAGE_EXT.has(ext)) return 'image';
  if (VIDEO_EXT.has(ext)) return 'video';
  if (DOC_EXT.has(ext)) return 'document';
  return 'other';
}

function titleCase(s) {
  return s
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Category mapping aligned with docs/templateslistdocs.md
function detectCategory(file, fileType) {
  const lower = file.toLowerCase();
  const inDir = path.dirname(file).toLowerCase();
  const hay = lower + ' ' + inDir;

  // Directories win
  if (/short|reel|story|9x16|9-16/.test(hay)) return 'Shorts';
  if (/thumb|thumbnail|yt-thumb/.test(hay)) return 'Thumbnails';
  if (/doc|resume|report|proposal|invoice|letterhead|certificate|checklist|ebook|guide/.test(hay)) return 'Docs';
  if (/poster|flyer|brochure|business-?card|menu|ticket|photo-?book|print/.test(hay)) return 'Print';
  if (/ad|ads|iab|banner|promo|sale|coupon/.test(hay)) return 'Ads';
  if (/instagram|facebook|tiktok|youtube|twitter|linkedin|pinterest|twitch|social/.test(hay)) return 'Social';
  if (/fashion/.test(hay)) return 'Fashion';
  if (/food|recipe|menu/.test(hay)) return 'Food';
  if (/business|branding|logo/.test(hay)) return 'Business';
  if (/birthday|event|invitation|schedule|program|announcement/.test(hay)) return 'Events/Personal';
  if (/web|newsletter|infographic|timeline|portfolio|moodboard|presentation|slides?/.test(hay)) return 'Web/Content';
  if (/commerce|product|showcase/.test(hay)) return 'Commerce/Promo';

  // File type fallbacks
  if (fileType === 'video') return 'Shorts';
  if (fileType === 'image') return 'Social Media Posts';
  if (fileType === 'document') return 'Docs';
  return 'Misc';
}

// ------------------- Storage helpers -------------------
function uniqueName(original) {
  const ext = path.extname(original);
  const base = path.basename(original, ext).slice(0, 48).replace(/[^a-z0-9-_]/gi, '_');
  const hash = crypto.createHash('md5').update(original + Date.now()).digest('hex').slice(0, 8);
  return `${base}_${hash}${ext}`;
}

async function uploadAndGetUrl(bucket, localPath, destPrefix, folderOverride = null) {
  const fileType = folderOverride || detectFileType(localPath);
  const dest = `${destPrefix}/${fileType}s/${uniqueName(localPath)}`;
  await bucket.upload(localPath, { destination: dest, resumable: true });
  const [url] = await bucket.file(dest).getSignedUrl({ action: 'read', expires: '03-01-2500' });
  return url;
}

// ------------------- Firestore write -------------------
async function writeTemplate(db, data) {
  const ref = await db.collection('templates').add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// ------------------- Video thumbnail generation -------------------
async function generateVideoThumbnail(videoPath) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(path.dirname(videoPath), `thumb_${path.basename(videoPath, path.extname(videoPath))}.jpg`);
    
    // Generate high-quality thumbnail at 2 seconds into video
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-ss', '00:00:02',
      '-vframes', '1',
      '-q:v', '2',  // High quality
      '-vf', 'scale=1920:-1',  // Scale to 1920px width, maintain aspect ratio
      '-y', // Overwrite output file
      outputPath
    ]);

    ffmpeg.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        console.warn(`FFmpeg failed for ${videoPath}, code: ${code}`);
        resolve(null); // Continue without thumbnail
      }
    });

    ffmpeg.on('error', (err) => {
      console.warn(`FFmpeg error for ${videoPath}:`, err.message);
      resolve(null); // Continue without thumbnail
    });
  });
}

// ------------------- Scan and import -------------------
function* walk(dir) {
  const list = fs.readdirSync(dir);
  for (const name of list) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

async function main() {
  const { db, bucket } = initAdmin();
  const inputs = argv.input.map(p => path.resolve(p));
  const files = [];
  for (const dir of inputs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of walk(dir)) {
      const t = detectFileType(f);
      if (t !== 'other') files.push(f);
    }
  }

  if (files.length === 0) {
    console.log('No supported files found. Supported: images(jpg/png/webp/gif), videos(mp4/mov/webm), docs(pdf).');
    return;
  }

  const subset = files.slice(0, argv.limit);
  console.log(`Found ${files.length} assets, importing ${subset.length}${argv['dry-run'] ? ' (dry-run)' : ''}...`);

  let created = 0;
  for (const file of subset) {
    const type = detectFileType(file);
    const category = detectCategory(file, type);
    const title = titleCase(path.basename(file, path.extname(file)));

    let previewUrl = '';
    let sourceUrl = '';
    const destPrefix = `users/system/templates/${category.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

    if (!argv['dry-run']) {
      if (type === 'video') {
        // Upload video file for source
        sourceUrl = await uploadAndGetUrl(bucket, file, destPrefix);
        
        // Generate and upload high-quality thumbnail
        console.log(`  Generating thumbnail for ${path.basename(file)}...`);
        const thumbPath = await generateVideoThumbnail(file);
        if (thumbPath) {
          previewUrl = await uploadAndGetUrl(bucket, thumbPath, destPrefix, 'images');
          // Clean up temporary thumbnail file
          fs.unlinkSync(thumbPath);
        } else {
          previewUrl = sourceUrl; // Fallback to video if thumbnail generation fails
        }
      } else if (type === 'image') {
        previewUrl = await uploadAndGetUrl(bucket, file, destPrefix);
      } else if (type === 'document') {
        // No renderer for docs thumbs yet → use uploaded doc URL as preview for now
        previewUrl = await uploadAndGetUrl(bucket, file, destPrefix);
      }
    }

    const data = {
      title,
      category,
      desc: `Auto-imported ${type} template (${category}).`,
      icon: type === 'video' ? '🎬' : type === 'image' ? '🖼️' : '📄',
      preview: previewUrl || '/default-template.png',
      previewURL: previewUrl || '/default-template.png', // TemplateCard compatibility
      thumbnail: previewUrl || '/default-template.png', // TemplateCard compatibility
      fileType: type,
      tags: ['auto-import', category.toLowerCase(), type],
      useVideoPreview: type === 'video' ? true : undefined,
      videoSource: type === 'video' ? (sourceUrl || undefined) : undefined,
    };

    if (argv['dry-run']) {
      console.log(`[DRY] ${type.toUpperCase()} → ${category} :: ${title}`);
    } else {
      const id = await writeTemplate(db, data);
      created++;
      console.log(`✔ Created ${type} template [${category}] ${title} (id: ${id})`);
    }
  }

  console.log(`\nDone. ${argv['dry-run'] ? 'Prepared' : 'Created'} ${argv['dry-run'] ? subset.length : created} templates.`);
}

main().catch((e) => { console.error(e); process.exit(1); });


