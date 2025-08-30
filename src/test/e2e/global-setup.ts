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
    await page.goto(config.webServer?.url || 'http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Check if the app is running
    const title = await page.title();
    console.log(`📱 Application loaded: ${title}`);
    
    // Setup test data if needed
    await setupTestData(page);
    
    console.log('✅ Global setup completed successfully');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function setupTestData(page: any) {
  console.log('🗃️ Setting up test data...');
  
  // You can add test data setup here
  // For example, creating test users, seeding database, etc.
  
  // Example: Check if we can access the API
  try {
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/health', { method: 'GET' });
      return res.ok;
    });
    
    if (response) {
      console.log('✅ API health check passed');
    }
  } catch (error) {
    console.log('ℹ️ API health check skipped (endpoint may not exist)');
  }
}

export default globalSetup;