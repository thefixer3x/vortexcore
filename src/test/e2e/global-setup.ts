import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');
  
  // Create browser instance for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for application to be available
    console.log('⏳ Waiting for application to be available...');
    const baseURL = process.env.BASE_URL || config.webServer?.url || 'http://localhost:8080';
    await page.goto(baseURL);
    await page.waitForTimeout(2000);
    
    // Check if the app is running
    const title = await page.title();
    console.log(`📱 Application loaded: ${title}`);
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
