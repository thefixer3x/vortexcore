#!/usr/bin/env node
/**
 * Test production fixes for both biometric auth and AI chat
 */

const { chromium } = require('playwright');

async function testProductionFixes() {
  console.log('🧪 Testing production fixes...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('📄 Navigating to live deployment...');
    await page.goto('https://vortexcore-one.vercel.app/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Test 1: Verify Biometric Button is Hidden in Production
    console.log('\n🔐 TEST 1: Biometric Authentication Fix');
    
    const biometricButton = page.locator('button:has-text("Biometric")').or(
      page.locator('button:has-text("Continue with Biometrics")')
    ).first();
    
    const isVisible = await biometricButton.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log('✅ SUCCESS: Biometric button is hidden in production');
    } else {
      console.log('❌ FAILED: Biometric button is still visible in production');
      await page.screenshot({ path: 'test-biometric-still-visible.png' });
    }
    
    // Test 2: Test AI Chat with Better Error Handling
    console.log('\n🤖 TEST 2: AI Chat Error Handling');
    
    // Look for chat button
    const chatButton = page.locator('button[class*="rounded-full"]').first();
    
    if (await chatButton.isVisible()) {
      console.log('✅ Found chat button');
      
      // Scroll to chat button and wait for it to be stable
      await chatButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Try to click with force
      try {
        await chatButton.click({ force: true });
        console.log('✅ Chat interface opened');
        
        await page.waitForTimeout(2000);
        
        // Check if chat interface is visible
        const chatInterface = page.locator('text=VortexAI Assistant').first();
        
        if (await chatInterface.isVisible()) {
          console.log('✅ Chat interface is visible');
          
          // Find message input
          const messageInput = page.locator('textarea[placeholder*="message"]').first();
          
          if (await messageInput.isVisible()) {
            console.log('✅ Message input found');
            
            // Send test message
            await messageInput.fill('What is VortexCore?');
            
            // Find and click send button
            const sendButton = page.locator('button:has-text("Send")').first();
            
            if (await sendButton.isVisible()) {
              console.log('✅ Send button found, sending message...');
              await sendButton.click();
              
              // Wait for response and check error message quality
              await page.waitForTimeout(5000);
              
              // Look for improved error message
              const improvedErrorMessage = page.locator('text*="AI assistant is temporarily unavailable"').or(
                page.locator('text*="Our team is working to restore service"')
              ).first();
              
              const oldErrorMessage = page.locator('text*="I\'m sorry, I encountered an error while processing"').first();
              
              if (await improvedErrorMessage.isVisible()) {
                console.log('✅ SUCCESS: Improved error message is showing');
                console.log('   Message shows user-friendly explanation');
              } else if (await oldErrorMessage.isVisible()) {
                console.log('⚠️  OLD ERROR MESSAGE: Still showing generic error');
                console.log('   Fix may not have been deployed yet');
              } else {
                console.log('🤔 UNEXPECTED: Different response received');
                // Take screenshot to see what happened
                await page.screenshot({ path: 'test-ai-chat-unexpected.png' });
              }
              
            } else {
              console.log('❌ Send button not found');
            }
          } else {
            console.log('❌ Message input not found');
          }
        } else {
          console.log('❌ Chat interface did not open properly');
        }
        
      } catch (clickError) {
        console.log('❌ Failed to click chat button:', clickError.message);
        
        // Try alternative approach - maybe button is covered
        try {
          await page.evaluate(() => {
            const buttons = document.querySelectorAll('button[class*="rounded-full"]');
            if (buttons.length > 0) {
              buttons[0].click();
            }
          });
          console.log('✅ Chat button clicked via JavaScript');
        } catch (jsError) {
          console.log('❌ JavaScript click also failed:', jsError.message);
        }
      }
    } else {
      console.log('❌ Chat button not found');
    }
    
    await page.screenshot({ path: 'test-production-fixes-final.png' });
    console.log('📸 Final screenshot saved');
    
    console.log('\n🎉 Production fix testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-production-fixes-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testProductionFixes().then(() => {
  console.log('🏁 Test execution completed');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});