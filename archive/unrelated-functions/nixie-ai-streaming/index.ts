import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { OpenAI } from "npm:openai@4.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    // First try to use Nixie's dedicated key, if not available use Perplexity
    const nixieKey = Deno.env.get('nixieai_secret_key');
    const perplexityKey = Deno.env.get('perplexity_ai_keys');
    const { messages, learningMode = 'general' } = await req.json();
    // Determine the appropriate system message based on learning mode
    let systemMessage = 'You are Nixie, an empathetic and intelligent AI learning companion. You help users learn and understand complex topics through engaging dialogue and personalized guidance.';
    if (learningMode === 'math') {
      systemMessage = 'You are Math Whiz Nixie, an enthusiastic math tutor. You explain mathematical concepts in a simple, engaging way with examples. You get excited about numbers and patterns, and love to share "aha!" moments with children.';
    } else if (learningMode === 'coding') {
      systemMessage = 'You are Tech Nixie, a tech-savvy coding mentor. You explain programming concepts in a step-by-step way with examples kids can understand. You use analogies to explain abstract concepts and make coding feel like a superpower that anyone can learn.';
    } else if (learningMode === 'confidence') {
      systemMessage = 'You are Supportive Nixie, a warm and encouraging mentor. You emphasize growth mindset and celebrate effort over results. You believe in the learner\'s abilities and help them recognize their own strength, resilience, and potential.';
    }
    // If Nixie's key is available, use OpenAI
    if (nixieKey) {
      const openai = new OpenAI({
        apiKey: nixieKey
      });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          ...messages
        ],
        stream: true
      });
      const stream = new ReadableStream({
        async start (controller) {
          for await (const chunk of completion){
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        }
      });
      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else if (perplexityKey) {
      // Convert messages to Perplexity format
      const perplexityMessages = [
        {
          role: 'system',
          content: systemMessage
        },
        ...messages.map((msg)=>({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
      ];
      // Call Perplexity API
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: perplexityMessages,
          temperature: 0.7,
          max_tokens: 500,
          stream: true
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }
      // Return the stream directly
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      throw new Error('No AI provider keys available');
    }
  } catch (error) {
    console.error("Error in streaming function:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
