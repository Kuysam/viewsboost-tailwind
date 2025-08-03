# 1. Remove the old file
rm scripts/setup-cors.js

# 2. Create the corrected file
cat > scripts/setup-cors.cjs << 'EOF'
#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 ViewsBoost - Automated CORS Setup for Template Thumbnails');
console.log('========================================================\n');

// Your CORRECT Firebase project details
const PROJECT_ID = 'viewsboostv2';
const BUCKET_NAME = 'viewsboostv2.firebasestorage.app';

const corsConfig = [
  {
    "origin": ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    "method": ["GET", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers"],
    "maxAgeSeconds": 3600
  }
];

function checkGsutil() {
  return new Promise((resolve) => {
    console.log('🔍 Checking if Google Cloud tools are installed...');
    exec('gsutil version', (error, stdout) => {
      if (error) {
        console.log('❌ gsutil not found');
        resolve(false);
      } else {
        console.log('✅ gsutil found:', stdout.split('\n')[0]);
        resolve(true);
      }
    });
  });
}

function checkAuth() {
  return new Promise((resolve) => {
    console.log('🔐 Checking Google Cloud authentication...');
    exec('gcloud auth list --filter=status:ACTIVE --format="value(account)"', (error, stdout) => {
      if (error || !stdout.trim()) {
        console.log('❌ Not authenticated with Google Cloud');
        console.log('🔑 Please run: gcloud auth login');
        resolve(false);
      } else {
        console.log('✅ Authenticated as:', stdout.trim());
        resolve(true);
      }
    });
  });
}

function applyCORS() {
  return new Promise((resolve) => {
    console.log('⚙️ Applying CORS configuration to Firebase Storage...');
    console.log('🪣 Bucket:', BUCKET_NAME);
    
    const corsFile = path.join(__dirname, '..', 'cors.json');
    
    if (!fs.existsSync(corsFile)) {
      console.log('📝 Creating CORS configuration file...');
      fs.writeFileSync(corsFile, JSON.stringify(corsConfig, null, 2));
    }
    
    const command = `gsutil cors set "${corsFile}" gs://${BUCKET_NAME}`;
    console.log('📋 Running:', command);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ CORS setup failed:');
        console.log(error.message);
        if (stderr) console.log('Error details:', stderr);
        
        console.log('\n🔧 Manual fix options:');
        console.log('1. Try: gcloud auth application-default login');
        console.log('2. Manual command: gsutil cors set cors.json gs://' + BUCKET_NAME);
        resolve(false);
      } else {
        console.log('✅ CORS configuration applied successfully!');
        if (stdout) console.log(stdout);
        resolve(true);
      }
    });
  });
}

async function main() {
  try {
    console.log('🎯 Goal: Fix template thumbnails in CanvaEditor\n');
    console.log('📊 Project:', PROJECT_ID);
    console.log('🪣 Storage Bucket:', BUCKET_NAME);
    console.log('');
    
    const hasGsutil = await checkGsutil();
    if (!hasGsutil) {
      console.log('\n❌ gsutil not found. Try restarting terminal.');
      return;
    }
    
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      console.log('\n❌ Please authenticate first: gcloud auth login');
      console.log('Then run this script again.');
      return;
    }
    
    const corsApplied = await applyCORS();
    if (!corsApplied) {
      console.log('\n❌ CORS setup failed. See error details above.');
      return;
    }
    
    console.log('\n🎉 SUCCESS! Template thumbnails should now work!');
    console.log('🔄 Please refresh your browser (Cmd+R)');
    console.log('📋 Test by going to: http://localhost:5173/studio');
    console.log('✨ You should now see real template images instead of placeholders!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

main();
EOF
