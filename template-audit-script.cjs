// Template Audit Script - Check current Firestore templates
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin (you'll need to update the service account path)
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'viewsboostv2.firebasestorage.app'
});

const db = admin.firestore();

async function auditTemplates() {
  console.log('🔍 Starting template audit...');
  
  try {
    // Get all templates from Firestore
    const templatesSnapshot = await db.collection('templates').get();
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📊 Found ${templates.length} templates in Firestore`);

    // Analyze template structure
    const analysis = {
      total: templates.length,
      withVideoSource: templates.filter(t => t.videoSource).length,
      withImageUrl: templates.filter(t => t.imageUrl).length,
      withPreview: templates.filter(t => t.preview).length,
      categories: [...new Set(templates.map(t => t.category))].sort(),
      sampleTemplates: templates.slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        hasVideoSource: !!t.videoSource,
        hasImageUrl: !!t.imageUrl,
        hasPreview: !!t.preview,
        videoSource: t.videoSource?.substring(0, 100),
        imageUrl: t.imageUrl?.substring(0, 100),
        preview: t.preview?.substring(0, 100)
      }))
    };

    // Save analysis to file
    fs.writeFileSync('template-audit-report.json', JSON.stringify(analysis, null, 2));
    
    console.log('✅ Audit complete! Results saved to template-audit-report.json');
    console.log('\n📈 QUICK STATS:');
    console.log(`Total templates: ${analysis.total}`);
    console.log(`With video sources: ${analysis.withVideoSource}`);
    console.log(`With image URLs: ${analysis.withImageUrl}`);
    console.log(`With previews: ${analysis.withPreview}`);
    console.log(`Categories: ${analysis.categories.length}`);
    
    console.log('\n🏷️ CATEGORIES FOUND:');
    analysis.categories.forEach(cat => console.log(`- ${cat}`));

    return analysis;
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

auditTemplates().then(() => {
  console.log('\n✨ Run this script to see your current template structure!');
  process.exit(0);
});