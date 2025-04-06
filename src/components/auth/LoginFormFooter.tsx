
import React from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { SocialLoginButtons } from "./SocialLoginButtons";

interface LoginFormFooterProps {
  isLoading: boolean;
  onBiometricLogin: () => void;
}

export function LoginFormFooter({ isLoading, onBiometricLogin }: LoginFormFooterProps) {
  return (
    <div className="flex flex-col space-y-4">
      <SocialLoginButtons />
      
      <Button 
        variant="outline" 
        type="button"
        className="flex items-center justify-center gap-2"
        onClick={onBiometricLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
        ) : (
          <Fingerprint className="h-4 w-4" />
        )}
        <span>Continue with Biometrics</span>
      </Button>
      
      <div className="text-center text-sm text-muted-foreground mt-4">
        Don't have an account?{" "}
        <Button variant="link" className="p-0 h-auto font-normal">
          Create account
        </Button>
      </div>
    </div>
  );
}
