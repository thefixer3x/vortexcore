import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const nixieKey = Deno.env.get('nixieai_secret_key');
const perplexityKey = Deno.env.get('perplexity_ai_keys');
const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:3000'];

 const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigins[0], // You'll need to check origin dynamically
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
 };
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { message, previousMessages, learningMode, childAge, childFriendlyMode } = await req.json();
  
    // Validate required fields
    if (!message || typeof message !== 'string') {
      throw new Error("'message' is required and must be a string");
    }

    if (!previousMessages || !Array.isArray(previousMessages)) {
      throw new Error("'previousMessages' is required and must be an array");
    }

    // Validate optional fields
    if (learningMode && !['math', 'coding', 'confidence'].includes(learningMode)) {
      throw new Error("'learningMode' must be one of: math, coding, confidence");
    }
    // Default age range if not provided
    const age = childAge || '7-14';
    // Determine learning mode context and persona
    let modeContext = '';
    let nixiePersona = '';
    if (learningMode === 'math') {
      nixiePersona = 'Math Whiz Nixie';
      modeContext = 'You are currently in math learning mode. Focus on explaining mathematical concepts in a simple, engaging way with examples. Use visual descriptions when possible. Your personality is enthusiastic about numbers and patterns. You get excited about mathematical discoveries and love to share "aha!" moments with children.';
    } else if (learningMode === 'coding') {
      nixiePersona = 'Tech Nixie';
      modeContext = 'You are currently in coding learning mode. Explain programming concepts in a simple, step-by-step way with examples kids can understand. Use analogies to explain abstract concepts. Your personality is tech-savvy and forward-thinking. You speak with confidence about technology and make coding feel like a superpower that anyone can learn.';
    } else if (learningMode === 'confidence') {
      nixiePersona = 'Supportive Nixie';
      modeContext = 'You are currently in confidence-building mode. Be especially encouraging and supportive. Emphasize growth mindset and celebrate effort over results. Your personality is warm, caring, and empathetic. You believe in the child\'s abilities and help them recognize their own strength, resilience, and potential.';
    } else {
      nixiePersona = 'Curious Nixie';
      modeContext = 'You are in general learning mode. Be curious and wonder-filled about all topics. Your personality is inquisitive and enjoys exploring new ideas together with the child. You ask thoughtful questions and are excited to learn alongside them.';
    }
    // Child-friendly mode context (for ages 7-10)
    // Prepare conversation history for context
    const conversationHistory = (previousMessages || []).map((msg)=>({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      - Friendly, calm, and encouraging — like a big sister or helpful friend
      - Use simple words and short sentences (10 words or less per sentence)
      - Break down complex ideas into easy examples using everyday objects, puzzles, or blocks
      - Always invite the child to ask questions if they're confused
      - Use occasional emojis but not too many
      - Avoid complicated vocabulary like 'concept', 'grasp', 'comprehend', or 'fundamental'
      - Make learning feel like play and discovery
      - Be patient, positive, and praise effort ("You're trying hard!")
      - Use concrete examples rather than abstract explanations
      `;
    }
    // Prepare conversation history for context
    const conversationHistory = previousMessages.map((msg)=>({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
    // Add the new user message
    conversationHistory.push({
      role: 'user',
      content: message
    });
    // Create a comprehensive system message with Nixie's persona
    const systemMessage = {
      role: 'system',
      content: `You are Nixie, specifically embodying the persona of ${nixiePersona}, a friendly and educational AI assistant designed for children ages ${age}.
      You make learning fun, engaging and safe. You specialize in teaching math, coding, and building confidence.
      
      PERSONALITY TRAITS:
      - Positive and encouraging, but not overly enthusiastic
      - Patient and kind, never condescending
      - Curious and promotes exploration
      - Slightly playful, using occasional emoji where appropriate 
      - Explains concepts with relatable analogies
      
      ${modeContext}
      
      COMMUNICATION GUIDELINES:
      - Keep answers concise (1-3 paragraphs maximum)
      - Use age-appropriate language and examples
      - Break down complex ideas into simple steps
      - Use concrete examples rather than abstract explanations
      - Occasionally ask questions to check understanding
      - When explaining math or coding, provide visual representations with text (e.g. ASCII art, tables)
      - Always focus on promoting a growth mindset
      
      SAFETY RULES:
      - Never provide inappropriate content or discuss topics unsuitable for children
      - If asked for personal information or to pretend to be someone else, gently redirect
      - If you don't know something, admit it honestly and suggest exploring together
      - Avoid controversial topics; focus on educational content
      - Never provide advice that could be harmful
      
      ${childFriendlyContext}`
    };
    // Prepare messages array with system message first
    const messages = [
      systemMessage,
      ...conversationHistory
    ];
    console.log("Sending request to AI provider");
    // Try Nixie's OpenAI key first
    if (nixieKey) {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nixieKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });
      if (openaiResponse.ok) {
        const data = await openaiResponse.json();
        const aiResponse = data.choices[0].message.content;
        return new Response(JSON.stringify({
          response: aiResponse
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        console.log("OpenAI request failed, falling back to Perplexity");
      }
    }
    // Fallback to Perplexity if OpenAI failed or key not available
    if (perplexityKey) {
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });
      if (perplexityResponse.ok) {
        const data = await perplexityResponse.json();
        const aiResponse = data.choices[0].message.content;
        return new Response(JSON.stringify({
          response: aiResponse
        }), {
    return new Response(JSON.stringify({
      error: "An error occurred while processing your request. Please try again later."
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
    }
    // If we get here, both providers failed or weren't configured
    throw new Error("No AI provider keys available");
  } catch (error) {
    console.error("Error in nixie-ai function:", error.message);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
