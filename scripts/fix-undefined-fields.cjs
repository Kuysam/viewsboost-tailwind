const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  deleteField,
  writeBatch
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

async function fixUndefinedFields() {
  console.log('🔍 Scanning Firestore templates for undefined fields...');
  
  try {
    const templatesRef = collection(db, 'templates');
    const snapshot = await getDocs(templatesRef);
    
    console.log(`📊 Total templates found: ${snapshot.size}`);
    
    const problematicTemplates = [];
    const fixOperations = [];
    
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const issues = [];
      
      // Check for undefined values in critical fields
      const criticalFields = [
        'videoSource', 'preview', 'platform', 'quality', 
        'tags', 'useVideoPreview', 'description', 'desc'
      ];
      
      criticalFields.forEach(field => {
        if (data[field] === undefined) {
          issues.push(`${field}: undefined`);
        }
      });
      
      // Check for empty strings that should be cleaned up
      Object.keys(data).forEach(key => {
        if (data[key] === '' && key !== 'desc' && key !== 'title') {
          issues.push(`${key}: empty string`);
        }
      });
      
      if (issues.length > 0) {
        problematicTemplates.push({
          id,
          title: data.title || 'Untitled',
          category: data.category || 'Unknown',
          issues
        });
        
        // Prepare fix operations
        const updateData = {};
        const fieldsToDelete = [];
        
        criticalFields.forEach(field => {
          if (data[field] === undefined) {
            fieldsToDelete.push(field);
          }
        });
        
        // Fix empty strings in non-essential fields
        Object.keys(data).forEach(key => {
          if (data[key] === '' && key !== 'desc' && key !== 'title') {
            fieldsToDelete.push(key);
          }
        });
        
        if (fieldsToDelete.length > 0) {
          fixOperations.push({
            id,
            fieldsToDelete,
            updateData
          });
        }
      }
    });
    
    console.log(`\n⚠️ Found ${problematicTemplates.length} templates with issues:`);
    problematicTemplates.forEach(template => {
      console.log(`  - ${template.title} (${template.category}): ${template.issues.join(', ')}`);
    });
    
    if (fixOperations.length > 0) {
      console.log(`\n🔧 Preparing to fix ${fixOperations.length} templates...`);
      
      // Use batch operations for efficiency
      const batch = writeBatch(db);
      let batchCount = 0;
      
      for (const operation of fixOperations) {
        const templateRef = doc(db, 'templates', operation.id);
        
        // Create update object with deleteField() for undefined fields
        const updateData = { ...operation.updateData };
        operation.fieldsToDelete.forEach(field => {
          updateData[field] = deleteField();
        });
        
        batch.update(templateRef, updateData);
        batchCount++;
        
        // Firestore batch limit is 500 operations
        if (batchCount >= 450) {
          console.log('💾 Committing batch...');
          await batch.commit();
          batchCount = 0;
        }
      }
      
      // Commit remaining operations
      if (batchCount > 0) {
        console.log('💾 Committing final batch...');
        await batch.commit();
      }
      
      console.log(`✅ Successfully fixed ${fixOperations.length} templates`);
    } else {
      console.log('✅ No templates need fixing');
    }
    
    // Final verification
    console.log('\n🔍 Running final verification...');
    const verificationSnapshot = await getDocs(templatesRef);
    let cleanCount = 0;
    
    verificationSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      let hasUndefined = false;
      
      Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
          hasUndefined = true;
        }
      });
      
      if (!hasUndefined) {
        cleanCount++;
      }
    });
    
    console.log(`📊 Verification complete: ${cleanCount}/${verificationSnapshot.size} templates are clean`);
    
  } catch (error) {
    console.error('❌ Error fixing undefined fields:', error);
  }
}

// Run the fix
fixUndefinedFields().then(() => {
  console.log('🎉 Fix operation completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix operation failed:', error);
  process.exit(1);
}); 