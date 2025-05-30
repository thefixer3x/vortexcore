import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import OpenAI from 'npm:openai@4.11.0'

// Define the VortexAI system contract
export const VORTEX_SYSTEM_PROMPT = `
You are **VortexAI**, the embedded digital banker inside the VortexCore app.
Tone: concise, proactive, analytics-driven, never apologetic, no third-person references to yourself
Always:
 • reply in first-person
 • cite data sources inline when they are external (e.g. [MSCI], [Reuters])
 • finish with 1 actionable recommendation (when relevant)
Forbidden:
 • "I don't have real-time data…"
 • generic suggestions to "check Google"
`;

// Log available env keys for debugging (this will be removed in production)
console.log("Available env variables:", Object.keys(Deno.env.toObject()));

// Initialize OpenAI with more robust API key handling
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY') || ''
});

// Validate that we have a valid API key
if (!Deno.env.get('OPENAI_API_KEY')) {
  console.error("CRITICAL ERROR: Missing OPENAI_API_KEY environment variable");
}

// Removed Gemini integration temporarily for simplified testing

// Detect if the response is a fallback ("I don't have real-time data")
function isFallback(text: string) {
  return /i (don'?t|do not) (have|possess).+real[- ]?time/i.test(text);
}

// Helper to try OpenAI as primary provider
async function callOpenAI(messages: any[]) {
  try {
    console.log("Calling OpenAI with messages:", JSON.stringify(messages).slice(0, 100) + "...");
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: messages, 
      max_tokens: 800,
    });
    
    return {
      success: true,
      response: completion.choices[0].message.content
    };
  } catch (e) { 
    console.error("OpenAI error:", e);
    return {
      success: false,
      error: e.message || "OpenAI API error"
    }; 
  }
}

// Post-process responses to match VortexAI brand voice
function formatResponse(text: string) {
  // Remove generic phrases like "According to my search"
  let processed = text.replace(/(according to my search|i found that|based on my search)/gi, '');
  
  // Convert citations to inline format if needed
  processed = processed.replace(/\[(.*?)\]\((.*?)\)/g, '[$1]');
  
  // Ensure first-person voice
  processed = processed.replace(/the assistant|vortexai/gi, 'I');
  
  // Add action recommendation if missing
  if (!processed.includes('recommend') && !processed.includes('suggestion')) {
    processed += "\n\nI recommend monitoring these trends closely for investment opportunities.";
  }
  
  return processed;
}

// Strip PII from user messages
function stripPII(message: string) {
  // Remove potential account numbers
  let sanitized = message.replace(/\b\d{10,16}\b/g, '[ACCOUNT]');
  
  // Remove potential credit card numbers
  sanitized = sanitized.replace(/\b(?:\d{4}[- ]?){3}\d{4}\b/g, '[CARD]');
  
  // Remove potential SSNs
  sanitized = sanitized.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[SSN]');
  
  return sanitized;
}

// Main router function with simplified implementation
serve(async (req) => {
  try {
    // Log request headers for debugging
    console.log("Request headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
    
    // Extract request data
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body).slice(0, 200) + "...");
    
    // Extract messages and options
    const { messages, wantRealtime } = body;
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Missing or invalid 'messages' array in request body");
    }
    
    // Trim chat history to stay within token limits
    const recentMessages = messages.slice(-5);
    
    // Sanitize user messages
    const sanitizedMessages = recentMessages.map(msg => 
      msg.role === 'user' 
        ? { ...msg, content: stripPII(msg.content) }
        : msg
    );
    
    // Add system prompt to conversation
    const conversation = [
      { role: 'system', content: VORTEX_SYSTEM_PROMPT }, 
      ...sanitizedMessages
    ];

    // For now, just use OpenAI directly while we debug the router
    const result = await callOpenAI(conversation);
    
    if (!result.success) {
      throw new Error(result.error || "Failed to get response from OpenAI");
    }
    
    // Format the response to match VortexAI brand voice
    const formattedResponse = formatResponse(result.response);
    
    return new Response(JSON.stringify({ 
      response: formattedResponse 
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Router error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Processing error",
      stack: error.stack
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
