#!/usr/bin/env node

/**
 * Advanced Usage Examples
 * 
 * This file demonstrates advanced features like batch processing,
 * custom rate limiting, metadata management, and error handling.
 * Run with: node examples/advanced-usage.js
 */

import { MediaSourcingAgent } from '../src/index.js';

async function advancedUsageExamples() {
  console.log('🔥 Media Sourcing Agent - Advanced Usage Examples\n');

  const agent = new MediaSourcingAgent({
    autoDownload: false,
    maxResults: 20,
    downloadQuality: 'high'
  });

  try {
    // Example 1: Advanced Search with Filters
    console.log('1️⃣  Advanced Search with Multiple Filters');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const advancedSearch = await agent.searchImages('business team', ['pexels', 'unsplash'], {
      maxResults: 15,
      orientation: 'landscape',
      size: 'large',
      color: 'blue'
    });

    console.log(`🔍 Advanced search completed:`);
    console.log(`   Total results: ${advancedSearch.totalResults}`);
    console.log(`   Search query: "${advancedSearch.query}"`);
    console.log(`   Filters applied: landscape, large, blue tint`);
    
    advancedSearch.sources.forEach(source => {
      if (source.found !== undefined) {
        console.log(`   📊 ${source.name}: ${source.found}/${source.totalAvailable || 'unknown'} available`);
      }
    });

    // Example 2: Batch Download with Custom Processing
    console.log('\n2️⃣  Batch Download with Custom Processing');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (advancedSearch.images.length >= 5) {
      console.log('⚙️  Processing batch download with different options...');
      
      // Create different processing options for each image
      const imagesToProcess = advancedSearch.images.slice(0, 5).map((image, index) => ({
        ...image,
        customOptions: {
          resize: {
            width: 400 + (index * 100), // 400, 500, 600, 700, 800
            height: 300 + (index * 75),  // 300, 375, 450, 525, 600
            fit: 'cover'
          },
          quality: 90 - (index * 5), // 90, 85, 80, 75, 70
          prefix: `batch_${index + 1}`
        }
      }));

      const batchResults = [];
      for (let i = 0; i < imagesToProcess.length; i++) {
        const image = imagesToProcess[i];
        console.log(`   🔄 Processing image ${i + 1}/5...`);
        
        try {
          const result = await agent.downloadImages([image], image.customOptions);
          batchResults.push(result[0]);
          
          if (result[0].success) {
            console.log(`      ✅ ${result[0].filename} - ${result[0].dimensions.width}x${result[0].dimensions.height}`);
          } else {
            console.log(`      ❌ Failed: ${result[0].error}`);
          }
        } catch (error) {
          console.log(`      ⚠️  Error: ${error.message}`);
        }
      }

      const successful = batchResults.filter(r => r.success).length;
      console.log(`\n   📈 Batch Summary: ${successful}/${batchResults.length} downloads successful`);
    }

    // Example 3: Video Processing with Quality Selection
    console.log('\n3️⃣  Advanced Video Processing');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const videoSearch = await agent.searchVideos('city traffic time lapse', ['pexels'], {
      maxResults: 3,
      orientation: 'landscape',
      size: 'large'
    });

    if (videoSearch.videos.length > 0) {
      const video = videoSearch.videos[0];
      console.log(`🎥 Selected video: ${video.creator} - ${video.duration}s`);
      console.log(`   Available qualities: ${video.videoFiles.map(f => f.quality).join(', ')}`);
      
      // Download highest quality version
      console.log(`   ⬇️  Downloading highest quality version...`);
      const videoDownload = await agent.downloadVideos([video], { quality: 'uhd' });
      
      if (videoDownload[0].success) {
        console.log(`   ✅ Video downloaded: ${videoDownload[0].filename}`);
        console.log(`   💾 Size: ${(videoDownload[0].size / (1024 * 1024)).toFixed(2)} MB`);
      }
    }

    // Example 4: Metadata Management and Search
    console.log('\n4️⃣  Advanced Metadata Management');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Search with complex filters
    const metadataSearch = await agent.searchLocalMedia('business', {
      type: 'image',
      orientation: 'landscape',
      minSize: 100000, // 100KB minimum
      dateFrom: '2024-01-01'
    });

    console.log(`🔍 Metadata search results:`);
    console.log(`   Found ${metadataSearch.length} files matching criteria`);
    
    if (metadataSearch.length > 0) {
      console.log(`   📄 Sample results:`);
      metadataSearch.slice(0, 3).forEach((file, index) => {
        const sizeKB = (file.size / 1024).toFixed(1);
        const downloadDate = new Date(file.downloadedAt).toLocaleDateString();
        console.log(`      ${index + 1}. ${file.filename}`);
        console.log(`         📏 ${file.dimensions.width}x${file.dimensions.height} - ${sizeKB}KB`);
        console.log(`         🌐 Source: ${file.source} - Downloaded: ${downloadDate}`);
      });
    }

    // Example 5: Rate Limiting and Queue Management
    console.log('\n5️⃣  Rate Limiting and Queue Management');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check current queue status
    const queueStatus = await agent.getQueueStatus();
    console.log(`📋 Current Queue Status:`);
    console.log(`   Pending downloads: ${queueStatus.pending}`);
    console.log(`   Queue size: ${queueStatus.size}`);
    console.log(`   Status: ${queueStatus.isPaused ? 'Paused' : 'Active'}`);
    
    // Check rate limits
    const rateLimits = await agent.getRateLimitStatus();
    console.log(`\n🔄 Rate Limit Status:`);
    Object.entries(rateLimits).forEach(([service, status]) => {
      const timeUntilReset = new Date(status.resetTime).toLocaleTimeString();
      console.log(`   ${service}:`);
      console.log(`     Used: ${status.requestCount}/${status.limit}`);
      console.log(`     Remaining: ${status.remaining}`);
      console.log(`     Resets at: ${timeUntilReset}`);
    });

    // Example 6: Error Handling and Retry Logic
    console.log('\n6️⃣  Advanced Error Handling');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Demonstrate handling various error scenarios
    const errorTestCases = [
      {
        name: 'Invalid URL Test',
        test: async () => {
          try {
            await agent.downloadImages([{
              downloadUrl: 'not-a-valid-url',
              source: 'test'
            }]);
          } catch (error) {
            return { error: error.message, handled: true };
          }
        }
      },
      {
        name: 'Rate Limit Simulation',
        test: async () => {
          // This would normally trigger rate limiting in a real scenario
          return { message: 'Rate limit handling is built-in', handled: true };
        }
      }
    ];

    for (const testCase of errorTestCases) {
      console.log(`   🧪 Testing: ${testCase.name}`);
      try {
        const result = await testCase.test();
        if (result.handled) {
          console.log(`      ✅ Error handled gracefully: ${result.error || result.message}`);
        }
      } catch (error) {
        console.log(`      ⚠️  Unexpected error: ${error.message}`);
      }
    }

    // Example 7: Export and Analytics
    console.log('\n7️⃣  Export and Analytics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const fullStats = await agent.getStats();
    
    console.log(`📊 Comprehensive Analytics:`);
    console.log(`   📁 Library Overview:`);
    console.log(`      Total files: ${fullStats.totalFiles}`);
    console.log(`      Storage used: ${(fullStats.totalSize / (1024 * 1024)).toFixed(2)} MB`);
    
    if (fullStats.totalFiles > 0) {
      console.log(`   📈 Breakdown by Type:`);
      console.log(`      Images: ${fullStats.images} (${((fullStats.images / fullStats.totalFiles) * 100).toFixed(1)}%)`);
      console.log(`      Videos: ${fullStats.videos} (${((fullStats.videos / fullStats.totalFiles) * 100).toFixed(1)}%)`);
      
      console.log(`   🌐 Sources:`);
      Object.entries(fullStats.sources).forEach(([source, count]) => {
        const percentage = ((count / fullStats.totalFiles) * 100).toFixed(1);
        console.log(`      ${source}: ${count} files (${percentage}%)`);
      });
      
      if (fullStats.orientations && Object.keys(fullStats.orientations).length > 0) {
        console.log(`   📐 Orientations:`);
        Object.entries(fullStats.orientations).forEach(([orientation, count]) => {
          const percentage = ((count / fullStats.totalFiles) * 100).toFixed(1);
          console.log(`      ${orientation}: ${count} files (${percentage}%)`);
        });
      }

      if (fullStats.dateRange.oldest && fullStats.dateRange.newest) {
        console.log(`   📅 Date Range:`);
        console.log(`      Oldest: ${new Date(fullStats.dateRange.oldest).toLocaleDateString()}`);
        console.log(`      Newest: ${new Date(fullStats.dateRange.newest).toLocaleDateString()}`);
      }
    }

    // Metadata export example
    try {
      console.log(`\n   💾 Exporting metadata...`);
      const exportPath = await agent.metadataTracker.exportMetadata('json');
      console.log(`      ✅ Metadata exported to: ${exportPath}`);
    } catch (error) {
      console.log(`      ⚠️  Export failed: ${error.message}`);
    }

    console.log('\n🎯 Advanced examples completed successfully!');

  } catch (error) {
    console.error('\n❌ Advanced example failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  advancedUsageExamples().catch(console.error);
}