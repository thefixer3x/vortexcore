#!/usr/bin/env node
/**
 * Test AI endpoints to debug production issues
 */

async function testAIEndpoints() {
  console.log('🧪 Testing AI endpoint configurations...\n');
  
  const endpoints = [
    // Wrong URL (returns 404)
    'https://vortexcore-one.vercel.app/functions/v1/ai-router',
    
    // Correct Supabase URL format
    'https://mxtsdgkwzjzlttpotole.supabase.co/functions/v1/ai-router',
  ];
  
  const testPayload = {
    messages: [{ role: 'user', content: 'Hello, test message' }],
    model: 'gpt-4'
  };
  
  for (const endpoint of endpoints) {
    console.log(`📡 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log(`   Body: ${responseText.slice(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      
      if (response.ok) {
        console.log('   ✅ SUCCESS - This endpoint works!');
      } else {
        console.log('   ❌ FAILED - This endpoint has issues');
      }
      
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line
  }
}

testAIEndpoints().then(() => {
  console.log('🎉 Testing completed!');
}).catch(error => {
  console.error('💥 Test failed:', error);
});