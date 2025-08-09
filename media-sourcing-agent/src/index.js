import { MediaSourcingAgent } from './agents/MediaSourcingAgent.js';

// Example usage and demonstrations
async function main() {
  console.log('🎬 Media Sourcing Agent - Example Usage\n');

  try {
    // Initialize the agent
    const agent = new MediaSourcingAgent({
      autoDownload: false,
      maxResults: 10,
      downloadQuality: 'high'
    });

    console.log('✅ Agent initialized successfully');

    // Example 1: Search for images
    console.log('\n📸 Searching for nature images...');
    const imageResults = await agent.searchImages('nature landscape', ['pexels', 'unsplash'], {
      maxResults: 5,
      orientation: 'landscape'
    });

    console.log(`Found ${imageResults.totalResults} images:`);
    imageResults.sources.forEach(source => {
      console.log(`  ${source.name}: ${source.found} images`);
    });

    if (imageResults.images.length > 0) {
      console.log('\nFirst image details:');
      const firstImage = imageResults.images[0];
      console.log(`  ID: ${firstImage.id}`);
      console.log(`  Source: ${firstImage.source}`);
      console.log(`  Photographer: ${firstImage.photographer}`);
      console.log(`  Dimensions: ${firstImage.dimensions.width}x${firstImage.dimensions.height}`);
      console.log(`  Download URL: ${firstImage.downloadUrl}`);
    }

    // Example 2: Search for videos (Pexels only)
    console.log('\n🎥 Searching for technology videos...');
    const videoResults = await agent.searchVideos('technology computer', ['pexels'], {
      maxResults: 3,
      orientation: 'landscape'
    });

    console.log(`Found ${videoResults.totalResults} videos:`);
    videoResults.sources.forEach(source => {
      console.log(`  ${source.name}: ${source.found} videos`);
    });

    if (videoResults.videos.length > 0) {
      console.log('\nFirst video details:');
      const firstVideo = videoResults.videos[0];
      console.log(`  ID: ${firstVideo.id}`);
      console.log(`  Source: ${firstVideo.source}`);
      console.log(`  Creator: ${firstVideo.creator}`);
      console.log(`  Duration: ${firstVideo.duration}s`);
      console.log(`  Dimensions: ${firstVideo.dimensions.width}x${firstVideo.dimensions.height}`);
      console.log(`  Quality options: ${firstVideo.videoFiles.map(f => f.quality).join(', ')}`);
    }

    // Example 3: Download a few images
    if (imageResults.images.length > 0) {
      console.log('\n⬇️  Downloading first 2 images...');
      const downloadResults = await agent.downloadImages(imageResults.images.slice(0, 2), {
        quality: 80 // JPEG quality
      });

      downloadResults.forEach((result, index) => {
        if (result.success) {
          console.log(`  ✅ Downloaded: ${result.filename} (${result.size} bytes)`);
        } else {
          console.log(`  ❌ Failed: ${result.error}`);
        }
      });
    }

    // Example 4: Get statistics
    console.log('\n📊 Current statistics:');
    const stats = await agent.getStats();
    console.log(`  Total files: ${stats.totalFiles}`);
    console.log(`  Images: ${stats.images}`);
    console.log(`  Videos: ${stats.videos}`);
    console.log(`  Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);

    if (Object.keys(stats.sources).length > 0) {
      console.log('  Sources:');
      Object.entries(stats.sources).forEach(([source, count]) => {
        console.log(`    ${source}: ${count} files`);
      });
    }

    // Example 5: Rate limit status
    console.log('\n⏱️  Rate limit status:');
    const rateLimits = await agent.getRateLimitStatus();
    Object.entries(rateLimits).forEach(([service, status]) => {
      console.log(`  ${service}: ${status.remaining}/${status.limit} requests remaining`);
    });

    // Example 6: Queue status
    console.log('\n📋 Queue status:');
    const queueStatus = await agent.getQueueStatus();
    console.log(`  Pending downloads: ${queueStatus.pending}`);
    console.log(`  Queue size: ${queueStatus.size}`);
    console.log(`  Is paused: ${queueStatus.isPaused}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MediaSourcingAgent };