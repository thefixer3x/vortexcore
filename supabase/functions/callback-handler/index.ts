import { createClient } from "npm:@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withPublicMiddleware } from "../_shared/middleware.ts";
import { createHash, timingSafeEqual } from "node:crypto";
// Constants
const MAX_REQUEST_SIZE = 102400; // 100KB in bytes
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS = 100;
// Rate limiting implementation using a simple in-memory store
const requestStore = new Map();
// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, encryption',
  'Access-Control-Max-Age': '86400'
};
// Utility functions
function validateBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split(' ')[1];
  const expectedToken = Deno.env.get('SAYSWITCH_SECRET_KEY');
  if (!expectedToken) {
    console.error('SAYSWITCH_SECRET_KEY not configured');
    return false;
  }
  return token === expectedToken;
}
function validateSignature(payload, signature) {
  const publicKey = Deno.env.get('SAYSWITCH_PUBLIC_KEY');
  if (!publicKey) {
    console.error('SAYSWITCH_PUBLIC_KEY not configured');
    return false;
  }
  const expectedSignature = createHash('sha512').update(payload).update(publicKey).digest('hex');
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
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
function sanitizeInput(input) {
  return {
    transactionId: String(input.transactionId || '').trim(),
    status: [
      'success',
      'failed',
      'pending'
    ].includes(input.status) ? input.status : 'pending',
    timestamp: new Date(input.timestamp || Date.now()).toISOString(),
    metadata: typeof input.metadata === 'object' ? input.metadata : {}
  };
}
async function verifyTransaction(reference) {
  try {
    const baseUrl = 'https://backendapi.sayswitchgroup.com/api/v1';
    const secretKey = Deno.env.get('SAYSWITCH_SECRET_KEY');
    if (!secretKey) {
      console.error('SAYSWITCH_SECRET_KEY not configured');
      return false;
    }
    const response = await fetch(`${baseUrl}/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      console.error('Transaction verification failed:', await response.text());
      return false;
    }
    const data = await response.json();
    return data.status === 'success';
  } catch (error) {
    console.error('Error verifying transaction:', error);
    return false;
  }
}
// Main handler
serve(withPublicMiddleware(async (req)=>{
  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }
    // Validate Bearer token
    const authHeader = req.headers.get('authorization');
    if (!validateBearerToken(authHeader)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid or missing Bearer token'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
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
    // Verify signature
    const signature = req.headers.get('encryption');
    if (!signature) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing signature'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get and validate payload
    const rawBody = await req.text();
    if (!validateSignature(rawBody, signature)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid signature'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    let payload;
    try {
      payload = sanitizeInput(JSON.parse(rawBody));
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Invalid payload format'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Verify transaction with SaySwitch API
    if (payload.metadata?.reference) {
      const isVerified = await verifyTransaction(payload.metadata.reference);
      if (!isVerified) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Transaction verification failed'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // Initialize Supabase client
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: {
        persistSession: false
      }
    });
    // Process the callback
    const { data, error } = await supabaseClient.from('callbacks').insert([
      {
        transaction_id: payload.transactionId,
        status: payload.status,
        timestamp: payload.timestamp,
        metadata: payload.metadata
      }
    ]);
    if (error) {
      throw error;
    }
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Callback processed successfully',
      data: data
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error processing callback:', error);
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
}));
