#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDiwC3Dmd88-t3N9iRfKcF_3_KmP3dqJ-8",
  authDomain: "viewsboost-4c2a6.firebaseapp.com",
  projectId: "viewsboost-4c2a6",
  storageBucket: "viewsboost-4c2a6.appspot.com",
  messagingSenderId: "135434932828",
  appId: "1:135434932828:web:7bb9d7c6af82aab9b7aa87",
  measurementId: "G-X62N9DWR3J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 COMPLETE FRESH START CLEANUP');
console.log('⚠️  WARNING: This will DELETE ALL templates and images!');
console.log('📁 This action cannot be undone!\n');

async function completeCleanup() {
  const startTime = Date.now();
  
  try {
    console.log('🗑️  Starting complete cleanup...\n');

    // 1. Delete all Firestore templates
    console.log('🔥 STEP 1: Clearing Firestore templates...');
    let snapshot = null;
    let deletedCount = 0;
    try {
      const templatesRef = collection(db, 'templates');
      snapshot = await getDocs(templatesRef);
      
      console.log(`📊 Found ${snapshot.docs.length} templates in Firestore`);
      
      const deletePromises = snapshot.docs.map(templateDoc => 
        deleteDoc(doc(db, 'templates', templateDoc.id))
      );
      
      await Promise.all(deletePromises);
      deletedCount = snapshot.docs.length;
      console.log(`✅ Deleted ${deletedCount} templates from Firestore\n`);
    } catch (firestoreError) {
      console.log('⚠️  Firestore cleanup failed (might be empty):', firestoreError.message);
    }

    // 2. Delete all local JSON template files
    console.log('📁 STEP 2: Clearing local JSON template files...');
    const templateJsonFiles = [
      'public/templates/templates.json',
      'public/templates/templates_with_previews.json', 
      'public/templates/templates_shorts_full.json',
      'app/templates_with_previews.json'
    ];

    for (const jsonFile of templateJsonFiles) {
      if (fs.existsSync(jsonFile)) {
        // Create empty array instead of deleting file
        fs.writeFileSync(jsonFile, '[]', 'utf8');
        console.log(`🗑️  Cleared: ${jsonFile}`);
      }
    }

    // 3. Delete all backup files
    console.log('\n📦 STEP 3: Removing backup files...');
    const backupPatterns = [
      'public/templates/*backup*.json',
      'public/templates/templates (*).json',
      'public/templates/templatesBackup/',
      'scripts/*backup*.json',
      'scripts/*analysis*.json'
    ];

    const globSync = require('glob').globSync;
    for (const pattern of backupPatterns) {
      try {
        const files = globSync(pattern);
        for (const file of files) {
          if (fs.existsSync(file)) {
            if (fs.lstatSync(file).isDirectory()) {
              fs.rmSync(file, { recursive: true, force: true });
              console.log(`🗂️  Removed directory: ${file}`);
            } else {
              fs.unlinkSync(file);
              console.log(`🗑️  Removed file: ${file}`);
            }
          }
        }
      } catch (error) {
        console.log(`⚠️  Pattern ${pattern}:`, error.message);
      }
    }

    // 4. Delete all image directories
    console.log('\n🖼️  STEP 4: Removing all image directories...');
    const imageDirs = [
      'public/images/youtube/',
      'public/images/video-previews/',
      'public/templates/envato-assets/images/',
      'public/templates/envato-assets/graphics/',
      'public/templates/envato-premium/instagram-premium/',
      'public/templates/envato-premium/tiktok-premium/',
      'public/templates/envato-premium/youtube-premium/',
      'public/templates/stock-assets/downloaded-assets/',
      'public/templates/stock-assets/general-stock/',
      'public/templates/stock-assets/instagram-content/',
      'public/templates/stock-assets/tiktok-content/',
      'public/templates/stock-assets/youtube-content/'
    ];

    for (const dir of imageDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗂️  Removed: ${dir}`);
        
        // Recreate empty directory structure
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Recreated empty: ${dir}`);
      }
    }

    // 5. Delete all video directories except core ones
    console.log('\n🎥 STEP 5: Clearing video directories...');
    const videoDirs = [
      'public/templates/processed-videos/',
      'public/templates/envato-assets/videos/',
      'public/templates/envato-assets/tiktok-videos/',
      'public/templates/stock-assets/tiktok-videos/'
    ];

    for (const dir of videoDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`🗂️  Removed: ${dir}`);
        
        // Recreate empty directory
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Recreated empty: ${dir}`);
      }
    }

    // 6. Keep only essential video files in public/videos/youtube/
    console.log('\n🎬 STEP 6: Cleaning core video directory...');
    const youtubeVideosDir = 'public/videos/youtube/';
    if (fs.existsSync(youtubeVideosDir)) {
      const files = fs.readdirSync(youtubeVideosDir);
      for (const file of files) {
        const filePath = path.join(youtubeVideosDir, file);
        // Keep only tutorial help file
        if (!file.includes('Tutorial') && !file.includes('Help')) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed: ${filePath}`);
        }
      }
    }

    // 7. Clear download tracking and session files
    console.log('\n📊 STEP 7: Clearing tracking and session files...');
    const trackingFiles = [
      'public/templates/envato-assets/download-tracking.json',
      'public/templates/envato-premium/SESSION_TRACKER.md'
    ];

    for (const file of trackingFiles) {
      if (fs.existsSync(file)) {
        if (file.endsWith('.json')) {
          fs.writeFileSync(file, '{}', 'utf8');
        } else {
          fs.writeFileSync(file, '# Session Tracker - Reset\n\nStarted fresh: ' + new Date().toISOString(), 'utf8');
        }
        console.log(`🔄 Reset: ${file}`);
      }
    }

    // 8. Create fresh starter template structure
    console.log('\n🆕 STEP 8: Creating fresh starter structure...');
    
    // Create a minimal starter template for testing
    const starterTemplate = {
      id: "starter-template-001",
      title: "Starter Template",
      desc: "Clean slate - ready for new high-quality templates",
      category: "Getting Started",
      platform: "ViewsBoost",
      preview: "/default-template.png",
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isActive: true,
      usageScore: 0
    };

    // Write starter template to main files
    fs.writeFileSync('public/templates/templates.json', JSON.stringify([starterTemplate], null, 2));
    fs.writeFileSync('public/templates/templates_with_previews.json', JSON.stringify([starterTemplate], null, 2));
    console.log('📄 Created starter template files');

    // 9. Create clean directory structure guide
    const cleanupReport = {
      timestamp: new Date().toISOString(),
      action: "Complete Fresh Start",
      deletedFromFirestore: deletedCount,
      clearedDirectories: imageDirs.length + videoDirs.length,
      resetFiles: templateJsonFiles.length + trackingFiles.length,
      status: "Ready for fresh high-quality template imports",
      nextSteps: [
        "1. Use Template Category Manager to import new templates",
        "2. Download high-quality assets using new download system", 
        "3. Organize templates by category using drag-and-drop",
        "4. Use Sync to Storage to persist changes"
      ]
    };

    fs.writeFileSync('cleanup-fresh-start-report.json', JSON.stringify(cleanupReport, null, 2));

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPLETE FRESH START CLEANUP FINISHED!');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`🗑️  Cleared ${deletedCount} Firestore templates`);
    console.log(`📁 Reset ${imageDirs.length + videoDirs.length} directories`);
    console.log(`📄 Cleaned ${templateJsonFiles.length} JSON files`);
    console.log('');
    console.log('🚀 SYSTEM IS NOW COMPLETELY CLEAN!');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. npm run dev - Start development server');
    console.log('2. Open admin panel → Template Category Manager');
    console.log('3. Use new high-quality download system');
    console.log('4. Import and organize fresh templates');
    console.log('5. Use Sync to Storage for persistence');
    console.log('');
    console.log('📊 Report saved: cleanup-fresh-start-report.json');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.log('\n⚠️  Some manual cleanup may be required');
  }
}

// Execute cleanup
completeCleanup().then(() => {
  console.log('\n✅ Fresh start cleanup completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Critical error during cleanup:', error);
  process.exit(1);
}); 