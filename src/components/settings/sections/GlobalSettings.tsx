
import { useTranslation } from "react-i18next";
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Globe } from "lucide-react";

interface GlobalSettingsProps {
  onOpen: (id: string) => void;
}

export const GlobalSettings = ({ onOpen }: GlobalSettingsProps) => {
  const { t } = useTranslation();
  return (
    <SettingSection title={t("settings.sections.global")}>
      <SettingItem
        icon={<Globe className="h-6 w-6 text-primary" />}
        label={t("settings.global.currency_language.label")}
        onClick={() => onOpen("currency")}
      />
    </SettingSection>
  );
};
