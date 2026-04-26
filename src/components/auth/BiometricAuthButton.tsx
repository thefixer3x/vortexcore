import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function BiometricAuthButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: "Biometric Authentication",
        description: "Biometric authentication is not yet available. Please use email and password.",
        variant: "destructive",
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
