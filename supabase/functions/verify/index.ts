import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { withAuthMiddleware } from "../_shared/middleware.ts";
const SAYSWITCH_BASE_URL = Deno.env.get('SAYSWITCH_BASE_URL') || 'https://backendapi.sayswitchgroup.com/api/v1';
const SAYSWITCH_SECRET_KEY = Deno.env.get('SAYSWITCH_SECRET_KEY') || '';
serve(withAuthMiddleware(async (req, { auth })=>{
  try {
    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');
    if (!reference) {
      return new Response(JSON.stringify({ success: false, message: 'Reference is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
      auth: { persistSession: false }
    });
    // Only the owner of the transaction may verify it.
    const { data: owned } = await supabaseClient.from('transactions').select('id').eq('reference', reference).eq('user_id', auth.userId).maybeSingle();
    if (!owned) {
      return new Response(JSON.stringify({ success: false, message: 'Transaction not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    // Verify transaction with SaySwitch API
    const response = await fetch(`${SAYSWITCH_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        'Authorization': `Bearer ${SAYSWITCH_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify transaction');
    }
    await supabaseClient.from('transactions').update({
      status: data.status,
      metadata: {
        ...data,
        verified_at: new Date().toISOString()
      }
    }).eq('id', owned.id);
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return new Response(JSON.stringify({ success: false, message: 'Unable to verify transaction' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}, ['GET']));
