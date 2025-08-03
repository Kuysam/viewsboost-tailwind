// Comprehensive Template Preview Test Script
// This script tests video, image, and document template previews
// Run this in the browser console

console.log('🧪 [COMPREHENSIVE TEST] Starting template preview tests...');

const testResults = {
  video: { tested: 0, passed: 0, failed: 0 },
  image: { tested: 0, passed: 0, failed: 0 },
  document: { tested: 0, passed: 0, failed: 0 },
  navigation: { tested: 0, passed: 0, failed: 0 }
};

// Test categories for different template types
const testCategories = [
  { name: 'TikTok Video', type: 'video', url: '/category/TikTok%20Video' },
  { name: 'Instagram Post', type: 'image', url: '/category/Instagram%20Post' },
  { name: 'Business', type: 'document', url: '/category/Business' },
  { name: 'YouTube Video', type: 'video', url: '/category/YouTube%20Video' },
  { name: 'Instagram Story', type: 'image', url: '/category/Instagram%20Story' }
];

async function testTemplateCategory(category) {
  console.log(`\n🎯 Testing ${category.name} templates (${category.type})...`);
  
  // Navigate to category
  window.history.pushState({}, '', category.url);
  window.dispatchEvent(new PopStateEvent('popstate'));
  
  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Find template cards
  const templateCards = document.querySelectorAll('[data-testid="template-card"]');
  console.log(`   Found ${templateCards.length} template cards`);
  
  if (templateCards.length === 0) {
    console.warn(`   ⚠️ No templates found for ${category.name}`);
    return;
  }
  
  // Test first 3 templates (or all if less than 3)
  const templatesToTest = Math.min(3, templateCards.length);
  
  for (let i = 0; i < templatesToTest; i++) {
    const card = templateCards[i];
    const templateTitle = card.querySelector('.text-xl')?.textContent || `Template ${i + 1}`;
    
    console.log(`   🔍 Testing template: "${templateTitle}"`);
    
    try {
      // Check current URL before clicking
      const urlBeforeClick = window.location.href;
      
      // Count existing modals
      const modalsBefore = document.querySelectorAll('.fixed.inset-0.z-\\[10000\\]').length;
      
      // Click the template
      card.click();
      
      // Wait for modal to appear
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if modal opened
      const modalsAfter = document.querySelectorAll('.fixed.inset-0.z-\\[10000\\]').length;
      const modalOpened = modalsAfter > modalsBefore;
      
      // Check if URL changed (should not change)
      const urlAfterClick = window.location.href;
      const noNavigation = urlBeforeClick === urlAfterClick;
      
      // Check if navigated to video URL (bad)
      const navigatedToVideo = urlAfterClick.includes('/videos/');
      
      testResults[category.type].tested++;
      testResults.navigation.tested++;
      
      if (modalOpened && noNavigation && !navigatedToVideo) {
        console.log(`   ✅ SUCCESS: "${templateTitle}" opened modal correctly`);
        testResults[category.type].passed++;
        testResults.navigation.passed++;
        
        // Test Edit Template button if modal is open
        const editButton = document.querySelector('button:has-text("Edit Template"), button[class*="yellow"]:has-text("Edit")');
        if (editButton) {
          console.log(`   🎨 Testing Edit Template button...`);
          // Don't actually click it to avoid navigation, just check it exists
          console.log(`   ✅ Edit Template button found and ready`);
        }
        
        // Close modal
        const closeButton = document.querySelector('[role="dialog"] button, .fixed.inset-0 button');
        if (closeButton) {
          closeButton.click();
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          // Click outside modal to close
          const modalBackdrop = document.querySelector('.fixed.inset-0.bg-black');
          if (modalBackdrop) modalBackdrop.click();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } else {
        console.error(`   ❌ FAILED: "${templateTitle}"`);
        console.error(`      Modal opened: ${modalOpened}`);
        console.error(`      No navigation: ${noNavigation}`);
        console.error(`      Navigated to video: ${navigatedToVideo}`);
        console.error(`      URL before: ${urlBeforeClick}`);
        console.error(`      URL after: ${urlAfterClick}`);
        
        testResults[category.type].failed++;
        testResults.navigation.failed++;
        
        // Try to recover if we navigated somewhere wrong
        if (navigatedToVideo || !noNavigation) {
          window.history.pushState({}, '', category.url);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
    } catch (error) {
      console.error(`   ❌ ERROR testing "${templateTitle}":`, error);
      testResults[category.type].failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive template preview tests...\n');
  
  for (const category of testCategories) {
    await testTemplateCategory(category);
  }
  
  // Print final results
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  
  Object.entries(testResults).forEach(([type, results]) => {
    const total = results.tested;
    const passed = results.passed;
    const failed = results.failed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';
    
    console.log(`${type.toUpperCase()}: ${passed}/${total} passed (${passRate}%) - ${failed} failed`);
  });
  
  const totalTested = Object.values(testResults).reduce((sum, r) => sum + r.tested, 0);
  const totalPassed = Object.values(testResults).reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = Object.values(testResults).reduce((sum, r) => sum + r.failed, 0);
  const overallPassRate = totalTested > 0 ? ((totalPassed / totalTested) * 100).toFixed(1) : '0';
  
  console.log(`\nOVERALL: ${totalPassed}/${totalTested} passed (${overallPassRate}%) - ${totalFailed} failed`);
  
  if (overallPassRate >= 90) {
    console.log('\n🎉 EXCELLENT! Template preview system is working correctly!');
  } else if (overallPassRate >= 70) {
    console.log('\n✅ GOOD! Most template previews are working, minor issues detected.');
  } else {
    console.log('\n⚠️ NEEDS ATTENTION! Multiple template preview issues detected.');
  }
  
  return testResults;
}

// Start the tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
}); 