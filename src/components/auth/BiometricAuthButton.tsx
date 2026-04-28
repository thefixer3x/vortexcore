import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Fingerprint } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function BiometricAuthButton() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: t("auth.biometric.unavailable.title"),
        description: t("auth.biometric.unavailable.description"),
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
      <span>{t("auth.biometric.continue")}</span>
    </Button>
  );
}
