import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { createHash } from "node:crypto";
// Constants and configurations
const SAYSWITCH_BASE_URL = Deno.env.get('SAYSWITCH_BASE_URL') || 'https://backendapi.sayswitchgroup.com/api/v1';
const SAYSWITCH_PUBLIC_KEY = Deno.env.get('SAYSWITCH_PUBLIC_KEY');
const SAYSWITCH_SECRET_KEY = Deno.env.get('SAYSWITCH_SECRET_KEY');
const MAX_REQUEST_SIZE = 102400; // 100KB
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100;
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
// Rate limiting
const requestStore = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const record = requestStore.get(ip);
  if (!record) {
    requestStore.set(ip, {
      count: 1,
      timestamp: now
    });
    return true;
  }
  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    requestStore.set(ip, {
      count: 1,
      timestamp: now
    });
    return true;
  }
  if (record.count >= MAX_REQUESTS) {
    return false;
  }
  record.count++;
  return true;
}
function validatePaymentRequest(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid request format');
  }
  if (!payload.email || !payload.email.includes('@')) {
    throw new Error('Valid email is required');
  }
  const amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Valid amount is required');
  }
  return {
    email: payload.email.trim(),
    amount: amount.toFixed(2),
    currency: payload.currency?.toUpperCase() || 'NGN',
    reference: payload.reference || crypto.randomUUID(),
    callback: payload.callback,
    metadata: payload.metadata || {}
  };
}
function generateSignature(payload) {
  if (!SAYSWITCH_PUBLIC_KEY) {
    throw new Error('SAYSWITCH_PUBLIC_KEY not configured');
  }
  const sortedPayload = Object.keys(payload).sort().reduce((acc, key)=>{
    acc[key] = payload[key];
    return acc;
  }, {});
  return createHash('sha512').update(JSON.stringify(sortedPayload)).update(SAYSWITCH_PUBLIC_KEY).digest('hex');
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }
    if (!SAYSWITCH_SECRET_KEY) {
      throw new Error('SAYSWITCH_SECRET_KEY not configured');
    }
    // Check request size
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > MAX_REQUEST_SIZE) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Request payload too large'
      }), {
        status: 413,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Rate limit exceeded'
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const rawPayload = await req.json();
    const payload = validatePaymentRequest(rawPayload);
    // Set default callback URL if not provided
    if (!payload.callback) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      payload.callback = `${supabaseUrl}/functions/v1/callback-handler`;
    }
    // Generate HMAC signature
    const signature = generateSignature(payload);
    // Make request to SaySwitch API
    const response = await fetch(`${SAYSWITCH_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SAYSWITCH_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Encryption': signature
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to initialize payment');
    }
    // Store transaction in database
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: {
        persistSession: false
      }
    });
    const { error: dbError } = await supabaseClient.from('transactions').insert([
      {
        reference: payload.reference,
        email: payload.email,
        amount: payload.amount,
        currency: payload.currency,
        status: 'pending',
        metadata: {
          ...data,
          request: payload
        }
      }
    ]);
    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store transaction');
    }
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
    console.error('Error processing payment:', error);
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
