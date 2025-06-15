import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateVideoTypes() {
  console.log('🔄 Starting video type update...');
  
  const videosRef = collection(db, 'videos');
  const snapshot = await getDocs(videosRef);
  
  console.log(`📊 Found ${snapshot.size} videos to process`);
  
  const batch = writeBatch(db);
  let batchCount = 0;
  let totalBatches = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const duration = data.duration || 0;
    
    // Determine type based on duration (4 minutes = 240 seconds)
    const type = duration <= 240 ? 'short' : 'video';
    
    // Use existing youtubeId or fallback to document ID
    const youtubeId = data.youtubeId || doc.id;
    
    // Only update if type or youtubeId needs to change
    if (data.type !== type || data.youtubeId !== youtubeId) {
      batch.update(doc.ref, {
        type,
        youtubeId,
      });
      
      batchCount++;
      
      // Firestore batches are limited to 500 operations
      if (batchCount === 500) {
        await batch.commit();
        totalBatches++;
        console.log(`✅ Committed batch ${totalBatches}`);
        batchCount = 0;
      }
    }
  }
  
  // Commit any remaining updates
  if (batchCount > 0) {
    await batch.commit();
    totalBatches++;
    console.log(`✅ Committed final batch ${totalBatches}`);
  }
  
  console.log('🎉 Update complete!');
}

// Run the update
updateVideoTypes().catch(console.error); 