// Quick Template Check - Run this in browser console on localhost:5174
// This will check what video sources your templates actually have

async function quickTemplateCheck() {
  try {
    console.log('🔍 Checking template video sources...');
    
    // This assumes you're on the ViewsBoost app page where Firebase is already initialized
    if (typeof window !== 'undefined' && window.firebase) {
      const db = window.firebase.firestore();
      const snapshot = await db.collection('templates').get();
      const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log(`📋 Found ${templates.length} templates total`);
      
      const analysis = {
        total: templates.length,
        withVideoSource: 0,
        firebaseStorage: 0,
        localVideos: 0,
        blobUrls: 0,
        otherUrls: 0,
        noVideoSource: 0
      };
      
      const firebaseTemplates = [];
      const localTemplates = [];
      
      templates.forEach(template => {
        if (template.videoSource) {
          analysis.withVideoSource++;
          if (template.videoSource.includes('firebase') || template.videoSource.includes('storage.googleapis.com')) {
            analysis.firebaseStorage++;
            firebaseTemplates.push(template);
          } else if (template.videoSource.startsWith('/videos/')) {
            analysis.localVideos++;
            localTemplates.push(template);
          } else if (template.videoSource.startsWith('blob:')) {
            analysis.blobUrls++;
          } else {
            analysis.otherUrls++;
          }
        } else {
          analysis.noVideoSource++;
        }
      });
      
      console.log('📊 VIDEO SOURCE ANALYSIS:');
      console.log(`   Total templates: ${analysis.total}`);
      console.log(`   With videoSource: ${analysis.withVideoSource}`);
      console.log(`   🔥 Firebase Storage URLs: ${analysis.firebaseStorage}`);
      console.log(`   📁 Local video paths: ${analysis.localVideos}`);
      console.log(`   🔗 Blob URLs: ${analysis.blobUrls}`);
      console.log(`   🌐 Other URLs: ${analysis.otherUrls}`);
      console.log(`   ❌ No videoSource: ${analysis.noVideoSource}`);
      
      if (firebaseTemplates.length > 0) {
        console.log('\n🔥 FIREBASE STORAGE TEMPLATES:');
        firebaseTemplates.forEach(template => {
          console.log(`   "${template.title}" (${template.category})`);
          console.log(`     Video: ${template.videoSource}`);
        });
      }
      
      if (localTemplates.length > 0) {
        console.log('\n📁 LOCAL VIDEO TEMPLATES (first 5):');
        localTemplates.slice(0, 5).forEach(template => {
          console.log(`   "${template.title}" (${template.category})`);
          console.log(`     Video: ${template.videoSource}`);
        });
      }
      
      return analysis;
    } else {
      console.error('❌ Firebase not found. Make sure you\'re on the ViewsBoost app page.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking templates:', error);
    return null;
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🚀 Quick Template Check loaded. Run quickTemplateCheck() to analyze your templates.');
}

// Export for module use
if (typeof module !== 'undefined') {
  module.exports = { quickTemplateCheck };
} 