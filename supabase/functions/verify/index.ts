import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
const SAYSWITCH_BASE_URL = 'https://backendapi.sayswitchgroup.com/api/v1';
const SAYSWITCH_SECRET_KEY = 'sk_test_cj7lm66wbus6y7pfaj6vz0xgz13behcjeccc7hv';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');
    if (!reference) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Reference is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Verify transaction with SaySwitch API
    const response = await fetch(`${SAYSWITCH_BASE_URL}/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${SAYSWITCH_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify transaction');
    }
    // Update transaction status in database
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: {
        persistSession: false
      }
    });
    await supabaseClient.from('transactions').update({
      status: data.status,
      metadata: {
        ...data,
        verified_at: new Date().toISOString()
      }
    }).eq('reference', reference);
    return new Response(JSON.stringify({
      success: true,
      data: data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Internal server error',
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
