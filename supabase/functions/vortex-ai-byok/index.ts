import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ENC_KEY_RAW = Deno.env.get('VORTEX_BYOK_ENCRYPTION_KEY') ?? '';
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const VORTEX_SYSTEM_PROMPT = `You are VortexAI, the embedded digital banker inside the VortexCore app.
Tone: concise, proactive, analytics-driven. Reply in first-person.`;

async function getKey(): Promise<CryptoKey> {
  if (!ENC_KEY_RAW) throw new Error('VORTEX_BYOK_ENCRYPTION_KEY not configured');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ENC_KEY_RAW));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function decrypt(b64: string): Promise<string> {
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const key = await getKey();
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

/**
 * Premium-only proxy that routes a chat completion through the user's own
 * OpenAI key when one is connected. Falls back to Lovable AI Gateway if no
 * key is on file or the key is rejected.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) throw new Error('Missing auth');

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) throw new Error('Unauthorized');
    const userId = userRes.user.id;

    const { messages, model: modelOverride } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Missing 'messages'" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const conversation = [
      { role: 'system', content: VORTEX_SYSTEM_PROMPT },
      ...messages.slice(-8).map((m: any) => ({
        role: m.role === 'tool' ? 'assistant' : m.role,
        content: typeof m.content === 'string' ? m.content : String(m.content ?? ''),
      })),
    ];

    // 1) Try user's own OpenAI key
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: cred } = await admin
      .schema('app_vortexcore')
      .from('vortex_user_ai_credentials')
      .select('encrypted_key, status')
      .eq('user_id', userId)
      .eq('provider', 'openai')
      .maybeSingle();

    if (cred?.encrypted_key && cred.status === 'active') {
      try {
        const apiKey = await decrypt(cred.encrypted_key);
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelOverride ?? 'gpt-4o-mini', messages: conversation }),
        });
        if (oaiRes.ok) {
          const data = await oaiRes.json();
          return new Response(
            JSON.stringify({
              response: data?.choices?.[0]?.message?.content ?? '',
              provider: 'openai-byok',
              model: data?.model,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        console.warn('BYOK call failed, falling back to Lovable AI', oaiRes.status);
        if (oaiRes.status === 401) {
          await admin
            .schema('app_vortexcore')
            .from('vortex_user_ai_credentials')
            .update({ status: 'invalid' })
            .eq('user_id', userId)
            .eq('provider', 'openai');
        }
      } catch (e) {
        console.error('BYOK decrypt/call error', e);
      }
    }

    // 2) Fallback → Lovable AI Gateway
    if (!LOVABLE_API_KEY) throw new Error('AI gateway not configured');
    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'google/gemini-2.5-flash', messages: conversation }),
    });
    const data = await aiRes.json();
    return new Response(
      JSON.stringify({
        response: data?.choices?.[0]?.message?.content ?? '',
        provider: 'lovable-ai',
        model: 'google/gemini-2.5-flash',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('vortex-ai-byok error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});