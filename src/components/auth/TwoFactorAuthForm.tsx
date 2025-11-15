
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthProviders } from "@/hooks/use-auth-providers";
import { toast } from "@/hooks/use-toast";
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from "@/components/ui/input-otp";
import { Smartphone } from "lucide-react";

interface TwoFactorAuthFormProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function TwoFactorAuthForm({ 
  email, 
  onVerified, 
  onCancel 
}: TwoFactorAuthFormProps) {
  const [setupMode, setSetupMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setupTwoFactorAuth, verifyTwoFactorAuth } = useAuthProviders();
  
  const handleSetup = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await setupTwoFactorAuth(email);
      
      if (error) {
        toast({
          title: "2FA Setup Error",
          description: (error as any)?.message || "Failed to set up two-factor authentication",
          variant: "destructive"
        });
        return;
      }
      
      setQrCodeUrl(data.qrCode);
      setFactorId(data.factorId);
      setSetupMode(true);
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      toast({
        title: "2FA Setup Error",
        description: "An unexpected error occurred during 2FA setup",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerify = async () => {
    if (!factorId) {
      toast({
        title: "2FA Error",
        description: "Missing factor ID. Please try setting up 2FA again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await verifyTwoFactorAuth(factorId, code);
      
      if (error) {
        toast({
          title: "2FA Verification Error",
          description: (error as any)?.message || "Failed to verify two-factor authentication code",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "2FA Verified",
        description: "Two-factor authentication successfully verified"
      });
      
      onVerified();
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      toast({
        title: "2FA Verification Error",
        description: "An unexpected error occurred during 2FA verification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-muted-foreground">
          {setupMode
            ? "Scan the QR code with your authenticator app and enter the code below"
            : "Enhance your account security by enabling two-factor authentication"}
        </p>
      </div>
      
      {setupMode ? (
        <div className="space-y-6">
          {qrCodeUrl && (
            <div className="flex justify-center">
              <div className="p-4 border rounded-lg bg-white">
                <img src={qrCodeUrl} alt="QR Code for 2FA" className="w-48 h-48" />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              className="flex-1"
              disabled={code.length < 6 || isLoading}
            >
              {isLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-center p-6 border rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                You'll need an authenticator app like Google Authenticator or Authy
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isLoading}
            >
              Skip
            </Button>
            <Button
              onClick={handleSetup}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="h-4 w-4 rounded-full border-2 border-r-transparent animate-spin" />
              ) : (
                "Set Up 2FA"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
