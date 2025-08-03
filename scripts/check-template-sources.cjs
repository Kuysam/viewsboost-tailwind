const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDUYmZZJHOPJJCEVxlKJXUJRNYdkjjzjgc",
  authDomain: "viewsboost-c3e8a.firebaseapp.com",
  projectId: "viewsboost-c3e8a",
  storageBucket: "viewsboost-c3e8a.appspot.com",
  messagingSenderId: "1085527619831",
  appId: "1:1085527619831:web:f4c0b5a1a4a8d7e8c5e8a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTemplateVideoSources() {
  try {
    console.log('🔍 Checking template video sources in Firestore...\n');
    
    const templatesSnapshot = await getDocs(collection(db, 'templates'));
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📋 Found ${templates.length} templates total\n`);
    
    // Analyze video sources
    const videoSourceAnalysis = {
      withVideoSource: 0,
      withFirebaseStorage: 0,
      withLocalVideos: 0,
      withBlobUrls: 0,
      withOtherUrls: 0,
      withoutVideoSource: 0
    };
    
    const firebaseStorageTemplates = [];
    const localVideoTemplates = [];
    const blobUrlTemplates = [];
    const otherUrlTemplates = [];
    
    templates.forEach(template => {
      if (template.videoSource) {
        videoSourceAnalysis.withVideoSource++;
        
        if (template.videoSource.includes('firebase') || template.videoSource.includes('storage.googleapis.com')) {
          videoSourceAnalysis.withFirebaseStorage++;
          firebaseStorageTemplates.push({
            id: template.id,
            title: template.title,
            category: template.category,
            videoSource: template.videoSource,
            preview: template.preview
          });
        } else if (template.videoSource.startsWith('/videos/')) {
          videoSourceAnalysis.withLocalVideos++;
          localVideoTemplates.push({
            id: template.id,
            title: template.title,
            category: template.category,
            videoSource: template.videoSource
          });
        } else if (template.videoSource.startsWith('blob:')) {
          videoSourceAnalysis.withBlobUrls++;
          blobUrlTemplates.push({
            id: template.id,
            title: template.title,
            category: template.category,
            videoSource: template.videoSource
          });
        } else {
          videoSourceAnalysis.withOtherUrls++;
          otherUrlTemplates.push({
            id: template.id,
            title: template.title,
            category: template.category,
            videoSource: template.videoSource
          });
        }
      } else {
        videoSourceAnalysis.withoutVideoSource++;
      }
    });
    
    // Print analysis
    console.log('📊 VIDEO SOURCE ANALYSIS:');
    console.log(`   Total templates: ${templates.length}`);
    console.log(`   With videoSource: ${videoSourceAnalysis.withVideoSource}`);
    console.log(`   With Firebase Storage URLs: ${videoSourceAnalysis.withFirebaseStorage}`);
    console.log(`   With local video paths: ${videoSourceAnalysis.withLocalVideos}`);
    console.log(`   With blob URLs: ${videoSourceAnalysis.withBlobUrls}`);
    console.log(`   With other URLs: ${videoSourceAnalysis.withOtherUrls}`);
    console.log(`   Without videoSource: ${videoSourceAnalysis.withoutVideoSource}\n`);
    
    // Show Firebase Storage templates
    if (firebaseStorageTemplates.length > 0) {
      console.log('🔥 FIREBASE STORAGE TEMPLATES:');
      firebaseStorageTemplates.forEach(template => {
        console.log(`   ${template.title} (${template.category})`);
        console.log(`     Video: ${template.videoSource}`);
        console.log(`     Preview: ${template.preview}`);
        console.log('');
      });
    }
    
    // Show local video templates
    if (localVideoTemplates.length > 0) {
      console.log('📁 LOCAL VIDEO TEMPLATES:');
      localVideoTemplates.forEach(template => {
        console.log(`   ${template.title} (${template.category})`);
        console.log(`     Video: ${template.videoSource}`);
        console.log('');
      });
    }
    
    // Show blob URL templates
    if (blobUrlTemplates.length > 0) {
      console.log('🔗 BLOB URL TEMPLATES:');
      blobUrlTemplates.forEach(template => {
        console.log(`   ${template.title} (${template.category})`);
        console.log(`     Video: ${template.videoSource.substring(0, 50)}...`);
        console.log('');
      });
    }
    
    // Show other URL templates
    if (otherUrlTemplates.length > 0) {
      console.log('🌐 OTHER URL TEMPLATES:');
      otherUrlTemplates.forEach(template => {
        console.log(`   ${template.title} (${template.category})`);
        console.log(`     Video: ${template.videoSource}`);
        console.log('');
      });
    }
    
    // Show categories
    const categories = [...new Set(templates.map(t => t.category))].sort();
    console.log(`📂 CATEGORIES (${categories.length} total):`);
    categories.forEach(category => {
      const count = templates.filter(t => t.category === category).length;
      console.log(`   ${category}: ${count} templates`);
    });
    
  } catch (error) {
    console.error('❌ Error checking templates:', error);
  }
}

checkTemplateVideoSources(); 