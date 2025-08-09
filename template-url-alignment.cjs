// Template URL Alignment Script - Fix URL mismatches
const admin = require('firebase-admin');
const { FIREBASE_STORAGE_MAPPINGS } = await import('./suggested-firebase-mappings.js');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'viewsboostv2.firebasestorage.app'
});

const db = admin.firestore();

async function alignTemplateUrls() {
  console.log('🔧 Starting URL alignment...');
  
  try {
    const templatesSnapshot = await db.collection('templates').get();
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ref: doc.ref,
      ...doc.data()
    }));

    console.log(`📊 Processing ${templates.length} templates...`);

    let updated = 0;
    let aligned = 0;
    
    for (const template of templates) {
      const titleKey = template.title.toLowerCase().replace(/\s+/g, '');
      const mapping = FIREBASE_STORAGE_MAPPINGS[titleKey];
      
      if (mapping) {
        console.log(`✅ Found mapping for: ${template.title}`);
        
        const updates = {};
        let needsUpdate = false;
        
        // Update video source if mapping has video
        if (mapping.video) {
          const newVideoUrl = `https://firebasestorage.googleapis.com/v0/b/viewsboostv2.firebasestorage.app/o/${mapping.video}?alt=media`;
          if (template.videoSource !== newVideoUrl) {
            updates.videoSource = newVideoUrl;
            updates.type = 'video';
            needsUpdate = true;
          }
        }
        
        // Update image URL if mapping has image
        if (mapping.image) {
          const newImageUrl = `https://firebasestorage.googleapis.com/v0/b/viewsboostv2.firebasestorage.app/o/${mapping.image}?alt=media`;
          if (template.imageUrl !== newImageUrl || template.preview !== newImageUrl) {
            updates.imageUrl = newImageUrl;
            updates.preview = newImageUrl;
            if (!mapping.video) {
              updates.type = 'image';
            }
            needsUpdate = true;
          }
        }
        
        // Update lastModified
        if (needsUpdate) {
          updates.lastModified = admin.firestore.FieldValue.serverTimestamp();
          updates.updatedBy = 'url-alignment-script';
          
          await template.ref.update(updates);
          updated++;
          console.log(`🔄 Updated: ${template.title}`);
        }
        
        aligned++;
      } else {
        console.log(`⚠️ No mapping found for: ${template.title} (${titleKey})`);
      }
    }
    
    console.log('\n✨ URL Alignment Complete!');
    console.log(`📊 Templates processed: ${templates.length}`);
    console.log(`🎯 Templates aligned: ${aligned}`);
    console.log(`🔄 Templates updated: ${updated}`);
    console.log(`⚠️ Templates without mappings: ${templates.length - aligned}`);
    
  } catch (error) {
    console.error('❌ URL alignment failed:', error);
  }
}

alignTemplateUrls().then(() => {
  process.exit(0);
});