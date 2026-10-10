#!/usr/bin/env node
/**
 * Live Deployment Investigation Script
 * Tests the live VortexCore deployment for authentication and AI chat issues
 */

const { chromium } = require('playwright');

async function investigateLiveDeployment() {
  console.log('🔍 Starting live deployment investigation...');
  
  const browser = await chromium.launch({ headless: false }); // Visible for debugging
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    // Add user agent to avoid bot detection
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    console.log('📄 Navigating to live deployment...');
    await page.goto('https://vortexcore-one.vercel.app/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Take initial screenshot
    await page.screenshot({ path: 'live-investigation-homepage.png', fullPage: true });
    console.log('📸 Screenshot saved: live-investigation-homepage.png');

    // Investigation 1: Authentication Flow
    console.log('\n🔐 INVESTIGATING AUTHENTICATION...');
    
    // Check for biometric login button
    const biometricButton = await page.locator('button:has-text("Biometric")').or(
      page.locator('button[class*="biometric"]')
    ).or(
      page.locator('button:has([data-testid*="biometric"])')
    ).first();
    
    if (await biometricButton.isVisible()) {
      console.log('✅ Found biometric login button');
      
      // Click biometric login to test dev-test mode
      console.log('🧪 Testing biometric login (dev-test mode)...');
      await biometricButton.click();
      
      // Wait for potential navigation
      await page.waitForTimeout(3000);
      
      // Check if we're on dashboard
      if (page.url().includes('/dashboard')) {
        console.log('⚠️  ISSUE CONFIRMED: Biometric login bypasses authentication (dev-test mode active)');
        await page.screenshot({ path: 'live-investigation-dashboard-after-biometric.png' });
      } else {
        console.log('✅ Biometric login behaves normally');
      }
    } else {
      console.log('❌ Biometric login button not found');
    }

    // Investigation 2: AI Chat Interface
    console.log('\n🤖 INVESTIGATING AI CHAT...');
    
    // Look for chat button (floating button)
    const chatButton = await page.locator('button[class*="rounded-full"]').or(
      page.locator('button:has([class*="message"])')
    ).or(
      page.locator('[role="button"]:has([data-lucide="message-square"])')
    ).first();

    if (await chatButton.isVisible()) {
      console.log('✅ Found floating chat button');
      
      // Open chat interface
      await chatButton.click();
      await page.waitForTimeout(1000);
      
      // Check if chat interface opened
      const chatInterface = page.locator('text=VortexAI Assistant').or(
        page.locator('[class*="chat"]')
      );
      
      if (await chatInterface.isVisible()) {
        console.log('✅ Chat interface opens successfully');
        await page.screenshot({ path: 'live-investigation-chat-interface.png' });
        
        // Test AI chat functionality
        console.log('🧪 Testing AI chat response...');
        
        // Find message input
        const messageInput = page.locator('textarea[placeholder*="message"]').or(
          page.locator('input[placeholder*="message"]')
        ).first();
        
        if (await messageInput.isVisible()) {
          // Send test message
          await messageInput.fill('What is VortexCore?');
          
          // Find and click send button
          const sendButton = page.locator('button:has-text("Send")').or(
            page.locator('button[type="submit"]')
          ).first();
          
          if (await sendButton.isVisible()) {
            await sendButton.click();
            
            // Wait for response and capture any errors
            await page.waitForTimeout(5000);
            
            // Check for error messages
            const errorMessage = await page.locator('text*="I\'m sorry, I encountered an error"').first();
            
            if (await errorMessage.isVisible()) {
              console.log('❌ ISSUE CONFIRMED: AI chat returns error response');
              
              // Capture network requests to investigate
              const requests = [];
              page.on('request', req => requests.push({
                url: req.url(),
                method: req.method(),
                headers: req.headers()
              }));
              
              // Try another message to capture network activity
              await messageInput.fill('Test message');
              await sendButton.click();
              await page.waitForTimeout(3000);
              
              console.log('🌐 Network requests made during AI chat:');
              const aiRequests = requests.filter(req => 
                req.url.includes('ai-router') || 
                req.url.includes('functions/v1') ||
                req.url.includes('supabase')
              );
              
              aiRequests.forEach(req => {
                console.log(`   ${req.method} ${req.url}`);
              });
              
            } else {
              console.log('✅ AI chat responds normally');
            }
            
            await page.screenshot({ path: 'live-investigation-chat-response.png' });
          } else {
            console.log('❌ Send button not found');
          }
        } else {
          console.log('❌ Message input not found');
        }
      } else {
        console.log('❌ Chat interface did not open');
      }
    } else {
      console.log('❌ Chat button not found');
    }

    // Investigation 3: Console Errors
    console.log('\n🚨 CHECKING CONSOLE ERRORS...');
    const consoleMessages = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Reload page to capture any console errors
    await page.reload();
    await page.waitForTimeout(3000);
    
    if (consoleMessages.length > 0) {
      console.log('❌ Console errors found:');
      consoleMessages.forEach(msg => console.log(`   ERROR: ${msg}`));
    } else {
      console.log('✅ No console errors detected');
    }

    // Investigation 4: Environment Analysis
    console.log('\n🔧 ANALYZING ENVIRONMENT...');
    
    const envInfo = await page.evaluate(() => {
      return {
        location: window.location.href,
        userAgent: navigator.userAgent,
        // Try to access any exposed environment variables
        hasSupabaseUrl: typeof window.VITE_SUPABASE_URL !== 'undefined',
        hasSupabaseKey: typeof window.VITE_SUPABASE_ANON_KEY !== 'undefined',
      };
    });
    
    console.log('Environment info:', envInfo);

    console.log('\n✅ Investigation completed successfully!');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
    await page.screenshot({ path: 'live-investigation-error.png' });
  } finally {
    await browser.close();
  }
}

// Additional function to test AI endpoint directly
async function testAIEndpointDirectly() {
  console.log('\n🔍 TESTING AI ENDPOINT DIRECTLY...');
  
  try {
    const response = await fetch('https://vortexcore-one.vercel.app/functions/v1/ai-router', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
  } catch (error) {
    console.error('Direct API test failed:', error.message);
  }
}

// Run investigations
Promise.all([
  investigateLiveDeployment(),
  testAIEndpointDirectly()
]).then(() => {
  console.log('\n🎉 All investigations completed!');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});