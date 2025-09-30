
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export function BiometricAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  // Check if we're in development mode (Vite)
  const isDevelopment = import.meta.env.DEV;
  
  // Hide biometric button in production until proper implementation
  if (!isDevelopment) {
    return null;
  }
  
  const handleBiometricLogin = async () => {
    setIsLoading(true);
    
    try {
      // In development, use test credentials for biometric simulation
      if (isDevelopment) {
        // Simulate biometric verification delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Use actual auth system with dev test credentials
        await signIn('dev-test@vortexcore.app', 'dev-test-password');
        
        toast({
          title: "Biometric Authentication",
          description: "Successfully authenticated with biometrics (dev mode)"
        });
        
        // Navigation will be handled by auth context
      } else {
        // Production biometric implementation would go here
        // For now, show error since we're hiding the button anyway
        throw new Error('Biometric authentication not yet implemented for production');
      }
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
