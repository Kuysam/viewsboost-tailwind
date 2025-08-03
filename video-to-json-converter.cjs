#!/usr/bin/env node

/**
 * 🎬 MP4 TO JSON TEMPLATE CONVERTER
 * Automatically converts MP4 video files into JSON template files
 * Works with any directory you specify!
 */

const fs = require('fs');
const path = require('path');

// Get directory from command line argument or prompt user
const args = process.argv.slice(2);
const VIDEO_DIR = args[0] || null;

/**
 * Generate template from MP4 file
 */
function createTemplate(filename, index, videoPath) {
  const baseName = path.basename(filename, '.mp4');
  
  return {
    id: `template-${index + 1}`,
    title: `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} Template`,
    category: "TikTok Video",
    desc: `Professional video template created from ${filename}. Perfect for social media content creation.`,
    icon: "🎵",
    preview: filename,  // Just the filename, will be uploaded later
    videoSource: filename,  // Just the filename, will be uploaded later
    platform: "TikTok",
    quality: "HD",
    tags: ["tiktok", "social", "vertical", "template"],
    useVideoPreview: true,
    aspectRatio: "9:16",
    duration: "15-30s",
    // Store original path for reference
    originalPath: videoPath
  };
}

/**
 * Main conversion function
 */
function convertVideosToJson(videoDirectory) {
  console.log('🎬 MP4 TO JSON TEMPLATE CONVERTER');
  console.log('====================================\n');
  
  if (!videoDirectory) {
    console.log('📁 Please specify the directory containing your MP4 files:');
    console.log('   node video-to-json-converter.cjs /path/to/your/videos');
    console.log('   Example: node video-to-json-converter.cjs ~/Desktop/my-videos');
    console.log('   Example: node video-to-json-converter.cjs ./my-video-folder\n');
    return;
  }
  
  // Resolve the path
  const resolvedPath = path.resolve(videoDirectory);
  console.log(`📂 Scanning directory: ${resolvedPath}\n`);
  
  // Check if directory exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Directory not found: ${resolvedPath}`);
    console.log('\n💡 Make sure the path is correct and the directory exists.');
    return;
  }
  
  // Find all MP4 files
  const files = fs.readdirSync(resolvedPath);
  const mp4Files = files.filter(file => file.toLowerCase().endsWith('.mp4'));
  
  if (mp4Files.length === 0) {
    console.error(`❌ No MP4 files found in ${resolvedPath}`);
    console.log('\n💡 Make sure your directory contains .mp4 files.');
    return;
  }
  
  console.log(`📹 Found ${mp4Files.length} MP4 files:`);
  mp4Files.forEach(file => console.log(`   - ${file}`));
  
  // Generate templates
  const templates = mp4Files.map((file, index) => {
    const fullPath = path.join(resolvedPath, file);
    return createTemplate(file, index, fullPath);
  });
  
  // Generate output filename
  const dirName = path.basename(resolvedPath);
  const outputFile = `./templates-from-${dirName.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
  
  // Write JSON file
  fs.writeFileSync(outputFile, JSON.stringify(templates, null, 2));
  
  console.log(`\n✅ SUCCESS! Generated ${outputFile} with ${templates.length} templates`);
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Go to Admin Panel → Template Category Manager');
  console.log(`2. Import the generated file: ${outputFile}`);
  console.log('3. Click "📹 Upload Videos" and select your MP4 files from:');
  console.log(`   ${resolvedPath}`);
  console.log('4. Click "📤 Sync to Firestore" to save everything');
  
  console.log('\n🎯 WORKFLOW:');
  console.log('   JSON Templates → Import to Playground');
  console.log('   MP4 Files → Upload via "📹 Upload Videos" button');
  console.log('   Everything → Sync to Firebase Storage + Firestore');
}

// Show usage if no arguments
if (!VIDEO_DIR) {
  console.log('🎬 MP4 TO JSON TEMPLATE CONVERTER');
  console.log('====================================\n');
  console.log('Usage: node video-to-json-converter.cjs <video-directory>');
  console.log('\nExamples:');
  console.log('   node video-to-json-converter.cjs ~/Desktop/tiktok-videos');
  console.log('   node video-to-json-converter.cjs ./my-videos');
  console.log('   node video-to-json-converter.cjs /Users/username/Downloads/videos');
  console.log('\nThis will scan the directory for .mp4 files and create a JSON template file.');
} else {
  // Run the converter with specified directory
  convertVideosToJson(VIDEO_DIR);
} 