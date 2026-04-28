import { useTranslation } from "react-i18next";

export function LoginFormHeader() {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <h2 className="text-2xl font-medium tracking-tight">
        {t("auth.login.welcome_title")}
      </h2>
      <p className="text-muted-foreground mt-2">
        {t("auth.login.welcome_subtitle")}
      </p>
    </div>
  );
}
