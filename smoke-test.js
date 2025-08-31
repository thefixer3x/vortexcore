#!/usr/bin/env node
/**
 * Quick smoke test for VortexCore application
 * Tests basic rendering and functionality
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function runSmokeTest() {
  console.log('🚀 Starting VortexCore Smoke Test...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });

  try {
    // Test 1: Basic page load
    console.log('📄 Testing page load...');
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    if (!response.ok()) {
      throw new Error(`Page load failed: ${response.status()}`);
    }
    console.log('✅ Page loaded successfully');

    // Test 2: Check for critical elements
    console.log('🔍 Checking critical elements...');
    
    // Wait for React to render
    await page.waitForTimeout(2000);
    
    // Check if main content is rendered
    const hasContent = await page.evaluate(() => {
      return document.body.innerText.length > 100;
    });
    
    if (!hasContent) {
      throw new Error('Page content not rendered properly');
    }
    console.log('✅ Content rendered');

    // Test 3: Check for styling
    console.log('🎨 Checking styles...');
    const hasStyles = await page.evaluate(() => {
      const element = document.querySelector('body');
      const styles = window.getComputedStyle(element);
      return styles.fontFamily !== 'Times' && styles.fontSize !== '16px';
    });
    
    if (!hasStyles) {
      console.log('⚠️  Default styles detected - CSS may not be loading');
    } else {
      console.log('✅ Custom styles applied');
    }

    // Test 4: Take screenshot
    console.log('📸 Taking screenshot...');
    await page.screenshot({ 
      path: 'smoke-test-screenshot.png',
      fullPage: true 
    });
    console.log('✅ Screenshot saved');

    // Test 5: Check for JavaScript errors
    const jsErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });

    // Wait a bit more for potential errors
    await page.waitForTimeout(3000);

    if (jsErrors.length > 0) {
      console.log('⚠️  JavaScript errors detected:', jsErrors);
    } else {
      console.log('✅ No JavaScript errors');
    }

    console.log('🎉 Smoke test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Smoke test failed:', error.message);
    await page.screenshot({ path: 'smoke-test-error.png' });
    return false;
  } finally {
    await browser.close();
  }
}

runSmokeTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});