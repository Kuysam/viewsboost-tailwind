#!/usr/bin/env node

/**
 * 🎬 MP4 TO JSON TEMPLATE CONVERTER
 * 
 * Automatically converts MP4 video files into JSON template files
 * that can be imported into the ViewsBoost template system.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Video source directories to scan
  VIDEO_DIRECTORIES: [
    './public/videos',
    './videos',
    './'  // Current directory
  ],
  
  // Output directory for generated JSON files
  OUTPUT_DIR: './generated-templates',
  
  // Template categories based on filename patterns
  CATEGORY_MAPPING: {
    'tiktok': 'TikTok Video',
    'youtube': 'YouTube Video',
    'instagram': 'Instagram Video',
    'facebook': 'Facebook Video',
    'shorts': 'YouTube Shorts',
    'reel': 'Instagram Reels',
    'story': 'Story Template',
    'video': 'General Video'
  },
  
  // Default template settings
  DEFAULTS: {
    category: 'TikTok Video',
    platform: 'TikTok',
    quality: 'HD',
    aspectRatio: '9:16',
    duration: '15-30s'
  }
};

/**
 * Determine category from filename
 */
function getCategoryFromFilename(filename) {
  const lowerName = filename.toLowerCase();
  
  for (const [pattern, category] of Object.entries(CONFIG.CATEGORY_MAPPING)) {
    if (lowerName.includes(pattern)) {
      return category;
    }
  }
  
  return CONFIG.DEFAULTS.category;
}

/**
 * Generate template ID from filename
 */
function generateTemplateId(filename) {
  const baseName = path.basename(filename, path.extname(filename));
  return baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

/**
 * Generate human-readable title from filename
 */
function generateTitle(filename) {
  const baseName = path.basename(filename, path.extname(filename));
  
  // Convert common patterns to readable titles
  return baseName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/Video/gi, 'Template')
    + ' Template';
}

/**
 * Generate tags from filename and category
 */
