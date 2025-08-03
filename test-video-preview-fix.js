// Quick test to verify video preview fix
// Run this in browser console after clicking a template to open the preview modal

console.log('🔧 Testing Video Preview Fix...');

// Wait for modal to be open
setTimeout(() => {
  const modal = document.querySelector('[role="dialog"], .fixed.inset-0.z-\\[10000\\]');
  
  if (modal) {
    console.log('✅ Modal found');
    
    // Find the Preview Video button
    const previewButton = Array.from(modal.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('Preview Video')
    );
    
    if (previewButton) {
      console.log('✅ Preview Video button found');
      
      // Test clicking the button (but don't actually click to avoid opening new tab)
      console.log('🎬 Preview Video button is ready to test');
      console.log('📋 Button text:', previewButton.textContent);
      console.log('🎯 When clicked, should open a valid video file instead of causing 404');
      
    } else {
      console.log('ℹ️ No Preview Video button found - this may be an image template');
    }
    
    // Check for Edit Template button
    const editButton = Array.from(modal.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('Edit Template')
    );
    
    if (editButton) {
      console.log('✅ Edit Template button found');
    }
    
  } else {
    console.log('❌ No modal found. Please click a template first to open the preview modal.');
  }
}, 1000);

console.log('🎯 Instructions:');
console.log('1. Click on a TikTok Video or YouTube Video template');
console.log('2. Wait for the preview modal to open');
console.log('3. Click the "Preview Video" button');
console.log('4. It should now open a valid video file (video1.mp4 - video6.mp4) instead of causing a 404'); 