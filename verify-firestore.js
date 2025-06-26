// Firestore Verification Script
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config (same as your project)
const firebaseConfig = {
  apiKey: "AIzaSyAZMLJsIQHdcDwRSMshfhJx7FJw0vZ3eNY",
  authDomain: "viewsboostv2.firebaseapp.com",
  projectId: "viewsboostv2",
  storageBucket: "viewsboostv2.appspot.com",
  messagingSenderId: "664499235946",
  appId: "1:664499235946:web:e0f1b4d8d0f3a8b5e9f1b4",
  measurementId: "G-XXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyFirestore() {
  console.log('🔍 Checking Firestore templates collection...');
  
  try {
    const templatesRef = collection(db, 'templates');
    const snapshot = await getDocs(templatesRef);
    
    console.log(`📊 Total documents in templates collection: ${snapshot.size}`);
    
    if (snapshot.empty) {
      console.log('❌ No templates found in Firestore');
      return;
    }
    
    const templates = [];
    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      templates.push(data);
      console.log(`✅ Template: "${data.title}" - Category: "${data.category}" - Platform: "${data.platform}"`);
    });
    
    // Count by category
    const categoryCount = {};
    templates.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });
    
    console.log('\n📋 Templates by category:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} templates`);
    });
    
    // Check for YouTube Video specifically
    const youtubeTemplates = templates.filter(t => t.category === 'YouTube Video');
    console.log(`\n🎬 YouTube Video templates: ${youtubeTemplates.length}`);
    youtubeTemplates.forEach(t => {
      console.log(`  - ${t.title} (ID: ${t.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking Firestore:', error);
  }
}

verifyFirestore(); 