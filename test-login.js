/**
 * Test login script to create a user session for testing
 */

import { supabase } from './src/integrations/supabase/client';

// Test function to check login functionality
async function testLogin() {
  console.log('🧪 Testing Supabase Login Functionality');
  
  // Use environment variables or provide test credentials
  const email = process.env.TEST_EMAIL || 'test@vortexcore.app';
  const password = process.env.TEST_PASSWORD || 'testpassword123';
  
  try {
    console.log(`📝 Attempting to sign in with email: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Login Failed:', error);
    } else if (data.session) {
      console.log('✅ Login Successful');
      console.log('User:', data.user.email);
      console.log('Session expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
      
      // Show partial access token for verification
      const partialToken = data.session.access_token.substring(0, 10) + '...';
      console.log('Access Token (partial):', partialToken);
      
      // Test a protected function to verify authentication is working
      console.log('\n📝 Testing authenticated function call');
      const { data: funcData, error: funcError } = await supabase.functions.invoke('openai-assistant', {
        body: { prompt: 'Test authenticated message', history: [] },
        headers: {
          Authorization: `Bearer ${data.session.access_token}`
        }
      });
      
      if (funcError) {
        console.error('❌ Authenticated Function Test Failed:', funcError);
      } else {
        console.log('✅ Authenticated Function Test Succeeded');
      }
    }
  } catch (e) {
    console.error('❌ Unexpected Error:', e);
  }
}

// Run the test
testLogin();
