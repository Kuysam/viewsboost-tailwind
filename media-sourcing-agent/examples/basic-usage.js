#!/usr/bin/env node

/**
 * Basic Usage Examples
 * 
 * This file demonstrates the most common use cases for the Media Sourcing Agent.
 * Run with: node examples/basic-usage.js
 */

import { MediaSourcingAgent } from '../src/index.js';

async function basicUsageExamples() {
  console.log('🚀 Media Sourcing Agent - Basic Usage Examples\n');

  // Initialize the agent
  const agent = new MediaSourcingAgent({
    autoDownload: false,
    maxResults: 5,
    downloadQuality: 'high'
  });

  try {
    // Example 1: Simple image search
    console.log('1️⃣  Simple Image Search');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const imageResults = await agent.searchImages('coffee cup morning', ['pexels']);
    console.log(`✅ Found ${imageResults.totalResults} coffee images from Pexels`);
    
    if (imageResults.images.length > 0) {
      const image = imageResults.images[0];
      console.log(`   📸 Best match: ${image.photographer} - ${image.dimensions.width}x${image.dimensions.height}`);
      console.log(`   🔗 URL: ${image.url}`);
    }

    // Example 2: Multi-source image search
    console.log('\n2️⃣  Multi-Source Image Search');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const multiResults = await agent.searchImages('workspace desktop', ['pexels', 'unsplash'], {
      maxResults: 10,
      orientation: 'landscape'
    });
    
    console.log(`✅ Multi-source search results:`);
    multiResults.sources.forEach(source => {
      if (source.found !== undefined) {
        console.log(`   ${source.name}: ${source.found} images found`);
      } else {
        console.log(`   ${source.name}: ❌ ${source.error}`);
      }
    });

    // Example 3: Video search
    console.log('\n3️⃣  Video Search');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const videoResults = await agent.searchVideos('ocean waves', ['pexels'], {
      maxResults: 3,
      orientation: 'landscape'
    });
    
    console.log(`✅ Found ${videoResults.totalResults} ocean videos`);
    
    if (videoResults.videos.length > 0) {
      const video = videoResults.videos[0];
      console.log(`   🎥 Best match: ${video.creator} - ${video.duration}s - ${video.dimensions.width}x${video.dimensions.height}`);
      console.log(`   📊 Available qualities: ${video.videoFiles.map(f => f.quality).join(', ')}`);
    }

    // Example 4: Download with options
    console.log('\n4️⃣  Download with Processing Options');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (imageResults.images.length > 0) {
      console.log('⬇️  Downloading and processing 1 image...');
      
      const downloadResults = await agent.downloadImages([imageResults.images[0]], {
        resize: {
          width: 800,
          height: 600,
          fit: 'cover'
        },
        quality: 85,
        format: 'jpeg'
      });
      
      const result = downloadResults[0];
      if (result.success) {
        console.log(`   ✅ Downloaded: ${result.filename}`);
        console.log(`   📏 Size: ${result.dimensions.width}x${result.dimensions.height}`);
        console.log(`   💾 File size: ${(result.size / 1024).toFixed(1)} KB`);
        console.log(`   📍 Saved to: ${result.path}`);
      } else {
        console.log(`   ❌ Download failed: ${result.error}`);
      }
    }

    // Example 5: Statistics
    console.log('\n5️⃣  Current Statistics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const stats = await agent.getStats();
    console.log(`📊 Media Library Stats:`);
    console.log(`   📁 Total files: ${stats.totalFiles}`);
    console.log(`   📸 Images: ${stats.images}`);
    console.log(`   🎥 Videos: ${stats.videos}`);
    console.log(`   💾 Total size: ${(stats.totalSize / (1024 * 1024)).toFixed(2)} MB`);
    
    if (Object.keys(stats.sources).length > 0) {
      console.log(`   🌐 Sources:`);
      Object.entries(stats.sources).forEach(([source, count]) => {
        console.log(`      ${source}: ${count} files`);
      });
    }

    // Example 6: Rate Limit Status
    console.log('\n6️⃣  API Rate Limit Status');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const rateLimits = await agent.getRateLimitStatus();
    Object.entries(rateLimits).forEach(([service, status]) => {
      const percentage = ((status.remaining / status.limit) * 100).toFixed(1);
      console.log(`   🔄 ${service}: ${status.remaining}/${status.limit} (${percentage}% remaining)`);
    });

    // Example 7: Local Media Search
    console.log('\n7️⃣  Local Media Search');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const localResults = await agent.searchLocalMedia('coffee', {
      type: 'image',
      source: 'pexels'
    });
    
    if (localResults.length > 0) {
      console.log(`🔍 Found ${localResults.length} local files matching 'coffee':`);
      localResults.slice(0, 3).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.filename} - ${file.photographer || file.creator}`);
      });
    } else {
      console.log(`🔍 No local files found matching 'coffee'`);
    }

    console.log('\n✨ Examples completed successfully!');

  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    
    // Common error handling
    if (error.message.includes('API key')) {
      console.log('\n💡 Tip: Make sure your API keys are set in the .env file');
    } else if (error.message.includes('Rate limit')) {
      console.log('\n💡 Tip: You\'ve hit the API rate limit. Wait a bit before trying again.');
    }
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  basicUsageExamples().catch(console.error);
}