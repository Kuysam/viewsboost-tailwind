// Template Validation Script - Test URLs and clean up
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'viewsboostv2.firebasestorage.app'
});

const db = admin.firestore();

async function testUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function validateTemplates() {
  console.log('🧪 Starting template validation...');
  
  try {
    const templatesSnapshot = await db.collection('templates').get();
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ref: doc.ref,
      ...doc.data()
    }));

    console.log(`📊 Validating ${templates.length} templates...`);

    const results = {
      total: templates.length,
      working: 0,
      broken: 0,
      brokenTemplates: []
    };
    
    for (const template of templates) {
      console.log(`🔍 Testing: ${template.title}`);
      
      let hasWorkingUrl = false;
      
      // Test video source
      if (template.videoSource) {
        const videoWorks = await testUrl(template.videoSource);
        if (videoWorks) {
          hasWorkingUrl = true;
          console.log(`✅ Video works: ${template.title}`);
        } else {
          console.log(`❌ Video broken: ${template.title}`);
        }
      }
      
      // Test image URL
      if (template.imageUrl && !hasWorkingUrl) {
        const imageWorks = await testUrl(template.imageUrl);
        if (imageWorks) {
          hasWorkingUrl = true;
          console.log(`✅ Image works: ${template.title}`);
        } else {
          console.log(`❌ Image broken: ${template.title}`);
        }
      }
      
      // Test preview URL
      if (template.preview && !hasWorkingUrl) {
        const previewWorks = await testUrl(template.preview);
        if (previewWorks) {
          hasWorkingUrl = true;
          console.log(`✅ Preview works: ${template.title}`);
        } else {
          console.log(`❌ Preview broken: ${template.title}`);
        }
      }
      
      if (hasWorkingUrl) {
        results.working++;
      } else {
        results.broken++;
        results.brokenTemplates.push({
          id: template.id,
          title: template.title,
          category: template.category,
          videoSource: template.videoSource,
          imageUrl: template.imageUrl,
          preview: template.preview
        });
      }
    }
    
    console.log('\n📈 VALIDATION RESULTS:');
    console.log(`✅ Working templates: ${results.working}`);
    console.log(`❌ Broken templates: ${results.broken}`);
    console.log(`📊 Success rate: ${((results.working / results.total) * 100).toFixed(1)}%`);
    
    if (results.brokenTemplates.length > 0) {
      console.log('\n❌ BROKEN TEMPLATES:');
      results.brokenTemplates.forEach(t => {
        console.log(`- ${t.title} (${t.category})`);
      });
    }
    
    // Save results
    require('fs').writeFileSync('template-validation-report.json', JSON.stringify(results, null, 2));
    console.log('\n✅ Results saved to template-validation-report.json');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

validateTemplates().then(() => {
  process.exit(0);
});