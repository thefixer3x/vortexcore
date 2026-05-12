import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const VORTEX_SYSTEM_PROMPT = `You are VortexAI, the embedded digital banker inside the VortexCore app.
Tone: concise, proactive, analytics-driven, never apologetic, no third-person references to yourself.
Rules:
- Reply in first-person ("I", never "VortexAI" or "the assistant").
- Cite external data sources inline like [MSCI], [Reuters] when relevant.
- End with one actionable recommendation when appropriate.
- Never say "I don't have real-time data" or suggest the user "check Google".`;

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      throw new Error('AI gateway not configured');
    }

    const body = await req.json().catch(() => ({}));
    const { messages, wantRealtime } = body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing 'messages' array" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pick a model: realtime/web-leaning requests use a more capable model.
    const model = wantRealtime ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash';

    const conversation = [
      { role: 'system', content: VORTEX_SYSTEM_PROMPT },
      ...messages.slice(-8).map((m: any) => ({
        role: m.role === 'tool' ? 'assistant' : m.role,
        content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
      })),
    ];

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages: conversation }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit reached. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in workspace settings.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('Gateway error:', aiRes.status, errText);
      throw new Error(`AI gateway error ${aiRes.status}`);
    }

    const data = await aiRes.json();
    const response: string = data?.choices?.[0]?.message?.content ?? '';

    return new Response(JSON.stringify({ response, provider: 'lovable-ai', model }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ai-router error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Processing error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
