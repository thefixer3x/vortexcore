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
      throw openAIResult.error;
    }

    if (!openAIResult.data || !openAIResult.data.response) {
      throw new Error('OpenAI function did not return a response');
    }

    console.log('✅ OpenAI Test Succeeded:', openAIResult.data.response.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ OpenAI Test Error:', error);
    throw error;
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
      throw geminiResult.error;
    }

    if (!geminiResult.data || !geminiResult.data.response) {
      throw new Error('Gemini function did not return a response');
    }

    console.log('✅ Gemini Test Succeeded:', geminiResult.data.response.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Gemini Test Error:', error);
    throw error;
  }
  
  // 2. Test authentication
  console.log('\n📝 Testing Supabase Authentication');
  try {
    // Get the current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!sessionData.session) {
      throw new Error('No active session - user is not authenticated');
    }

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
      throw authOpenAIResult.error;
    }

    if (!authOpenAIResult.data || !authOpenAIResult.data.response) {
      throw new Error('Authenticated OpenAI call returned no response');
    }

    console.log('✅ Authenticated OpenAI Test Succeeded:', authOpenAIResult.data.response.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Authentication Test Error:', error);
    throw error;
  }
  
  console.log('\n🏁 AI Function Tests Complete');
}

// Run the tests
testAIFunctions().catch(() => {
  process.exitCode = 1;
});
