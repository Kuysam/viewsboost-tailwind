#!/usr/bin/env node

/**
 * 🤖 COMPREHENSIVE TEMPLATE GENERATOR
 * 
 * Watches the Desktop 'json Transformer' folder and automatically generates
 * JSON template files for multiple file formats:
 * - Videos: MP4, MOV, AVI, WebM, MKV
 * - Images: JPEG, PNG, GIF, SVG, WebP, BMP
 * - Documents: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const WATCH_FOLDER = path.join(os.homedir(), 'Desktop', 'json Transformer');
const OUTPUT_FOLDER = './generated-templates';

// Supported file formats
const SUPPORTED_FORMATS = {
  VIDEO: ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v', '.flv', '.wmv'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.tiff', '.ico'],
  DOCUMENT: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.rtf', '.odt', '.ods', '.odp']
};

/**
 * Detect file type and category based on filename and extension
 */
function detectFileTypeAndCategory(filename) {
  const ext = path.extname(filename).toLowerCase();
  const baseName = path.basename(filename, ext).toLowerCase();
  
  let fileType = 'unknown';
  let category = 'Uncategorized';
  let icon = '📄';
  let platform = 'General';
  let aspectRatio = '16:9';
  let templateType = 'template';

  // Determine file type
  if (SUPPORTED_FORMATS.VIDEO.includes(ext)) {
    fileType = 'video';
    templateType = 'video-template';
    
    // Video category detection
    if (baseName.includes('youtube') || baseName.includes('yt')) {
      category = "YouTube Video";
      icon = "🎬";
      platform = "YouTube";
      aspectRatio = "16:9";
    } else if (baseName.includes('shorts') || baseName.includes('short')) {
      category = "YouTube Shorts";
      icon = "📱";
      platform = "YouTube";
      aspectRatio = "9:16";
    } else if (baseName.includes('tiktok') || baseName.includes('tt')) {
      category = "TikTok Shorts";
      icon = "🎵";
      platform = "TikTok";
      aspectRatio = "9:16";
    } else if (baseName.includes('instagram') || baseName.includes('ig') || baseName.includes('reel')) {
      category = "Instagram Reel";
      icon = "📸";
      platform = "Instagram";
      aspectRatio = "9:16";
    } else if (baseName.includes('facebook') || baseName.includes('fb')) {
      category = "Facebook Video";
      icon = "📘";
      platform = "Facebook";
    } else if (baseName.includes('linkedin')) {
      category = "LinkedIn Video";
      icon = "💼";
      platform = "LinkedIn";
    } else if (baseName.includes('twitter')) {
      category = "Twitter Video";
      icon = "🐦";
      platform = "Twitter";
    } else if (baseName.includes('podcast')) {
      category = "Podcast";
      icon = "🎙️";
      platform = "Podcast";
    } else if (baseName.includes('tutorial') || baseName.includes('howto')) {
      category = "Tutorial";
      icon = "📖";
      platform = "Educational";
    } else if (baseName.includes('ad') || baseName.includes('commercial')) {
      category = "Video Ads";
      icon = "📺";
      platform = "Advertising";
    } else {
      category = "Video Landscape";
      icon = "🎥";
      platform = "General";
    }
    
  } else if (SUPPORTED_FORMATS.IMAGE.includes(ext)) {
    fileType = 'image';
    templateType = 'image-template';
    aspectRatio = '1:1'; // Default for images
    
    // Image category detection
    if (baseName.includes('thumbnail') || baseName.includes('thumb')) {
      category = "YouTube";
      icon = "🖼️";
      platform = "YouTube";
      aspectRatio = "16:9";
    } else if (baseName.includes('post') || baseName.includes('social')) {
      category = "Social Media Posts";
      icon = "📱";
      platform = "Social Media";
      aspectRatio = "1:1";
    } else if (baseName.includes('story') || baseName.includes('stories')) {
      category = "Instagram story";
      icon = "📸";
      platform = "Instagram";
      aspectRatio = "9:16";
    } else if (baseName.includes('banner') || baseName.includes('cover')) {
      category = "Facebook Covers (Community-focused)";
      icon = "🎨";
      platform = "Facebook";
      aspectRatio = "16:9";
    } else if (baseName.includes('logo') || baseName.includes('brand')) {
      category = "Personal Branding";
      icon = "👤";
      platform = "Branding";
    } else if (baseName.includes('infographic') || baseName.includes('info')) {
      category = "Infographic";
      icon = "📊";
      platform = "Educational";
    } else if (baseName.includes('quote') || baseName.includes('motivation')) {
      category = "Quote/Motivational";
      icon = "💭";
      platform = "Inspirational";
    } else if (baseName.includes('product') || baseName.includes('ecommerce')) {
      category = "E-commerce";
      icon = "🛍️";
      platform = "E-commerce";
    } else if (baseName.includes('event') || baseName.includes('announcement')) {
      category = "Event/Announcement";
      icon = "🎉";
      platform = "Events";
    } else if (baseName.includes('restaurant') || baseName.includes('food')) {
      category = "Restaurant";
      icon = "🍽️";
      platform = "Food & Beverage";
    } else {
      category = "Social Media Posts";
      icon = "📱";
      platform = "General";
    }
    
  } else if (SUPPORTED_FORMATS.DOCUMENT.includes(ext)) {
    fileType = 'document';
    templateType = 'document-template';
    aspectRatio = '8.5:11'; // Standard document ratio
    
    // Document category detection
    if (ext === '.pdf') {
      if (baseName.includes('resume') || baseName.includes('cv')) {
        category = "Personal Branding";
        icon = "👤";
        platform = "Professional";
      } else if (baseName.includes('proposal') || baseName.includes('contract')) {
        category = "Proposal";
        icon = "📋";
        platform = "Business";
      } else if (baseName.includes('report') || baseName.includes('analysis')) {
        category = "Report";
        icon = "📄";
        platform = "Business";
      } else if (baseName.includes('presentation') || baseName.includes('pitch')) {
        category = "Presentation";
        icon = "📊";
        platform = "Business";
      } else if (baseName.includes('invoice') || baseName.includes('bill')) {
        category = "Invoice";
        icon = "🧾";
        platform = "Business";
      } else if (baseName.includes('certificate') || baseName.includes('diploma')) {
        category = "Certificate";
        icon = "🏆";
        platform = "Education";
      } else if (baseName.includes('flyer') || baseName.includes('brochure')) {
        category = "Flyer";
        icon = "📄";
        platform = "Marketing";
      } else {
        category = "Documents";
        icon = "📄";
        platform = "General";
      }
    } else if (['.ppt', '.pptx'].includes(ext)) {
      category = "Presentation";
      icon = "📊";
      platform = "Business";
    } else if (['.doc', '.docx', '.txt', '.rtf'].includes(ext)) {
      if (baseName.includes('letter') || baseName.includes('letterhead')) {
        category = "Letterhead";
        icon = "📝";
        platform = "Business";
      } else if (baseName.includes('newsletter')) {
        category = "Newsletter";
        icon = "📰";
        platform = "Marketing";
      } else {
        category = "Documents";
        icon = "📝";
        platform = "General";
      }
    } else if (['.xls', '.xlsx'].includes(ext)) {
      category = "Report";
      icon = "📊";
      platform = "Business";
    } else {
      category = "Documents";
      icon = "📄";
      platform = "General";
    }
  }

  return {
    fileType,
    category,
    icon,
    platform,
    aspectRatio,
    templateType,
    extension: ext
  };
}

