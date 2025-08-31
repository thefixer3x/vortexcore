import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withPublicMiddleware } from "../_shared/middleware.ts";
import OpenAI from 'npm:openai@4.11.0'
import { askPerplexity } from './providers/perplexity.ts'

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

// Initialize OpenAI with more robust API key handling
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
if (!OPENAI_API_KEY) {
  // Fail cold-start instead of allowing runtime surprises
  throw new Error('Missing OPENAI_API_KEY');
}
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  // Guard against slow upstreams
  timeout: 15000,
});

// Check if Perplexity API key is available
const hasPerplexityKey = !!Deno.env.get('PERPLEXITY_API_KEY');
if (!hasPerplexityKey) {
  console.warn("WARNING: Missing PERPLEXITY_API_KEY environment variable - fallback will not work");
}

// Detect if the response is a fallback ("I don't have real-time data")
function isFallback(text: string) {
  return /i (don'?t|do not) (have|possess).+real[- ]?time/i.test(text);
}

// Helper to try OpenAI as primary provider
async function callOpenAI(messages: any[]) {
  try {
    console.log("Calling OpenAI (message_count)", messages.length);
    
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

// Main router function with fallback implementation
serve(withPublicMiddleware(async (req) => {
  try {
    // Extract request data
    const body = await req.json();
    console.log("Request received", {
      wantRealtime: !!body?.wantRealtime,
      msgCount: Array.isArray(body?.messages) ? body.messages.length : 0,
    });
    // Extract messages and options
    const { messages, wantRealtime } = body;
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Missing or invalid 'messages' array in request body");
    }
    const allowedRoles = new Set(['system', 'user', 'assistant', 'tool']);
    for (const m of messages) {
      if (!m || !allowedRoles.has(m.role)) {
        throw new Error("Invalid message role");
      }
      if (typeof m.content !== 'string') {
        throw new Error("Only string message.content is supported");
      }
    }

    // Trim chat history to stay within token limits
    const recentMessages = messages.slice(-5);

    // Sanitize user messages
    const sanitizedMessages = recentMessages.map(msg => {
      if (msg.role === 'user' && typeof msg.content === 'string') {
        return { ...msg, content: stripPII(msg.content) };
      }
      return msg;
    });
    
    
    // Add system prompt to conversation
    const conversation = [
      { role: 'system', content: VORTEX_SYSTEM_PROMPT }, 
      ...sanitizedMessages
    ];

    // First try OpenAI
    const openaiResult = await callOpenAI(conversation);
    
    // If OpenAI succeeds, return the response
    if (openaiResult.success) {
      // Check if the response is a fallback and we want realtime data
      const response = openaiResult.response;
      if (wantRealtime && isFallback(response) && hasPerplexityKey) {
        console.log("OpenAI returned fallback response, trying Perplexity for real-time data");
        
        // Get the last user message for Perplexity
        const lastUserMessage = sanitizedMessages
          .filter(msg => msg.role === 'user')
          .pop()?.content || '';
        
        try {
          // Call Perplexity for real-time data
          const perplexityStream = await askPerplexity(lastUserMessage);
          
          // Return the stream directly for streaming responses
          return new Response(perplexityStream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
              "X-Accel-Buffering": "no"
            }
          });
        } catch (perplexityError) {
          console.error("Perplexity fallback failed:", perplexityError);
          // Continue with OpenAI response if Perplexity fails
        }
      }
      
      // Format the OpenAI response to match VortexAI brand voice
      const formattedResponse = formatResponse(response);
      
      return new Response(JSON.stringify({
        response: formattedResponse,
        provider: "openai"
      }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*"
        },
        status: 200
      });
    
    // If OpenAI fails and we have Perplexity API key, try Perplexity as fallback
    if (!openaiResult.success && hasPerplexityKey) {
      console.log("OpenAI failed, trying Perplexity as fallback");
      
      // Get the last user message for Perplexity
      const lastUserMessage = sanitizedMessages
        .filter(msg => msg.role === 'user')
        .pop()?.content || '';
      
      try {
        // Call Perplexity
        const perplexityStream = await askPerplexity(lastUserMessage);
        
        // Return the stream directly for streaming responses
        return new Response(perplexityStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
          }
        });
      } catch (perplexityError) {
        console.error("Perplexity fallback failed:", perplexityError);
        throw new Error("All AI providers failed");
      }
    }

    // If OpenAI failed and Perplexity is unavailable or failed above
    return new Response(JSON.stringify({
      error: openaiResult.error || "All AI providers failed"
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 502
    });
  } catch (error) {
    console.error("Router error:", error);
    return new Response(JSON.stringify({
      error: error?.message || "Processing error"
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}));
