import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getRedirectUrl } from '@/utils/auth-config';

export function useAuthFix() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      // First, try to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
          emailRedirectTo: getRedirectUrl('/dashboard'),
        },
      });

      if (error) {
        // Check if user already exists
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account exists",
            description: "Please sign in instead",
            variant: "destructive",
          });
          return { success: false, error: 'User already exists' };
        }
        throw error;
      }

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        toast({
          title: "Check your email",
          description: "Please confirm your email to continue",
        });
        return { success: true, requiresConfirmation: true };
      }

      // Auto sign in if email confirmation is disabled
      if (data?.session) {
        toast({
          title: "Welcome!",
          description: "Your account has been created",
        });
        navigate('/dashboard');
        return { success: true, user: data.user, session: data.session };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password",
            variant: "destructive",
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email not confirmed",
            description: "Please check your email to confirm your account",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return { success: false, error: error.message };
      }

      if (data?.session) {
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully",
        });
        navigate('/dashboard');
        return { success: true, user: data.user, session: data.session };
      }

      return { success: false, error: 'No session created' };
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You've been signed out successfully",
      });
      navigate('/');
    } catch (error: any) {
      console.error('Signout error:', error);
      toast({
        title: "Signout failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl('/reset-password'),
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Please check your email for the reset link",
      });
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Password reset failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}