/**
 * Generate template from any supported file
 */
function createTemplate(filename, index) {
  const baseName = path.basename(filename, path.extname(filename));
  const detection = detectFileTypeAndCategory(filename);
  
  const template = {
    id: `${detection.templateType}-${baseName.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${Date.now()}`,
    title: baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    category: detection.category,
    desc: `Professional ${detection.category.toLowerCase()} template created from ${filename}. Perfect for ${detection.platform.toLowerCase()} content creation.`,
    icon: detection.icon,
    preview: filename,
    platform: detection.platform,
    quality: detection.fileType === 'video' ? "HD" : "High Quality",
    tags: [detection.platform.toLowerCase(), "template", "auto-generated", detection.fileType],
    aspectRatio: detection.aspectRatio,
    createdAt: new Date().toISOString(),
    autoGenerated: true,
    fileType: detection.fileType,
    originalExtension: detection.extension
  };

  // Add specific properties based on file type
  if (detection.fileType === 'video') {
    template.videoSource = filename;
    template.useVideoPreview = true;
    template.duration = "15-30s";
  } else if (detection.fileType === 'image') {
    template.imageSource = filename;
    template.useImagePreview = true;
  } else if (detection.fileType === 'document') {
    template.documentSource = filename;
    template.useDocumentPreview = true;
    template.pageCount = 1; // Default, could be detected if needed
  }

  return template;
}

