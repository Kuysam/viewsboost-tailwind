// Comprehensive Video Playback Test Script
// This script tests actual MP4 video playback in template cards
// Run this in the browser console on a video category page

console.log('🎬 [VIDEO PLAYBACK TEST] Starting comprehensive video playback tests...');

const videoTestResults = {
  templatesFound: 0,
  videosFound: 0,
  videosPlayable: 0,
  videosFailed: 0,
  previewsWorking: 0,
  previewsFailed: 0
};

async function testVideoPlayback() {
  console.log('🔍 Scanning for video templates...');
  
  // Find all template cards
  const templateCards = document.querySelectorAll('[data-testid="template-card"], .bg-gray-900\\/95, .rounded-2xl');
  console.log(`📊 Found ${templateCards.length} potential template cards`);
  
  videoTestResults.templatesFound = templateCards.length;
  
  if (templateCards.length === 0) {
    console.warn('⚠️ No template cards found. Make sure you are on a video category page (TikTok Video, YouTube Video)');
    return;
  }
  
  // Test each template card for video functionality
  for (let i = 0; i < Math.min(templateCards.length, 5); i++) {
    const card = templateCards[i];
    const templateTitle = card.querySelector('.text-xl, h3, .font-bold')?.textContent || `Template ${i + 1}`;
    
    console.log(`\n🎯 Testing template ${i + 1}: "${templateTitle}"`);
    
    // Look for video elements in this card
    const videos = card.querySelectorAll('video');
    console.log(`   📹 Found ${videos.length} video elements`);
    
    if (videos.length === 0) {
      console.log('   ℹ️ No video elements found - this may be an image template');
      continue;
    }
    
    videoTestResults.videosFound += videos.length;
    
    // Test each video element
    for (let j = 0; j < videos.length; j++) {
      const video = videos[j];
      const videoSrc = video.src;
      
      console.log(`   🔍 Testing video ${j + 1}: ${videoSrc}`);
      
      try {
        // Test video accessibility
        if (!videoSrc || videoSrc === '') {
          console.warn(`   ⚠️ Video ${j + 1} has no source`);
          videoTestResults.videosFailed++;
          continue;
        }
        
        // Test if video source is accessible
        const response = await fetch(videoSrc, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`   ❌ Video ${j + 1} source not accessible: ${response.status}`);
          videoTestResults.videosFailed++;
          continue;
        }
        
        console.log(`   ✅ Video ${j + 1} source accessible (${response.headers.get('content-length')} bytes)`);
        
        // Test video playback capability
        const canPlay = await new Promise((resolve) => {
          const testVideo = document.createElement('video');
          testVideo.src = videoSrc;
          testVideo.muted = true;
          testVideo.playsInline = true;
          
          testVideo.oncanplay = () => {
            console.log(`   ✅ Video ${j + 1} can play (duration: ${testVideo.duration}s)`);
            resolve(true);
          };
          
          testVideo.onerror = (e) => {
            console.error(`   ❌ Video ${j + 1} playback error:`, e);
            resolve(false);
          };
          
          // Timeout after 5 seconds
          setTimeout(() => {
            console.warn(`   ⚠️ Video ${j + 1} playback test timeout`);
            resolve(false);
          }, 5000);
          
          testVideo.load();
        });
        
        if (canPlay) {
          videoTestResults.videosPlayable++;
          
          // Test actual video playback in the card
          try {
            video.muted = true;
            video.currentTime = 0;
            await video.play();
            console.log(`   🎬 Video ${j + 1} successfully playing in template card`);
            
            // Let it play for 1 second then pause
            setTimeout(() => {
              video.pause();
              console.log(`   ⏸️ Video ${j + 1} paused after test playback`);
            }, 1000);
            
          } catch (playError) {
            console.warn(`   ⚠️ Video ${j + 1} playback in card failed:`, playError.message);
          }
          
        } else {
          videoTestResults.videosFailed++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error testing video ${j + 1}:`, error);
        videoTestResults.videosFailed++;
      }
    }
    
    // Test template preview modal functionality
    console.log(`   🎭 Testing preview modal for "${templateTitle}"`);
    
    try {
      const urlBefore = window.location.href;
      
      // Click the template card
      card.click();
      
      // Wait for modal to appear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if modal opened
      const modal = document.querySelector('.fixed.inset-0.z-\\[10000\\], [role="dialog"]');
      const urlAfter = window.location.href;
      
      if (modal && urlBefore === urlAfter && !urlAfter.includes('/videos/')) {
        console.log(`   ✅ Preview modal opened correctly for "${templateTitle}"`);
        videoTestResults.previewsWorking++;
        
        // Close modal
        const closeButton = modal.querySelector('button') || document.querySelector('.fixed.inset-0.bg-black');
        if (closeButton) {
          closeButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } else {
        console.error(`   ❌ Preview modal failed for "${templateTitle}"`);
        console.error(`      Modal found: ${!!modal}`);
        console.error(`      URL changed: ${urlBefore !== urlAfter}`);
        console.error(`      Navigated to video: ${urlAfter.includes('/videos/')}`);
        videoTestResults.previewsFailed++;
        
        // Try to recover if navigation occurred
        if (urlBefore !== urlAfter) {
          window.history.back();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
    } catch (previewError) {
      console.error(`   ❌ Preview test error for "${templateTitle}":`, previewError);
      videoTestResults.previewsFailed++;
    }
    
    // Small delay between template tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Print comprehensive results
  console.log('\n📊 VIDEO PLAYBACK TEST RESULTS:');
  console.log('================================');
  console.log(`Templates Found: ${videoTestResults.templatesFound}`);
  console.log(`Videos Found: ${videoTestResults.videosFound}`);
  console.log(`Videos Playable: ${videoTestResults.videosPlayable}/${videoTestResults.videosFound}`);
  console.log(`Videos Failed: ${videoTestResults.videosFailed}`);
  console.log(`Previews Working: ${videoTestResults.previewsWorking}`);
  console.log(`Previews Failed: ${videoTestResults.previewsFailed}`);
  
  const videoPlaybackRate = videoTestResults.videosFound > 0 ? 
    ((videoTestResults.videosPlayable / videoTestResults.videosFound) * 100).toFixed(1) : '0';
  const previewSuccessRate = (videoTestResults.previewsWorking + videoTestResults.previewsFailed) > 0 ?
    ((videoTestResults.previewsWorking / (videoTestResults.previewsWorking + videoTestResults.previewsFailed)) * 100).toFixed(1) : '0';
  
  console.log(`\n🎬 VIDEO PLAYBACK SUCCESS RATE: ${videoPlaybackRate}%`);
  console.log(`🎭 PREVIEW MODAL SUCCESS RATE: ${previewSuccessRate}%`);
  
  if (videoPlaybackRate >= 90 && previewSuccessRate >= 90) {
    console.log('\n🎉 EXCELLENT! Video templates are working perfectly!');
    console.log('✅ MP4 videos play successfully');
    console.log('✅ Preview modals work correctly');
    console.log('✅ No unwanted navigation to video URLs');
  } else if (videoPlaybackRate >= 70 || previewSuccessRate >= 70) {
    console.log('\n✅ GOOD! Most video functionality is working, minor issues detected.');
  } else {
    console.log('\n⚠️ NEEDS ATTENTION! Multiple video playback or preview issues detected.');
  }
  
  return videoTestResults;
}

// Quick video source accessibility test
async function quickVideoSourceTest() {
  console.log('\n🔍 Quick video source accessibility test...');
  
  const videoSources = [
    '/videos/video1.mp4',
    '/videos/video2.mp4', 
    '/videos/video3.mp4',
    '/videos/video4.mp4',
    '/videos/video5.mp4',
    '/videos/video6.mp4'
  ];
  
  for (const src of videoSources) {
    try {
      const response = await fetch(src, { method: 'HEAD' });
      const size = response.headers.get('content-length');
      const sizeKB = size ? Math.round(size / 1024) : 'unknown';
      
      if (response.ok) {
        console.log(`✅ ${src} - accessible (${sizeKB} KB)`);
      } else {
        console.error(`❌ ${src} - not accessible (${response.status})`);
      }
    } catch (error) {
      console.error(`❌ ${src} - error: ${error.message}`);
    }
  }
}

// Run the comprehensive test
console.log('🚀 Starting video playback verification...\n');

quickVideoSourceTest().then(() => {
  console.log('\n🎬 Starting template video playback test...');
  return testVideoPlayback();
}).catch(error => {
  console.error('❌ Video playback test failed:', error);
}); 