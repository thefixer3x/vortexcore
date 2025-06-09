
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://auth.vortexcore.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, email, code, factorId } = await req.json();
    
    console.log(`Auth function called with action: ${action}`);
    
    switch (action) {
      case 'setup-2fa':
        // Set up 2FA for a user
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required for 2FA setup' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const { data: factorData, error: factorError } = await supabase.auth.admin.mfaEnroll({
          factorType: 'totp',
          email: email
        });
        
        if (factorError) {
          console.error('Error setting up 2FA:', factorError);
          return new Response(
            JSON.stringify({ error: factorError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        return new Response(
          JSON.stringify({ data: factorData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'verify-2fa':
        // Verify a 2FA code
        if (!code || !factorId) {
          return new Response(
            JSON.stringify({ error: 'Code and factor ID are required for 2FA verification' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const { data: verifyData, error: verifyError } = await supabase.auth.admin.mfaVerify({
          factorId: factorId,
          code: code
        });
        
        if (verifyError) {
          console.error('Error verifying 2FA:', verifyError);
          return new Response(
            JSON.stringify({ error: verifyError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        return new Response(
          JSON.stringify({ data: verifyData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'get-auth-settings':
        // Return current auth provider settings
        const { data: settings, error: settingsError } = await supabase
          .from('auth_settings')
          .select('*')
          .single();
        
        if (settingsError) {
          console.error('Error getting auth settings:', settingsError);
          return new Response(
            JSON.stringify({ error: settingsError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        return new Response(
          JSON.stringify({ data: settings }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in auth function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
