

import { useNavigate } from "react-router-dom";

import { TwoFactorAuthForm } from "./TwoFactorAuthForm";
import { toast } from "@/hooks/use-toast";

interface TwoFactorVerificationProps {
  email: string;
  onCancel: () => void;
}

export function TwoFactorVerification({ email, onCancel }: TwoFactorVerificationProps) {
  const navigate = useNavigate();
  
  const handleVerified = () => {
    toast({
      title: "Authentication Successful",
      description: "Welcome back to VortexCore!"
    });
    navigate("/dashboard");
  };
  
  return (
    <TwoFactorAuthForm 
      email={email}
      onVerified={handleVerified}
      onCancel={onCancel}
    />
  );
}
