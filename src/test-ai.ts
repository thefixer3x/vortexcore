// Test script for AI functions
import { supabase } from './src/integrations/supabase/client';

async function testAI() {
  try {
    console.log("Testing OpenAI function...");
    const openaiResult = await supabase.functions.invoke("openai-assistant", {
      body: { 
        prompt: "What are the key principles of financial planning?", 
        history: [],
        model: "gpt-4o-mini"
      }
    });
    
    console.log("OpenAI response:", openaiResult);
    
    console.log("\nTesting Gemini function...");
    const geminiResult = await supabase.functions.invoke("gemini-ai", {
      body: { 
        prompt: "What are the key principles of financial planning?", 
        history: [],
        model: "gemini-pro"
      }
    });
    
    console.log("Gemini response:", geminiResult);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testAI();
