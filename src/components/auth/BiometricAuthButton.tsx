
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function BiometricAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleBiometricLogin = async () => {
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
