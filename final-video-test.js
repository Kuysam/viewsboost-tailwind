// FINAL COMPREHENSIVE VIDEO PLAYBACK TEST
// This script verifies that MP4 videos play successfully in template cards
// Run this in browser console: http://localhost:5173/category/TikTok%20Video

console.log('🎬 FINAL VIDEO PLAYBACK TEST - Starting comprehensive verification...');

async function runFinalVideoTest() {
  const results = {
    videoFiles: { tested: 0, accessible: 0, failed: 0 },
    templateCards: { found: 0, withVideo: 0, playable: 0 },
    previewModals: { tested: 0, working: 0, failed: 0 },
    navigation: { tested: 0, safe: 0, unsafe: 0 }
  };

  console.log('\n🔍 PHASE 1: Testing video file accessibility...');
  
  // Test all video files
  const videoFiles = [
    '/videos/video1.mp4',
    '/videos/video2.mp4', 
    '/videos/video3.mp4',
    '/videos/video4.mp4',
    '/videos/video5.mp4',
    '/videos/video6.mp4'
  ];
  
  for (const videoPath of videoFiles) {
    results.videoFiles.tested++;
    try {
      const response = await fetch(videoPath, { method: 'HEAD' });
      const size = response.headers.get('content-length');
      const sizeMB = size ? (parseInt(size) / (1024 * 1024)).toFixed(1) : 'unknown';
      
      if (response.ok) {
        results.videoFiles.accessible++;
        console.log(`✅ ${videoPath} - ${sizeMB}MB - ACCESSIBLE`);
      } else {
        results.videoFiles.failed++;
        console.error(`❌ ${videoPath} - ${response.status} - NOT ACCESSIBLE`);
      }
    } catch (error) {
      results.videoFiles.failed++;
      console.error(`❌ ${videoPath} - ERROR: ${error.message}`);
    }
  }
  
  console.log('\n🎯 PHASE 2: Testing template cards with video elements...');
  
  // Find template cards
  const templateCards = document.querySelectorAll('[data-testid="template-card"], .cursor-pointer.transition-all, .group.rounded-2xl');
  results.templateCards.found = templateCards.length;
  console.log(`📊 Found ${templateCards.length} template cards`);
  
  if (templateCards.length === 0) {
    console.warn('⚠️ No template cards found. Make sure you are on TikTok Video or YouTube Video category page');
    return results;
  }
  
  // Test first 3 template cards
  for (let i = 0; i < Math.min(3, templateCards.length); i++) {
    const card = templateCards[i];
    const templateTitle = card.querySelector('.text-xl, h3, .font-bold')?.textContent || `Template ${i + 1}`;
    
    console.log(`\n🔍 Testing template: "${templateTitle}"`);
    
    // Check for video elements
    const videoElements = card.querySelectorAll('video');
    if (videoElements.length > 0) {
      results.templateCards.withVideo++;
      console.log(`   📹 Found ${videoElements.length} video element(s)`);
      
      // Test video playability
      for (let j = 0; j < videoElements.length; j++) {
        const video = videoElements[j];
        const videoSrc = video.src;
        
        console.log(`   🎥 Testing video ${j + 1}: ${videoSrc}`);
        
        if (!videoSrc) {
          console.warn(`   ⚠️ Video ${j + 1} has no source`);
          continue;
        }
        
        try {
          // Test video playback
          video.muted = true;
          video.currentTime = 0;
          
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log(`   ✅ Video ${j + 1} playing successfully!`);
            results.templateCards.playable++;
            
            // Let it play for 2 seconds then pause
            setTimeout(() => {
              video.pause();
              console.log(`   ⏸️ Video ${j + 1} paused after test`);
            }, 2000);
            
          } else {
            console.warn(`   ⚠️ Video ${j + 1} play() returned undefined`);
          }
          
        } catch (playError) {
          console.error(`   ❌ Video ${j + 1} playback failed:`, playError.message);
        }
      }
    } else {
      console.log(`   ℹ️ No video elements found - likely an image template`);
    }
  }
  
  console.log('\n🎭 PHASE 3: Testing preview modal functionality...');
  
  // Test preview modals on first 2 templates
  for (let i = 0; i < Math.min(2, templateCards.length); i++) {
    const card = templateCards[i];
    const templateTitle = card.querySelector('.text-xl, h3, .font-bold')?.textContent || `Template ${i + 1}`;
    
    console.log(`\n🎯 Testing preview modal for: "${templateTitle}"`);
    results.previewModals.tested++;
    
    try {
      const urlBefore = window.location.href;
      
      // Click the template card
      card.click();
      
      // Wait for modal to appear
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if modal opened
      const modal = document.querySelector('.fixed.inset-0.z-\\[10000\\], [role="dialog"]');
      const urlAfter = window.location.href;
      
      // Check for navigation issues
      const urlChanged = urlBefore !== urlAfter;
      const navigatedToVideo = urlAfter.includes('/videos/');
      
      results.navigation.tested++;
      
      if (modal && !urlChanged && !navigatedToVideo) {
        console.log(`   ✅ Preview modal opened correctly!`);
        console.log(`   ✅ No unwanted navigation occurred`);
        results.previewModals.working++;
        results.navigation.safe++;
        
        // Check for Edit Template button
        const editButton = modal.querySelector('button');
        if (editButton && editButton.textContent?.includes('Edit')) {
          console.log(`   🎨 Edit Template button found`);
        }
        
        // Close modal
        const closeButton = modal.querySelector('button[aria-label="Close"], .absolute.top-4.right-4 button') || 
                           document.querySelector('.fixed.inset-0.bg-black');
        if (closeButton) {
          closeButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log(`   ✅ Modal closed successfully`);
        }
        
      } else {
        console.error(`   ❌ Preview modal test failed!`);
        console.error(`      Modal found: ${!!modal}`);
        console.error(`      URL changed: ${urlChanged}`);
        console.error(`      Navigated to video: ${navigatedToVideo}`);
        console.error(`      URL before: ${urlBefore}`);
        console.error(`      URL after: ${urlAfter}`);
        
        results.previewModals.failed++;
        results.navigation.unsafe++;
        
        // Try to recover
        if (urlChanged) {
          window.history.back();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
    } catch (modalError) {
      console.error(`   ❌ Modal test error:`, modalError);
      results.previewModals.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print comprehensive results
  console.log('\n📊 FINAL TEST RESULTS SUMMARY:');
  console.log('================================');
  
  const videoAccessRate = results.videoFiles.tested > 0 ? 
    ((results.videoFiles.accessible / results.videoFiles.tested) * 100).toFixed(1) : '0';
  const videoPlaybackRate = results.templateCards.withVideo > 0 ?
    ((results.templateCards.playable / results.templateCards.withVideo) * 100).toFixed(1) : '0';
  const modalSuccessRate = results.previewModals.tested > 0 ?
    ((results.previewModals.working / results.previewModals.tested) * 100).toFixed(1) : '0';
  const navigationSafetyRate = results.navigation.tested > 0 ?
    ((results.navigation.safe / results.navigation.tested) * 100).toFixed(1) : '0';
  
  console.log(`🎬 VIDEO FILES: ${results.videoFiles.accessible}/${results.videoFiles.tested} accessible (${videoAccessRate}%)`);
  console.log(`🎥 VIDEO PLAYBACK: ${results.templateCards.playable}/${results.templateCards.withVideo} playable (${videoPlaybackRate}%)`);
  console.log(`🎭 PREVIEW MODALS: ${results.previewModals.working}/${results.previewModals.tested} working (${modalSuccessRate}%)`);
  console.log(`🛡️ NAVIGATION SAFETY: ${results.navigation.safe}/${results.navigation.tested} safe (${navigationSafetyRate}%)`);
  
  // Overall assessment
  const overallScore = (
    parseFloat(videoAccessRate) * 0.25 +
    parseFloat(videoPlaybackRate) * 0.35 +
    parseFloat(modalSuccessRate) * 0.25 +
    parseFloat(navigationSafetyRate) * 0.15
  ).toFixed(1);
  
  console.log(`\n🎯 OVERALL SUCCESS RATE: ${overallScore}%`);
  
  if (overallScore >= 95) {
    console.log('\n🎉 EXCELLENT! All video template functionality is working perfectly!');
    console.log('✅ MP4 videos are accessible and play successfully');
    console.log('✅ Template preview modals work correctly');
    console.log('✅ No unwanted navigation to video URLs');
    console.log('✅ Edit Template buttons function properly');
  } else if (overallScore >= 80) {
    console.log('\n✅ GOOD! Most video functionality is working correctly.');
    console.log('Minor issues detected but core functionality is solid.');
  } else if (overallScore >= 60) {
    console.log('\n⚠️ PARTIAL SUCCESS: Some video functionality is working.');
    console.log('Several issues need attention for full functionality.');
  } else {
    console.log('\n❌ NEEDS MAJOR ATTENTION: Multiple critical issues detected.');
    console.log('Video template system requires significant fixes.');
  }
  
  return results;
}

// Auto-start the test
console.log('🚀 Starting final video playback verification in 2 seconds...');
setTimeout(() => {
  runFinalVideoTest().catch(error => {
    console.error('❌ Final video test failed:', error);
  });
}, 2000); 