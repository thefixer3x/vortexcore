
import { useState, useEffect } from 'react';
import { Provider } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type AuthProvider = 'google' | 'instagram' | 'twitter' | 'linkedin' | 'email' | '2fa';

export function useAuthProviders() {
  const [loading, setLoading] = useState(false);
  
  const signInWithProvider = async (provider: Provider) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: "https://api.lanonasis.com/auth/callback?return_to=vortexcore",
          queryParams: {
            redirect_to: 'https://auth.vortexcore.app'
          }
        }
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      toast({
        title: "Authentication Error",
        description: error.message || `Failed to sign in with ${provider}`,
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  const setupTwoFactorAuth = async (email: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('auth', {
        body: { action: 'setup-2fa', email }
      });
      
      if (response.error) throw new Error(response.error);
      
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      toast({
        title: "2FA Setup Error",
        description: error.message || "Failed to set up two-factor authentication",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  const verifyTwoFactorAuth = async (factorId: string, code: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('auth', {
        body: { action: 'verify-2fa', factorId, code }
      });
      
      if (response.error) throw new Error(response.error);
      
      return { data: response.data, error: null };
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: "2FA Verification Error",
        description: error.message || "Failed to verify two-factor authentication code",
        variant: "destructive"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    signInWithGoogle: () => signInWithProvider('google'),
    // Use a function to cast instagram to Provider type since it's not directly in the Provider type
    signInWithInstagram: () => signInWithProvider('instagram' as unknown as Provider),
    signInWithTwitter: () => signInWithProvider('twitter'),
    signInWithLinkedIn: () => signInWithProvider('linkedin_oidc'),
    setupTwoFactorAuth,
    verifyTwoFactorAuth
  };
}
