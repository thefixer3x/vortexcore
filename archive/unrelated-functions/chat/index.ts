import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { OpenAI } from 'npm:openai@4.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });
    const { messages } = await req.json();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Nixie, an empathetic and intelligent AI learning companion. You help users learn and understand complex topics through engaging dialogue and personalized guidance.'
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
  } catch (error) {
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
