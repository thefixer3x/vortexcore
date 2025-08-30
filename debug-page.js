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
    return {
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
  console.log('⏳ Waiting for React to load...');
  await page.waitForTimeout(5000);
  
  // Check again after waiting
  const rootContentAfter = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      innerHTML: root.innerHTML,
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
    return styles.map(sheet => ({
      href: sheet.href,
      rules: sheet.cssRules ? sheet.cssRules.length : 'No access'
    }));
  });
  
  console.log('🎨 CSS loading status:', cssLoaded);
  
  await browser.close();
  console.log('✅ Debug complete!');
})();
