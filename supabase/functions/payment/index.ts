import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuthMiddleware } from "../_shared/middleware.ts";
import { createClient } from "../_shared/supabase-client.ts";
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
function validatePaymentRequest(payload, callerEmail) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid request format');
  }
  if (!callerEmail) {
    throw new Error('Your account has no email address');
  }
  const amount = Number(payload.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Valid amount is required');
  }
  return {
    // Payment notices always go to the signed-in caller's own email.
    email: callerEmail,
    amount: amount.toFixed(2),
    currency: payload.currency?.toUpperCase() || 'NGN',
    // References are generated server-side and callbacks are fixed, never caller-chosen.
    reference: crypto.randomUUID(),
    callback: `${Deno.env.get('SUPABASE_URL')}/functions/v1/callback-handler`,
    metadata: (payload.metadata && typeof payload.metadata === 'object') ? payload.metadata : {}
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
serve(withAuthMiddleware(async (req, { auth })=>{
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
    const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('VORTEX_SUPABASE_SECRET_KEY') ?? '', { auth: { persistSession: false } });
    const { data: caller } = await adminClient.auth.admin.getUserById(auth.userId);
    const payload = validatePaymentRequest(rawPayload, caller?.user?.email);
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
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('VORTEX_SUPABASE_SECRET_KEY') ?? '', {
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
      message: 'Unable to process payment'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}, ['POST']));
