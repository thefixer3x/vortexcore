import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ENC_KEY_RAW = Deno.env.get('VORTEX_BYOK_ENCRYPTION_KEY') ?? '';

/**
 * Derive a 256-bit AES-GCM key from the configured master secret.
 * The master secret should be a long random string stored in Supabase
 * Edge Function secrets — never in code, never in the database.
 */
async function getKey(): Promise<CryptoKey> {
  if (!ENC_KEY_RAW) throw new Error('VORTEX_BYOK_ENCRYPTION_KEY not configured');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ENC_KEY_RAW));
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encrypt(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return btoa(String.fromCharCode(...out));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) throw new Error('Missing auth');

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) throw new Error('Unauthorized');
    const userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const apiKey: string = (body.apiKey ?? '').trim();
    const label: string = (body.label ?? 'Personal OpenAI key').toString().slice(0, 64);

    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      return new Response(JSON.stringify({ error: 'Invalid OpenAI key format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the key works by hitting /v1/models
    const probe = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!probe.ok) {
      return new Response(
        JSON.stringify({ error: `OpenAI rejected the key (${probe.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const encrypted = await encrypt(apiKey);
    const hint = `••••${apiKey.slice(-4)}`;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { error: upErr } = await admin
      .schema('app_vortexcore')
      .from('vortex_user_ai_credentials')
      .upsert(
        {
          user_id: userId,
          provider: 'openai',
          label,
          encrypted_key: encrypted,
          key_hint: hint,
          status: 'active',
          last_verified_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' },
      );
    if (upErr) throw upErr;

    return new Response(
      JSON.stringify({ ok: true, provider: 'openai', label, key_hint: hint }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('connect-openai-key error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});