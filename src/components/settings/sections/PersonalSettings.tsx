
import { useTranslation } from "react-i18next";
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Inbox, Lock, ShieldCheck, Cookie } from "lucide-react";

interface PersonalSettingsProps {
  onOpen: (id: string) => void;
}

export const PersonalSettings = ({ onOpen }: PersonalSettingsProps) => {
  const { t } = useTranslation();
  return (
    <SettingSection title={t("settings.sections.personal")}>
      <SettingItem
        icon={<Inbox className="h-6 w-6 text-primary" />}
        label={t("settings.personal.profile.label")}
        onClick={() => onOpen("profile")}
      />
      <SettingItem
        icon={<Lock className="h-6 w-6 text-primary" />}
        label={t("settings.personal.security.label")}
        onClick={() => onOpen("security")}
      />
      <SettingItem
        icon={<ShieldCheck className="h-6 w-6 text-primary" />}
        label={t("settings.personal.account_security.label")}
        onClick={() => onOpen("account-security")}
      />
      <SettingItem
        icon={<Cookie className="h-6 w-6 text-primary" />}
        label={t("settings.personal.cookies.label")}
        onClick={() => onOpen("cookies")}
      />
    </SettingSection>
  );
};
