
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "@/hooks/use-location";
import { LoginFormHeader } from "./LoginFormHeader";
import { EmailPasswordFields } from "./EmailPasswordFields";
import { LoginFormFooter } from "./LoginFormFooter";
import { TwoFactorVerification } from "./TwoFactorVerification";
import { useAuth } from "@/contexts/AuthContext";
import LogRocket from "logrocket";
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { identifyUser } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // If we have location data, include it in metadata
      const locationData = location.country ? {
        login_country: location.country,
        login_city: location.city
      } : undefined;
      
      // Log login attempt
      LogRocket.track('login_attempt', {
        method: 'email',
        location: location.country || 'unknown'
      });
      
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: undefined
        }
      });
      
      if (error) {
        console.error("Login error:", error);
        
        // Log failed login attempt
        LogRocket.track('login_failed', {
          method: 'email',
          reason: error.message,
          status: error.status
        });
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Invalid Credentials",
            description: "Please check your email and password and try again",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          });
        }
        
        setIsLoading(false);
        return;
      }
      if (data.user && data.session) {
        // Log successful login and identify user in LogRocket
        LogRocket.track('login_successful', {
          method: 'email',
          location: location.country || 'unknown'
        });
        
        // Identify user in our auth context
        identifyUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email
        });
        
        toast({
          title: "Login Successful",
          description: "Welcome back to VortexCore!"
        });
        navigate("/dashboard");
      } else {
        // Check if 2FA is required
        setShowTwoFactor(true);
      }
    } catch (error) {
      console.error("Login error:", error);
      // Log failed login attempt
      LogRocket.track('login_failed', {
        method: 'email',
        error: error.message || 'unknown_error'
      });
      
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  if (showTwoFactor) {
    return <TwoFactorVerification email={email} onCancel={() => setShowTwoFactor(false)} />;
  }
  return <div className="w-full max-w-md space-y-8 animate-fade-in">
      <LoginFormHeader />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <EmailPasswordFields email={email} setEmail={setEmail} password={password} setPassword={setPassword} />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" checked={rememberMe} onCheckedChange={() => setRememberMe(!rememberMe)} />
            <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Remember me
            </label>
          </div>
          <div>
            {location.country && <span className="text-xs text-muted-foreground">{location.country}</span>}
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <Button type="submit" className="w-full relative overflow-hidden" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
            {isLoading && <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
              </span>}
          </Button>
          
          <Button type="button" variant="outline" onClick={() => setShowTwoFactor(true)} className="flex-none" title="Enable 2FA">
            <ShieldCheck className="h-4 w-4" />
          </Button>
        </div>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      
      <LoginFormFooter isLoading={isLoading} />
    </div>;
}
