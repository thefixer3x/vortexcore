import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `You are VortexAI, the embedded digital banker inside the VortexCore app.
Be concise, proactive, and analytics-driven. Always reply in first-person.
End with one actionable recommendation when appropriate.`;

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (!LOVABLE_API_KEY) throw new Error('AI gateway not configured');

    const { prompt, history } = await req.json().catch(() => ({}));
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(Array.isArray(history) ? history.slice(-8) : []),
      { role: 'user', content: prompt },
    ];

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error('Gateway error:', aiRes.status, t);
      return new Response(JSON.stringify({ error: `AI error ${aiRes.status}` }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiRes.json();
    const response: string = data?.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('openai-chat error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Processing error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
