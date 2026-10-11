import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";
import { withAuthMiddleware } from "../_shared/middleware.ts";

serve(withAuthMiddleware(async (req, { auth }) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase credentials');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, code, factorId } = await req.json();
    // Always act on the signed-in caller's own account; never a request-supplied email.
    const { data: caller } = await supabase.auth.admin.getUserById(auth.userId!);
    const email = caller?.user?.email;
    switch (action) {
      case 'setup-2fa': {
        if (!email) return new Response(JSON.stringify({ error: 'Your account has no email for 2FA setup' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        const { data, error } = await supabase.auth.admin.mfaEnroll({ factorType: 'totp', email });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
      }
      case 'verify-2fa': {
        if (!code || !factorId) return new Response(JSON.stringify({ error: 'Code and factor ID are required for 2FA verification' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        const owns = (caller?.user?.factors || []).some((f: any) => f.id === factorId);
        if (!owns) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        const { data, error } = await supabase.auth.admin.mfaVerify({ factorId, code });
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
      }
      case 'get-auth-settings': {
        const { data, error } = await supabase.from('auth_settings').select('*').single();
        if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } });
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('Error in auth function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, ['POST']));

