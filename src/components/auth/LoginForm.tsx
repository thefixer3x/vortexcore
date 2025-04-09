
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Fingerprint, Mail, Lock, Eye, EyeOff, Globe, ShieldCheck } from "lucide-react";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { TwoFactorAuthForm } from "./TwoFactorAuthForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "@/hooks/use-location";
import { LoginFormHeader } from "./LoginFormHeader";
import { EmailPasswordFields } from "./EmailPasswordFields";
import { LoginFormFooter } from "./LoginFormFooter";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // If we have location data, include it in metadata
      const metadata = location.country ? {
        login_country: location.country,
        login_city: location.city
      } : undefined;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // Remove the data property and use metadata directly
          captchaToken: undefined,
          metadata // This is the correct way to pass metadata
        }
      });
      
      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (data.user && data.session) {
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
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBiometricLogin = async () => {
    // For demonstration, we'll just simulate a successful login
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Biometric Authentication",
        description: "Successfully authenticated with biometrics"
      });
      navigate("/dashboard");
    }, 1500);
  };
  
  if (showTwoFactor) {
    return (
      <TwoFactorAuthForm 
        email={email}
        onVerified={() => navigate("/dashboard")}
        onCancel={() => setShowTwoFactor(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 animate-fade-in">
      <LoginFormHeader />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <EmailPasswordFields 
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={() => setRememberMe(!rememberMe)}
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </label>
          </div>
          <div className="flex items-center space-x-1">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">₦ NGN</span>
            {location.country && (
              <span className="text-xs text-muted-foreground ml-1">
                ({location.country})
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2">
          <Button
            type="submit"
            className="w-full relative overflow-hidden"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
              </span>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTwoFactor(true)}
            className="flex-none"
            title="Enable 2FA"
          >
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
      
      <LoginFormFooter 
        isLoading={isLoading}
        onBiometricLogin={handleBiometricLogin}
      />
    </div>
  );
}
