const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp
} = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAZMLJsIQHdcDwRSMshfhJx7FJw0vZ3eNY",
  authDomain: "viewsboostv2.firebaseapp.com",
  projectId: "viewsboostv2",
  storageBucket: "viewsboostv2.appspot.com",
  messagingSenderId: "664499235946",
  appId: "1:664499235946:web:e0f1b4d8d0f3a8b5e9f1b4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testTemplateDeletion() {
  console.log('🧪 Testing template deletion functionality...');
  
  try {
    // 1. First, check current templates
    console.log('\n📊 Step 1: Checking current templates...');
    const templatesRef = collection(db, 'templates');
    const initialSnapshot = await getDocs(templatesRef);
    console.log(`Found ${initialSnapshot.size} templates initially`);
    
    // 2. Create a test template
    console.log('\n📝 Step 2: Creating test template...');
    const testTemplate = {
      title: 'Test Template for Deletion',
      category: 'Test Category',
      desc: 'This is a test template that will be deleted',
      icon: '🧪',
      preview: '/default-template.png',
      platform: 'Test Platform',
      quality: 'Test Quality',
      tags: ['test', 'deletion'],
      useVideoPreview: false,
      createdAt: serverTimestamp(),
      createdBy: 'test-script',
      lastModified: serverTimestamp(),
      modifiedBy: 'test-script'
    };
    
    const testDocRef = await addDoc(templatesRef, testTemplate);
    console.log(`✅ Created test template with ID: ${testDocRef.id}`);
    
    // 3. Verify the template was created
    console.log('\n🔍 Step 3: Verifying template creation...');
    const afterCreateSnapshot = await getDocs(templatesRef);
    console.log(`Templates after creation: ${afterCreateSnapshot.size} (should be ${initialSnapshot.size + 1})`);
    
    if (afterCreateSnapshot.size !== initialSnapshot.size + 1) {
      throw new Error('Template creation verification failed');
    }
    
    // 4. Delete the test template
    console.log('\n🗑️ Step 4: Deleting test template...');
    const testTemplateDoc = doc(db, 'templates', testDocRef.id);
    await deleteDoc(testTemplateDoc);
    console.log(`✅ Deleted test template with ID: ${testDocRef.id}`);
    
    // 5. Verify the template was deleted
    console.log('\n🔍 Step 5: Verifying template deletion...');
    const afterDeleteSnapshot = await getDocs(templatesRef);
    console.log(`Templates after deletion: ${afterDeleteSnapshot.size} (should be ${initialSnapshot.size})`);
    
    if (afterDeleteSnapshot.size !== initialSnapshot.size) {
      throw new Error('Template deletion verification failed');
    }
    
    console.log('\n✅ Template deletion test PASSED!');
    console.log('🎉 The deletion functionality is working correctly with Firebase.');
    
    // 6. Show current template count by category for reference
    console.log('\n📊 Current template distribution:');
    const categoryCount = {};
    afterDeleteSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      const category = data.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count} templates`);
    });
    
  } catch (error) {
    console.error('❌ Template deletion test FAILED:', error);
    throw error;
  }
}

// Run the test
testTemplateDeletion().then(() => {
  console.log('\n🎯 Template deletion functionality verified successfully!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Template deletion test failed:', error);
  process.exit(1);
}); 