function generateTags(filename, category) {
  const tags = [];
  const lowerName = filename.toLowerCase();
  
  // Add category-based tags
  if (category.includes('TikTok')) tags.push('tiktok', 'vertical', 'social');
  if (category.includes('YouTube')) tags.push('youtube', 'horizontal');
  if (category.includes('Instagram')) tags.push('instagram', 'square', 'social');
  if (category.includes('Shorts')) tags.push('shorts', 'vertical', 'youtube');
  if (category.includes('Reel')) tags.push('reels', 'vertical', 'instagram');
  if (category.includes('Story')) tags.push('story', 'vertical', 'social');
  
  // Add filename-based tags
  if (lowerName.includes('dance')) tags.push('dance', 'trending');
  if (lowerName.includes('music')) tags.push('music', 'audio');
  if (lowerName.includes('trend')) tags.push('trending', 'viral');
  if (lowerName.includes('tutorial')) tags.push('tutorial', 'educational');
  if (lowerName.includes('comedy')) tags.push('comedy', 'funny');
  if (lowerName.includes('business')) tags.push('business', 'professional');
  
  // Always add these generic tags
  tags.push('template', 'video');
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generate icon based on category and filename
 */
function generateIcon(filename, category) {
  const lowerName = filename.toLowerCase();
  
  // Category-based icons
  if (category.includes('TikTok')) return '🎵';
  if (category.includes('YouTube')) return '📺';
  if (category.includes('Instagram')) return '📸';
  if (category.includes('Facebook')) return '👥';
  if (category.includes('Shorts')) return '⚡';
  if (category.includes('Story')) return '📱';
  
  // Content-based icons
  if (lowerName.includes('dance')) return '💃';
  if (lowerName.includes('music')) return '🎶';
  if (lowerName.includes('business')) return '💼';
  if (lowerName.includes('tutorial')) return '🎓';
  if (lowerName.includes('comedy')) return '😂';
  
  return '🎬'; // Default video icon
}

/**
 * Create a template object from video file
 */
function createTemplate(videoFile, relativePath) {
  const filename = path.basename(videoFile);
  const category = getCategoryFromFilename(filename);
  
  return {
    id: generateTemplateId(filename),
    title: generateTitle(filename),
    category: category,
    desc: `Professional ${category.toLowerCase()} template for content creation. Import and customize for your brand.`,
    icon: generateIcon(filename, category),
    preview: relativePath,
    videoSource: relativePath,
    platform: category.split(' ')[0], // Extract platform from category
    quality: CONFIG.DEFAULTS.quality,
    tags: generateTags(filename, category),
    useVideoPreview: true,
    aspectRatio: category.includes('TikTok') || category.includes('Shorts') || category.includes('Story') ? '9:16' : '16:9',
    duration: CONFIG.DEFAULTS.duration
  };
}

/**
 * Scan directory for MP4 files
 */
function scanForVideos(directory) {
  const videos = [];
  
  if (!fs.existsSync(directory)) {
    console.log(`📂 Directory not found: ${directory}`);
    return videos;
  }
  
  console.log(`📂 Scanning directory: ${directory}`);
  
  try {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.mp4') {
        const fullPath = path.join(directory, file);
        const relativePath = path.relative('.', fullPath);
        videos.push({ fullPath, relativePath, filename: file });
        console.log(`   ✅ Found: ${file}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error scanning ${directory}: ${error.message}`);
  }
  
  return videos;
}

/**
 * Generate JSON templates by category
 */
function generateTemplatesByCategory(videos) {
  const templatesByCategory = {};
  
  for (const video of videos) {
    const template = createTemplate(video.fullPath, video.relativePath);
    const category = template.category;
    
    if (!templatesByCategory[category]) {
      templatesByCategory[category] = [];
    }
    
    templatesByCategory[category].push(template);
  }
  
  return templatesByCategory;
}

/**
 * Main conversion function
 */
async function convertVideosToJson() {
  console.log('🎬 MP4 TO JSON TEMPLATE CONVERTER');
  console.log('=====================================\n');
  
  // Create output directory
  if (!fs.existsSync(CONFIG.OUTPUT_DIR)) {
    fs.mkdirSync(CONFIG.OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${CONFIG.OUTPUT_DIR}\n`);
  }
  
  // Scan for videos
  console.log('📹 Scanning for MP4 files...\n');
  let allVideos = [];
  
  for (const dir of CONFIG.VIDEO_DIRECTORIES) {
    const videos = scanForVideos(dir);
    allVideos = allVideos.concat(videos);
  }
  
  if (allVideos.length === 0) {
    console.log('\n❌ No MP4 files found in any directory!');
    console.log('   Make sure your MP4 files are in one of these directories:');
    CONFIG.VIDEO_DIRECTORIES.forEach(dir => console.log(`   - ${dir}`));
    return;
  }
  
  console.log(`\n📊 Found ${allVideos.length} MP4 files total\n`);
  
  // Generate templates by category
  console.log('🏷️  Generating templates by category...\n');
  const templatesByCategory = generateTemplatesByCategory(allVideos);
  
  // Save JSON files by category
  const generatedFiles = [];
  
  for (const [category, templates] of Object.entries(templatesByCategory)) {
    const filename = `${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-templates.json`;
    const filepath = path.join(CONFIG.OUTPUT_DIR, filename);
    
    // Write JSON file
    fs.writeFileSync(filepath, JSON.stringify(templates, null, 2));
    console.log(`✅ Generated: ${filepath} (${templates.length} templates)`);
    generatedFiles.push(filepath);
  }
  
  // Also generate a combined file with all templates
  const allTemplates = Object.values(templatesByCategory).flat();
  const combinedFilepath = path.join(CONFIG.OUTPUT_DIR, 'all-templates.json');
  fs.writeFileSync(combinedFilepath, JSON.stringify(allTemplates, null, 2));
  console.log(`✅ Generated: ${combinedFilepath} (${allTemplates.length} templates total)`);
  generatedFiles.push(combinedFilepath);
  
  // Summary
  console.log('\n🎉 CONVERSION COMPLETE!');
  console.log('======================');
  console.log(`📄 Generated ${generatedFiles.length} JSON files`);
  console.log(`📹 Converted ${allVideos.length} MP4 videos`);
  console.log(`🏷️  Created ${Object.keys(templatesByCategory).length} categories`);
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Import any of these JSON files to your Admin Panel → Template Category Manager');
  console.log('2. Use the "📹 Upload Videos" button to upload your MP4 files');
  console.log('3. Click "📤 Sync to Firestore" to save everything');
  
  console.log('\n📁 Generated Files:');
  generatedFiles.forEach(file => console.log(`   - ${file}`));
}

// Run the converter
if (require.main === module) {
  convertVideosToJson().catch(console.error);
}

module.exports = { convertVideosToJson }; 