/**
 * Check if file is supported
 */
function isSupportedFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return [...SUPPORTED_FORMATS.VIDEO, ...SUPPORTED_FORMATS.IMAGE, ...SUPPORTED_FORMATS.DOCUMENT].includes(ext);
}

/**
 * Generate templates from current supported files
 */
function generateTemplatesFromFolder() {
  if (!fs.existsSync(WATCH_FOLDER)) {
    console.log(`📁 Creating watch folder: ${WATCH_FOLDER}`);
    fs.mkdirSync(WATCH_FOLDER, { recursive: true });
    return;
  }

  const files = fs.readdirSync(WATCH_FOLDER);
  const supportedFiles = files.filter(file => isSupportedFile(file));

  if (supportedFiles.length === 0) {
    console.log(`📂 No supported files found in ${WATCH_FOLDER}`);
    console.log(`📋 Supported formats:`);
    console.log(`   🎬 Videos: ${SUPPORTED_FORMATS.VIDEO.join(', ')}`);
    console.log(`   🖼️  Images: ${SUPPORTED_FORMATS.IMAGE.join(', ')}`);
    console.log(`   📄 Documents: ${SUPPORTED_FORMATS.DOCUMENT.join(', ')}`);
    return;
  }

  console.log(`🎯 Processing ${supportedFiles.length} files...`);
  
  // Group by category and file type for better organization
  const templatesByCategory = {};
  const fileTypeStats = { video: 0, image: 0, document: 0 };
  
  supportedFiles.forEach((file, index) => {
    const template = createTemplate(file, index);
    const category = template.category;
    
    if (!templatesByCategory[category]) {
      templatesByCategory[category] = [];
    }
    
    templatesByCategory[category].push(template);
    fileTypeStats[template.fileType]++;
    
    const typeIcon = template.fileType === 'video' ? '🎬' : 
                     template.fileType === 'image' ? '🖼️' : '📄';
    console.log(`   ✅ ${typeIcon} ${file} → ${category}`);
  });

  // Create output folder
  if (!fs.existsSync(OUTPUT_FOLDER)) {
    fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
  }

  // Generate files by category
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const generatedFiles = [];

  for (const [category, templates] of Object.entries(templatesByCategory)) {
    const filename = `${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-templates-${timestamp}.json`;
    const filepath = path.join(OUTPUT_FOLDER, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(templates, null, 2));
    generatedFiles.push({ filepath, count: templates.length, category });
  }

  // Also create a combined file
  const allTemplates = Object.values(templatesByCategory).flat();
  const combinedFile = path.join(OUTPUT_FOLDER, `all-templates-${timestamp}.json`);
  fs.writeFileSync(combinedFile, JSON.stringify(allTemplates, null, 2));
  generatedFiles.push({ filepath: combinedFile, count: allTemplates.length, category: 'ALL' });

  console.log('\n🎉 TEMPLATES GENERATED!');
  console.log('======================');
  console.log(`📊 File Type Summary:`);
  console.log(`   🎬 Videos: ${fileTypeStats.video}`);
  console.log(`   🖼️  Images: ${fileTypeStats.image}`);
  console.log(`   📄 Documents: ${fileTypeStats.document}`);
  console.log(`   📋 Total: ${allTemplates.length} templates`);
  console.log('');
  
  generatedFiles.forEach(file => {
    console.log(`📄 ${file.filepath} (${file.count} templates - ${file.category})`);
  });

  console.log('\n📋 NEXT STEPS:');
  console.log('1. Import any JSON file to Admin Panel → Template Category Manager');
  console.log('2. Upload your files using the appropriate upload buttons:');
  console.log('   🎬 "📹 Upload Videos" for video files');
  console.log('   🖼️  "🖼️ Upload Images" for image files');
  console.log('   📄 "📄 Upload Documents" for document files');
  console.log(`3. Select files from: ${path.resolve(WATCH_FOLDER)}`);
  console.log('4. Click "📤 Sync to Firestore"');

  return generatedFiles;
}

