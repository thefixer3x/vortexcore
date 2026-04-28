import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { BiometricAuthButton } from "./BiometricAuthButton";
import { Link } from "react-router-dom";

interface LoginFormFooterProps {
  isLoading: boolean;
}

export function LoginFormFooter({ isLoading }: LoginFormFooterProps) {
  const { t } = useTranslation();
  void isLoading;
  return (
    <div className="flex flex-col space-y-4">
      <SocialLoginButtons />

      <BiometricAuthButton />

      <div className="text-center text-sm text-muted-foreground mt-4">
        {t("auth.login.no_account")}{" "}
        <Button variant="link" className="p-0 h-auto font-normal" asChild>
          <Link to="/auth">{t("auth.login.create_account")}</Link>
        </Button>
      </div>
    </div>
  );
}
