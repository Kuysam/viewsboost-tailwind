// Automated Template Preview Testing with Puppeteer
// Run with: node test-automation.js

const puppeteer = require('puppeteer');

async function testTemplatePreviewSystem() {
  console.log('🚀 Starting automated template preview tests...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless testing
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging from the page
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('🌐 PAGE:', msg.text());
    } else if (msg.type() === 'error') {
      console.error('❌ PAGE ERROR:', msg.text());
    }
  });
  
  const testResults = {
    video: { tested: 0, passed: 0, failed: 0 },
    image: { tested: 0, passed: 0, failed: 0 },
    document: { tested: 0, passed: 0, failed: 0 }
  };
  
  try {
    // Test different category types
    const categories = [
      { name: 'TikTok Video', type: 'video', url: 'http://localhost:5173/category/TikTok%20Video' },
      { name: 'Instagram Post', type: 'image', url: 'http://localhost:5173/category/Instagram%20Post' },
      { name: 'Business', type: 'document', url: 'http://localhost:5173/category/Business' }
    ];
    
    for (const category of categories) {
      console.log(`\n🎯 Testing ${category.name} templates (${category.type})...`);
      
      try {
        // Navigate to category page
        await page.goto(category.url, { waitUntil: 'networkidle2' });
        
        // Wait for templates to load
        await page.waitForSelector('[data-testid="template-card"]', { timeout: 10000 });
        
        // Get template cards
        const templateCards = await page.$$('[data-testid="template-card"]');
        console.log(`   Found ${templateCards.length} template cards`);
        
        if (templateCards.length === 0) {
          console.warn(`   ⚠️ No templates found for ${category.name}`);
          continue;
        }
        
        // Test first 2 templates
        const templatesToTest = Math.min(2, templateCards.length);
        
        for (let i = 0; i < templatesToTest; i++) {
          const card = templateCards[i];
          
          // Get template title
          const titleElement = await card.$('.text-xl');
          const templateTitle = titleElement ? await page.evaluate(el => el.textContent, titleElement) : `Template ${i + 1}`;
          
          console.log(`   🔍 Testing template: "${templateTitle}"`);
          
          try {
            // Record URL before click
            const urlBefore = page.url();
            
            // Count modals before click
            const modalsBefore = await page.$$('.fixed.inset-0.z-\\[10000\\]');
            
            // Click the template card
            await card.click();
            
            // Wait for modal to appear
            await page.waitForTimeout(1000);
            
            // Check if modal appeared
            const modalsAfter = await page.$$('.fixed.inset-0.z-\\[10000\\]');
            const modalOpened = modalsAfter.length > modalsBefore.length;
            
            // Check URL didn't change to video URL
            const urlAfter = page.url();
            const noVideoNavigation = !urlAfter.includes('/videos/');
            const noUnwantedNavigation = urlBefore === urlAfter;
            
            testResults[category.type].tested++;
            
            if (modalOpened && noVideoNavigation && noUnwantedNavigation) {
              console.log(`   ✅ SUCCESS: "${templateTitle}" opened modal correctly`);
              testResults[category.type].passed++;
              
              // Check for Edit Template button
              const editButton = await page.$('button:has-text("Edit Template")');
              if (editButton) {
                console.log(`   🎨 Edit Template button found`);
              }
              
              // Close modal by clicking outside or close button
              try {
                const closeButton = await page.$('[role="dialog"] button, .fixed.inset-0 button');
                if (closeButton) {
                  await closeButton.click();
                } else {
                  // Click outside modal
                  await page.click('.fixed.inset-0.bg-black');
                }
                await page.waitForTimeout(500);
              } catch (closeError) {
                console.warn(`   ⚠️ Could not close modal: ${closeError.message}`);
              }
              
            } else {
              console.error(`   ❌ FAILED: "${templateTitle}"`);
              console.error(`      Modal opened: ${modalOpened}`);
              console.error(`      No video navigation: ${noVideoNavigation}`);
              console.error(`      No unwanted navigation: ${noUnwantedNavigation}`);
              console.error(`      URL before: ${urlBefore}`);
              console.error(`      URL after: ${urlAfter}`);
              
              testResults[category.type].failed++;
              
              // Try to recover if navigation occurred
              if (!noUnwantedNavigation) {
                await page.goto(category.url, { waitUntil: 'networkidle2' });
                await page.waitForTimeout(1000);
              }
            }
            
          } catch (templateError) {
            console.error(`   ❌ ERROR testing "${templateTitle}":`, templateError.message);
            testResults[category.type].failed++;
          }
          
          // Small delay between template tests
          await page.waitForTimeout(500);
        }
        
      } catch (categoryError) {
        console.error(`❌ ERROR testing category ${category.name}:`, categoryError.message);
      }
    }
    
    // Print final results
    console.log('\n📊 AUTOMATED TEST RESULTS:');
    console.log('===========================');
    
    let totalTested = 0, totalPassed = 0, totalFailed = 0;
    
    Object.entries(testResults).forEach(([type, results]) => {
      const { tested, passed, failed } = results;
      const passRate = tested > 0 ? ((passed / tested) * 100).toFixed(1) : '0';
      
      console.log(`${type.toUpperCase()}: ${passed}/${tested} passed (${passRate}%) - ${failed} failed`);
      
      totalTested += tested;
      totalPassed += passed;
      totalFailed += failed;
    });
    
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
    
  } catch (error) {
    console.error('❌ Test automation failed:', error);
  } finally {
    await browser.close();
  }
}

// Check if Puppeteer is available
try {
  testTemplatePreviewSystem();
} catch (error) {
  console.log('⚠️ Puppeteer not available. Install with: npm install puppeteer');
  console.log('📋 Alternative: Copy and paste the test script from test-template-previews.js into browser console');
} 