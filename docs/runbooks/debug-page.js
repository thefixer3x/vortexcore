import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🌐 Opening page...');
  await page.goto('http://localhost:8080');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  console.log('📄 Page loaded, checking content...');
  
  // Take a screenshot
  await page.screenshot({ path: 'page-debug.png', fullPage: true });
  console.log('📸 Screenshot saved as page-debug.png');
  
  // Check what's in the root div
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) {
      return { found: false, innerHTML: null, children: 0, textContent: null };
    }
    return {
      found: true,
      innerHTML: root.innerHTML,
      children: root.children.length,
      textContent: root.textContent
    };
  });
  
  console.log('🔍 Root div content:', rootContent);
  
  // Check for any console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ Console error:', msg.text());
    }
  });
  
  // Check for any JavaScript errors
  const jsErrors = await page.evaluate(() => {
    return window.jsErrors || [];
  });
  
  console.log('🚨 JavaScript errors:', jsErrors);
  
  // Wait a bit more to see if React loads
  const rootContentAfter = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) {
      return { found: false, innerHTML: null, children: 0, textContent: null };
    }
    return {
      found: true,
      innerHTML: root.innerHTML,
      children: root.children.length,
      textContent: root.textContent
    };
  });
      children: root.children.length,
      textContent: root.textContent
    };
  });
  
  console.log('🔍 Root div content after waiting:', rootContentAfter);
  
  // Check if any React components are visible
  const hasReactContent = await page.evaluate(() => {
    // Look for common React attributes or components
    const reactElements = document.querySelectorAll('[data-reactroot], [data-reactid], .react-component');
    const hasVortexCoreElements = document.querySelector('.min-h-screen, .bg-background, .text-foreground');
    
    return {
      reactElements: reactElements.length,
      hasVortexCoreElements: !!hasVortexCoreElements,
      bodyClasses: document.body.className,
      htmlClasses: document.documentElement.className
    };
  });
  
  console.log('⚛️ React content check:', hasReactContent);
  
  // Check CSS loading
  const cssLoaded = await page.evaluate(() => {
    const styles = Array.from(document.styleSheets);
    return styles.map(sheet => {
      let rules;
      try {
        // Attempt to read cssRules; may throw on cross-origin sheets
        rules = sheet.cssRules ? sheet.cssRules.length : 0;
      } catch (e) {
        // Fallback for inaccessible sheets
        rules = 'No access';
      }
      return { href: sheet.href, rules };
    });
  });
  
  console.log('🎨 CSS loading status:', cssLoaded);
  
  await browser.close();
  console.log('✅ Debug complete!');
})();
