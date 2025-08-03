const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');
const { getStorage, ref, listAll, getDownloadURL, getMetadata } = require('firebase/storage');

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
const storage = getStorage(app);

// Helper functions
function formatFileName(name) {
  return name
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[_\-]/g, ' ') // Replace underscores and hyphens with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

function guessCategoryFromFilename(filename) {
  const name = filename.toLowerCase();
  
  const patterns = {
    'TikTok Video': ['tiktok', 'tt', 'short', 'vertical'],
    'Instagram Reel': ['reel', 'ig', 'insta', 'instagram'],
    'YouTube Video': ['youtube', 'yt', 'horizontal', 'landscape'],
    'YouTube Shorts': ['youtubeshorts', 'ytshorts', 'shorts'],
    'Facebook Video': ['facebook', 'fb'],
    'LinkedIn Video': ['linkedin', 'ln'],
    'Business': ['business', 'corporate', 'professional'],
    'Marketing': ['marketing', 'promo', 'promotional', 'ad'],
    'Tutorial': ['tutorial', 'howto', 'guide', 'demo'],
    'Gaming': ['gaming', 'game', 'gameplay', 'stream'],
    'Lifestyle': ['lifestyle', 'vlog', 'daily', 'life'],
    'Music': ['music', 'song', 'audio', 'sound'],
    'Tech': ['tech', 'technology', 'review', 'unbox'],
    'Sports': ['sports', 'fitness', 'workout', 'exercise'],
    'Food': ['food', 'cooking', 'recipe', 'kitchen'],
    'Travel': ['travel', 'vacation', 'trip', 'adventure']
  };
  
  for (const [category, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  return 'TikTok Video'; // Default for your videos
}

function getCategoryIcon(category) {
  const icons = {
    'TikTok Video': '🎵',
    'Instagram Reel': '📸',
    'YouTube Video': '📺',
    'YouTube Shorts': '🎬',
    'Facebook Video': '👥',
    'LinkedIn Video': '💼',
    'Business': '🏢',
    'Marketing': '📈',
    'Tutorial': '🎓',
    'Gaming': '🎮',
    'Lifestyle': '✨',
    'Music': '🎵',
    'Tech': '💻',
    'Sports': '⚽',
    'Food': '🍳',
    'Travel': '✈️'
  };
  
  return icons[category] || '🎥';
}

function guessPlatform(category) {
  const platforms = {
    'TikTok Video': 'TikTok',
    'Instagram Reel': 'Instagram',
    'YouTube Video': 'YouTube',
    'YouTube Shorts': 'YouTube',
    'Facebook Video': 'Facebook',
    'LinkedIn Video': 'LinkedIn'
  };
  
  return platforms[category] || 'Multi-Platform';
}

async function getStorageVideos() {
  try {
    console.log('🔍 Scanning Firebase Storage for videos...');
    
    const directories = ['Templates', 'Templates/Video', 'videos'];
    const videoFiles = [];
    
    for (const directory of directories) {
      try {
        const dirRef = ref(storage, directory);
        const listResult = await listAll(dirRef);
        
        console.log(`📁 Found ${listResult.items.length} files in ${directory}/`);
        
        for (const itemRef of listResult.items) {
          try {
            const [downloadURL, metadata] = await Promise.all([
              getDownloadURL(itemRef),
              getMetadata(itemRef)
            ]);
            
            if (metadata.contentType?.startsWith('video/')) {
              videoFiles.push({
                name: itemRef.name,
                fullPath: itemRef.fullPath,
                downloadURL,
                size: metadata.size,
                timeCreated: metadata.timeCreated,
                updated: metadata.updated,
                contentType: metadata.contentType
              });
              console.log(`  📹 Found video: ${itemRef.name}`);
            }
          } catch (error) {
            console.warn(`  ⚠️ Could not process ${itemRef.name}:`, error.message);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not access ${directory}/:`, error.message);
      }
    }
    
    return videoFiles;
  } catch (error) {
    console.error('❌ Error scanning storage:', error);
    return [];
  }
}

async function getExistingTemplates() {
  try {
    const snapshot = await getDocs(collection(db, 'templates'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error getting existing templates:', error);
    return [];
  }
}

async function createTemplatesFromVideos() {
  try {
    console.log('🚀 Starting template creation from Firebase Storage videos...\n');
    
    // Get videos and existing templates
    const [videos, existingTemplates] = await Promise.all([
      getStorageVideos(),
      getExistingTemplates()
    ]);
    
    console.log(`📹 Found ${videos.length} videos in Firebase Storage`);
    console.log(`📋 Found ${existingTemplates.length} existing templates in Firestore\n`);
    
    if (videos.length === 0) {
      console.log('❌ No videos found in Firebase Storage. Please upload videos first.');
      return;
    }
    
    // Check which videos already have templates
    const existingVideoUrls = new Set(
      existingTemplates
        .filter(t => t.videoSource)
        .map(t => t.videoSource)
    );
    
    const newVideos = videos.filter(video => !existingVideoUrls.has(video.downloadURL));
    
    console.log(`🆕 ${newVideos.length} videos need new templates`);
    console.log(`✅ ${videos.length - newVideos.length} videos already have templates\n`);
    
    if (newVideos.length === 0) {
      console.log('✅ All videos already have templates! No new templates needed.');
      return;
    }
    
    // Create templates for new videos
    let created = 0;
    let errors = 0;
    
    for (const video of newVideos) {
      try {
        const nameWithoutExt = video.name.replace(/\.[^/.]+$/, '');
        const category = guessCategoryFromFilename(video.name);
        
        const template = {
          title: formatFileName(nameWithoutExt),
          category: category,
          desc: `Professional ${category.toLowerCase()} template created from ${video.name}. Perfect for social media content creation.`,
          icon: getCategoryIcon(category),
          preview: video.downloadURL,
          videoSource: video.downloadURL,
          platform: guessPlatform(category),
          quality: 'HD',
          tags: ['auto-generated', 'uploaded', category.toLowerCase(), 'firebase-storage'],
          useVideoPreview: true,
          createdAt: new Date().toISOString(),
          source: 'Firebase Storage Auto-Generated',
          originalFilename: video.name,
          autoGenerated: true,
          storageMetadata: {
            size: video.size,
            contentType: video.contentType,
            timeCreated: video.timeCreated,
            fullPath: video.fullPath
          }
        };
        
        const docRef = await addDoc(collection(db, 'templates'), template);
        
        console.log(`✅ Created template: "${template.title}" (ID: ${docRef.id})`);
        console.log(`   Video: ${video.name}`);
        console.log(`   Category: ${category}`);
        console.log(`   URL: ${video.downloadURL.substring(0, 50)}...`);
        console.log('');
        
        created++;
      } catch (error) {
        console.error(`❌ Failed to create template for ${video.name}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n🎉 Template creation complete!`);
    console.log(`   ✅ Created: ${created} templates`);
    console.log(`   ❌ Errors: ${errors} templates`);
    console.log(`   📋 Total templates now: ${existingTemplates.length + created}`);
    
    if (created > 0) {
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Go to your ViewsBoost app`);
      console.log(`   2. Navigate to any template category`);
      console.log(`   3. Look for templates with 🔥 FIREBASE badges`);
      console.log(`   4. These templates will now use Firebase Storage videos!`);
    }
    
  } catch (error) {
    console.error('❌ Error creating templates:', error);
  }
}

// Run the script
createTemplatesFromVideos(); 