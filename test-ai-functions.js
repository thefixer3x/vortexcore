/**
 * Test script to check AI functions and API access
 * This will test both authentication scenarios and API key access
 */

import { supabase } from './src/integrations/supabase/client';

// Test function to check both AI models
async function testAIFunctions() {
  console.log('🧪 Starting AI Function Tests');
  
  // 1. Test without authentication
  console.log('\n📝 Testing OpenAI without authentication');
  try {
    const openAIResult = await supabase.functions.invoke("openai-assistant", {
      body: { 
        prompt: "What is financial planning?", 
        history: [],
        model: "gpt-4o-mini"
      }
    });
    
    if (openAIResult.error) {
      console.error('❌ OpenAI Test Failed:', openAIResult.error);
    } else {
      console.log('✅ OpenAI Test Succeeded:', openAIResult.data.response.substring(0, 50) + '...');
    }
  } catch (error) {
    console.error('❌ OpenAI Test Error:', error);
  }
  
  console.log('\n📝 Testing Gemini without authentication');
  try {
    const geminiResult = await supabase.functions.invoke("gemini-ai", {
      body: { 
        prompt: "What is financial planning?", 
        history: [],
        model: "gemini-pro"
      }
    });
    
    if (geminiResult.error) {
      console.error('❌ Gemini Test Failed:', geminiResult.error);
    } else {
      console.log('✅ Gemini Test Succeeded:', geminiResult.data.response.substring(0, 50) + '...');
    }
  } catch (error) {
    console.error('❌ Gemini Test Error:', error);
  }
  
  // 2. Test authentication
  console.log('\n📝 Testing Supabase Authentication');
  try {
    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Check Failed:', sessionError);
    } else if (sessionData.session) {
      console.log('✅ User is authenticated:', sessionData.session.user.email);
      
      // Test with authentication
      console.log('\n📝 Testing OpenAI with authentication');
      const authOpenAIResult = await supabase.functions.invoke("openai-assistant", {
        body: { 
          prompt: "What is financial planning with authentication?", 
          history: [],
          model: "gpt-4o-mini"
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (authOpenAIResult.error) {
        console.error('❌ Authenticated OpenAI Test Failed:', authOpenAIResult.error);
      } else {
        console.log('✅ Authenticated OpenAI Test Succeeded:', 
          authOpenAIResult.data.response.substring(0, 50) + '...');
      }
    } else {
      console.log('⚠️ No active session - user is not authenticated');
    }
  } catch (error) {
    console.error('❌ Authentication Test Error:', error);
  }
  
  console.log('\n🏁 AI Function Tests Complete');
}

// Run the tests
testAIFunctions();
