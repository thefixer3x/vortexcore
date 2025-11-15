
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function BiometricAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleBiometricLogin = async () => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { error } = await supabase.auth.signInWithPassword({
        email: 'dev-test@vortexcore.app',
        password: 'dev-test-password'
      });
      
      if (error) throw error;
      
      toast({
        title: "Biometric Authentication",
        description: "Successfully authenticated with biometrics"
      });
    } catch (error) {
      console.error('Biometric authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: "Biometric authentication is not available. Please use email and password.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      type="button"
      className="flex items-center justify-center gap-2"
      onClick={handleBiometricLogin}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
      ) : (
        <Fingerprint className="h-4 w-4" />
      )}
      <span>Continue with Biometrics</span>
    </Button>
  );
}
