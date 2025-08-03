const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('❌ Console Error:', msg.text());
    } else if (msg.type() === 'warning') {
      console.warn('⚠️ Console Warning:', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', (err) => {
    console.error('❌ Page Error:', err.message);
  });

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Wait for the app to load
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Check if the Studio page loads
    await page.click('a[href="/studio"]');
    await page.waitForTimeout(3000);
    
    // Check if the texte tab exists
    const texteTab = await page.$('button[data-tab="texte"]');
    if (texteTab) {
      console.log('✅ Texte tab found');
      await texteTab.click();
      await page.waitForTimeout(2000);
      
      // Check if FabricTextEditor is rendered
      const fabricEditor = await page.$('.fabric-text-editor');
      if (fabricEditor) {
        console.log('✅ FabricTextEditor rendered');
      } else {
        console.log('❌ FabricTextEditor not found');
      }
    } else {
      console.log('❌ Texte tab not found');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'diagnostic-screenshot.png' });
    console.log('📸 Screenshot saved as diagnostic-screenshot.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();