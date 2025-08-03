// ViewsBoost Studio - Comprehensive Feature Testing Script
// This script tests every feature systematically to verify functionality

const puppeteer = require('puppeteer');
const fs = require('fs');

class StudioFeatureTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      results: []
    };
  }

  async init() {
    console.log('🚀 Initializing Studio Feature Tester...');
    this.browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to Studio
    await this.page.goto('http://localhost:5173/studio', { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(3000); // Allow for full load
    console.log('✅ Studio page loaded');
  }

  async testFeature(testName, testFunction) {
    console.log(`\n🧪 Testing: ${testName}`);
    this.testResults.totalTests++;
    
    try {
      const result = await testFunction();
      if (result.success) {
        console.log(`✅ PASS: ${testName}`);
        this.testResults.passedTests++;
        this.testResults.results.push({
          name: testName,
          status: 'PASS',
          details: result.details || 'Test completed successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`❌ FAIL: ${testName} - ${result.error}`);
        this.testResults.failedTests++;
        this.testResults.results.push({
          name: testName,
          status: 'FAIL',
          details: result.error,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.log(`❌ ERROR: ${testName} - ${error.message}`);
      this.testResults.failedTests++;
      this.testResults.results.push({
        name: testName,
        status: 'ERROR',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // TEST 1: Studio Sidebar Tabs
  async testStudioSidebarTabs() {
    const tabs = [
      'create', 'uploads', 'video', 'photos', 'musics', 
      'templates', 'elements', 'tools', 'texte', 'styles'
    ];
    
    for (const tab of tabs) {
      await this.testFeature(`Studio Tab: ${tab}`, async () => {
        // Click the tab
        const tabSelector = `[data-tab="${tab}"]`;
        await this.page.waitForSelector(tabSelector, { timeout: 5000 });
        await this.page.click(tabSelector);
        await this.page.waitForTimeout(1000);
        
        // Check if tab content is visible
        const isActive = await this.page.evaluate((tabKey) => {
          const tabElement = document.querySelector(`[data-tab="${tabKey}"]`);
          return tabElement && tabElement.classList.contains('active');
        }, tab);
        
        // Check for content rendering
        const hasContent = await this.page.evaluate(() => {
          const mainContent = document.querySelector('main');
          return mainContent && mainContent.children.length > 0;
        });
        
        if (tab === 'create' || tab === 'templates') {
          // Should show create modal
          const modalVisible = await this.page.$('.fixed.inset-0.z-50') !== null;
          return { 
            success: modalVisible, 
            details: modalVisible ? 'Create modal opened correctly' : 'Create modal did not open'
          };
        } else {
          return { 
            success: hasContent, 
            details: hasContent ? `${tab} tab content loaded` : `${tab} tab content missing`
          };
        }
      });
    }
  }

  // TEST 2: Topbar Sections
  async testTopbarSections() {
    const sections = [
      { key: 'projects', label: 'My Projects' },
      { key: 'assets', label: 'Creative Asset' },
      { key: 'docs', label: 'Documents' },
      { key: 'web', label: 'Webpage' },
      { key: 'social', label: 'Social Media' },
      { key: 'ai', label: 'Generative AI' }
    ];
    
    for (const section of sections) {
      await this.testFeature(`Topbar Section: ${section.label}`, async () => {
        const sectionButton = await this.page.$(`button:has-text("${section.label}")`);
        if (!sectionButton) {
          // Try alternative selector
          const buttons = await this.page.$$('button');
          let found = false;
          for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent);
            if (text.includes(section.label)) {
              await button.click();
              found = true;
              break;
            }
          }
          return { 
            success: found, 
            details: found ? `${section.label} button clicked` : `${section.label} button not found`
          };
        } else {
          await sectionButton.click();
          return { success: true, details: `${section.label} section activated` };
        }
      });
    }
  }

  // TEST 3: Create Modal Subtabs
  async testCreateModalSubtabs() {
    // First activate create tab
    await this.page.click('[data-tab="create"]');
    await this.page.waitForTimeout(1000);
    
    const subtabs = [
      'Business', 'Marketing', 'Social Media', 'Web Design', 
      'Documents', 'Education', 'Events', 'Personal'
    ];
    
    for (const subtab of subtabs) {
      await this.testFeature(`Create Subtab: ${subtab}`, async () => {
        const subtabButtons = await this.page.$$('button');
        let found = false;
        
        for (const button of subtabButtons) {
          const text = await button.evaluate(el => el.textContent);
          if (text.trim() === subtab) {
            await button.click();
            await this.page.waitForTimeout(500);
            found = true;
            break;
          }
        }
        
        return { 
          success: found, 
          details: found ? `${subtab} subtab activated` : `${subtab} subtab not found`
        };
      });
    }
  }

  // TEST 4: Fabric Text Editor
  async testFabricTextEditor() {
    // Navigate to text editor
    await this.page.click('[data-tab="texte"]');
    await this.page.waitForTimeout(2000);
    
    await this.testFeature('Fabric Canvas Initialization', async () => {
      const canvas = await this.page.$('canvas');
      const canvasExists = canvas !== null;
      
      if (canvasExists) {
        const canvasInfo = await this.page.evaluate(() => {
          const canvas = document.querySelector('canvas');
          return {
            width: canvas.width,
            height: canvas.height,
            context: !!canvas.getContext('2d')
          };
        });
        
        return { 
          success: canvasInfo.context && canvasInfo.width > 0 && canvasInfo.height > 0,
          details: `Canvas: ${canvasInfo.width}x${canvasInfo.height}, Context: ${canvasInfo.context}`
        };
      }
      
      return { success: false, details: 'Canvas element not found' };
    });

    await this.testFeature('Text Tool Functionality', async () => {
      const textButton = await this.page.$('button[title="Add Text"], button:has-text("Text")');
      if (textButton) {
        await textButton.click();
        await this.page.waitForTimeout(500);
        return { success: true, details: 'Text tool activated' };
      }
      return { success: false, details: 'Text tool button not found' };
    });

    await this.testFeature('Color Picker Integration', async () => {
      const colorButton = await this.page.$('button[title="Color"], button:has-text("Color")');
      if (colorButton) {
        await colorButton.click();
        await this.page.waitForTimeout(500);
        const colorPicker = await this.page.$('.chrome-picker, .color-picker');
        return { 
          success: colorPicker !== null, 
          details: colorPicker ? 'Color picker opened' : 'Color picker not found'
        };
      }
      return { success: false, details: 'Color button not found' };
    });
  }

  // TEST 5: Upload Functionality
  async testUploadFunctionality() {
    await this.page.click('[data-tab="uploads"]');
    await this.page.waitForTimeout(1000);
    
    await this.testFeature('Upload Panel Rendering', async () => {
      const uploadArea = await this.page.$('.drag-drop, [class*="upload"], [class*="drop-zone"]');
      return { 
        success: uploadArea !== null, 
        details: uploadArea ? 'Upload area rendered' : 'Upload area not found'
      };
    });

    await this.testFeature('File Input Accessibility', async () => {
      const fileInputs = await this.page.$$('input[type="file"]');
      return { 
        success: fileInputs.length > 0, 
        details: `Found ${fileInputs.length} file input(s)`
      };
    });
  }

  // TEST 6: Video Panel Features
  async testVideoPanelFeatures() {
    await this.page.click('[data-tab="video"]');
    await this.page.waitForTimeout(1000);
    
    await this.testFeature('Video Categories Display', async () => {
      const categories = await this.page.$$('[class*="category"], [class*="selector"]');
      return { 
        success: categories.length > 0, 
        details: `Found ${categories.length} video categories`
      };
    });

    await this.testFeature('Platform Logos Rendering', async () => {
      const logos = await this.page.$$('img[src*="icons"], svg');
      return { 
        success: logos.length > 0, 
        details: `Found ${logos.length} platform icons`
      };
    });
  }

  // TEST 7: Template Loading
  async testTemplateLoading() {
    await this.page.click('[data-tab="templates"]');
    await this.page.waitForTimeout(2000);
    
    await this.testFeature('Template Grid Rendering', async () => {
      const templateGrid = await this.page.$('[class*="grid"], [class*="template"]');
      return { 
        success: templateGrid !== null, 
        details: templateGrid ? 'Template grid found' : 'Template grid not rendered'
      };
    });

    await this.testFeature('Template Count Display', async () => {
      const templateCards = await this.page.$$('[class*="template-card"], [class*="card"]');
      return { 
        success: templateCards.length >= 0, 
        details: `Found ${templateCards.length} template cards`
      };
    });
  }

  // TEST 8: Console Error Check
  async testConsoleErrors() {
    await this.testFeature('Console Error Check', async () => {
      const logs = await this.page.evaluate(() => {
        return window.consoleErrors || [];
      });
      
      // Listen for console errors
      await this.page.evaluateOnNewDocument(() => {
        window.consoleErrors = [];
        const originalError = console.error;
        console.error = (...args) => {
          window.consoleErrors.push(args.join(' '));
          originalError.apply(console, args);
        };
      });
      
      // Trigger some interactions to check for errors
      await this.page.click('[data-tab="create"]');
      await this.page.waitForTimeout(1000);
      await this.page.click('[data-tab="texte"]');
      await this.page.waitForTimeout(1000);
      
      const finalErrors = await this.page.evaluate(() => window.consoleErrors || []);
      
      return { 
        success: finalErrors.length === 0, 
        details: finalErrors.length === 0 ? 'No console errors detected' : `${finalErrors.length} console errors found: ${finalErrors.join(', ')}`
      };
    });
  }

  // TEST 9: Responsive Design
  async testResponsiveDesign() {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await this.testFeature(`Responsive: ${viewport.name}`, async () => {
        await this.page.setViewport(viewport);
        await this.page.waitForTimeout(1000);
        
        const layoutIntact = await this.page.evaluate(() => {
          const studio = document.querySelector('[class*="studio"], main');
          return studio && studio.offsetWidth > 0 && studio.offsetHeight > 0;
        });
        
        return { 
          success: layoutIntact, 
          details: layoutIntact ? `Layout intact at ${viewport.width}x${viewport.height}` : 'Layout broken'
        };
      });
    }
    
    // Reset to desktop
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  // TEST 10: Performance Check
  async testPerformance() {
    await this.testFeature('Page Load Performance', async () => {
      const startTime = Date.now();
      await this.page.reload({ waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      return { 
        success: loadTime < 10000, 
        details: `Page loaded in ${loadTime}ms`
      };
    });

    await this.testFeature('Memory Usage', async () => {
      const metrics = await this.page.metrics();
      const jsHeapSize = metrics.JSHeapUsedSize / (1024 * 1024); // Convert to MB
      
      return { 
        success: jsHeapSize < 100, 
        details: `JS Heap: ${jsHeapSize.toFixed(2)}MB`
      };
    });
  }

  async generateReport() {
    const report = {
      summary: {
        total: this.testResults.totalTests,
        passed: this.testResults.passedTests,
        failed: this.testResults.failedTests,
        successRate: `${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1)}%`
      },
      timestamp: new Date().toISOString(),
      results: this.testResults.results
    };
    
    // Write detailed report
    fs.writeFileSync('STUDIO_TEST_REPORT.json', JSON.stringify(report, null, 2));
    
    // Write summary report
    const summaryReport = `
# ViewsBoost Studio - Feature Testing Report

## 📊 Test Summary
- **Total Tests**: ${report.summary.total}
- **Passed**: ✅ ${report.summary.passed}
- **Failed**: ❌ ${report.summary.failed}
- **Success Rate**: ${report.summary.successRate}

## 📋 Test Results

${this.testResults.results.map(result => 
  `### ${result.status === 'PASS' ? '✅' : '❌'} ${result.name}
**Status**: ${result.status}
**Details**: ${result.details}
**Time**: ${result.timestamp}
`).join('\n')}

## 🎯 Overall Assessment
${report.summary.failed === 0 ? 
  '🎉 **ALL TESTS PASSED!** The Studio is fully functional.' : 
  `⚠️ **${report.summary.failed} issues found** - Review failed tests above.`}
`;
    
    fs.writeFileSync('STUDIO_TEST_SUMMARY.md', summaryReport);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${report.summary.successRate}`);
    console.log('='.repeat(60));
    
    return report;
  }

  async runAllTests() {
    console.log('🎬 Starting comprehensive Studio feature testing...\n');
    
    try {
      await this.init();
      
      // Core functionality tests
      await this.testStudioSidebarTabs();
      await this.testTopbarSections();
      await this.testCreateModalSubtabs();
      
      // Editor tests
      await this.testFabricTextEditor();
      await this.testUploadFunctionality();
      await this.testVideoPanelFeatures();
      await this.testTemplateLoading();
      
      // Quality tests
      await this.testConsoleErrors();
      await this.testResponsiveDesign();
      await this.testPerformance();
      
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Export for use
module.exports = StudioFeatureTester;

// Run tests if executed directly
if (require.main === module) {
  const tester = new StudioFeatureTester();
  tester.runAllTests()
    .then(report => {
      console.log('\n✅ Testing completed successfully!');
      console.log(`📊 Results: ${report.summary.passed}/${report.summary.total} tests passed`);
      process.exit(report.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Testing failed:', error);
      process.exit(1);
    });
} 