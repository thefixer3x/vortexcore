
import { useTranslation } from "react-i18next";

import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface GlobalSettingsProps {
  onOpen: (id: string) => void;
}

export const GlobalSettings = ({ onOpen }: GlobalSettingsProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <SettingSection title={t("settings.sections.global")}>
      <SettingItem
        icon={<Globe className="h-6 w-6 text-primary" />}
        label={t("settings.global.currency_language.label")}
        icon={<Globe className="h-6 w-6 text-primary" />}
        label="Currency & Language"
        icon={<Sun className="h-6 w-6 text-primary" />}
        label={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        description="Light, Dark, or System"
        onClick={() => onOpen("theme")}
      />
      <SettingItem
        icon={<Monitor className="h-6 w-6 text-primary" />}
        label="Currency & Language"
        onClick={() => onOpen("currency")}
      />
    </SettingSection>
  );
};