/**
 * Watch folder for changes
 */
function watchFolder() {
  console.log('👁️  WATCHING FOR CHANGES...');
  console.log(`📁 Drop files into: ${path.resolve(WATCH_FOLDER)}`);
  console.log(`📋 Supported formats:`);
  console.log(`   🎬 Videos: ${SUPPORTED_FORMATS.VIDEO.join(', ')}`);
  console.log(`   🖼️  Images: ${SUPPORTED_FORMATS.IMAGE.join(', ')}`);
  console.log(`   📄 Documents: ${SUPPORTED_FORMATS.DOCUMENT.join(', ')}`);
  console.log('   Templates will be auto-generated!\n');

  let timeout;
  
  fs.watch(WATCH_FOLDER, (eventType, filename) => {
    if (filename && isSupportedFile(filename)) {
      const ext = path.extname(filename).toLowerCase();
      const typeIcon = SUPPORTED_FORMATS.VIDEO.includes(ext) ? '🎬' : 
                       SUPPORTED_FORMATS.IMAGE.includes(ext) ? '🖼️' : '📄';
      
      console.log(`${typeIcon} Detected: ${filename} (${eventType})`);
      
      // Debounce multiple changes
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.log('🔄 Regenerating templates...\n');
        generateTemplatesFromFolder();
        console.log('\n👁️  WATCHING FOR CHANGES...');
      }, 1000);
    }
  });
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🤖 COMPREHENSIVE TEMPLATE GENERATOR');
  console.log('===================================\n');

  if (command === 'watch') {
    // Watch mode - continuously monitor for changes
    generateTemplatesFromFolder(); // Process existing files first
    watchFolder();
  } else if (command === 'generate') {
    // One-time generation
    generateTemplatesFromFolder();
  } else {
    // Show usage
    console.log('Usage:');
    console.log('  node auto-template-generator.cjs generate   # Generate templates once');
    console.log('  node auto-template-generator.cjs watch      # Watch folder for changes');
    console.log('\nSupported File Types:');
    console.log(`  🎬 Videos: ${SUPPORTED_FORMATS.VIDEO.join(', ')}`);
    console.log(`  🖼️  Images: ${SUPPORTED_FORMATS.IMAGE.join(', ')}`);
    console.log(`  📄 Documents: ${SUPPORTED_FORMATS.DOCUMENT.join(', ')}`);
    console.log('\nFolders:');
    console.log(`  Input:  ${path.resolve(WATCH_FOLDER)}`);
    console.log(`  Output: ${path.resolve(OUTPUT_FOLDER)}`);
    console.log('\nWorkflow:');
    console.log('1. Drop supported files into the input folder');
    console.log('2. JSON templates are automatically generated');
    console.log('3. Import JSON files to your admin panel');
    console.log('4. Upload files using the appropriate upload buttons');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping auto-generator...');
  process.exit(0);
});

// Run the program
if (require.main === module) {
  main();
}