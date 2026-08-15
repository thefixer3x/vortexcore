<<<<<<< HEAD

import { useTranslation } from "react-i18next";
||||||| parent of 41b0f3a (Add Appearance settings — Theme toggle in Settings UI)

=======
>>>>>>> 41b0f3a (Add Appearance settings — Theme toggle in Settings UI)
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface GlobalSettingsProps {
  onOpen: (id: string) => void;
}

export const GlobalSettings = ({ onOpen }: GlobalSettingsProps) => {
<<<<<<< HEAD
  const { t } = useTranslation();
||||||| parent of 41b0f3a (Add Appearance settings — Theme toggle in Settings UI)
=======
  const { theme } = useTheme();

>>>>>>> 41b0f3a (Add Appearance settings — Theme toggle in Settings UI)
  return (
    <SettingSection title={t("settings.sections.global")}>
      <SettingItem
<<<<<<< HEAD
        icon={<Globe className="h-6 w-6 text-primary" />}
        label={t("settings.global.currency_language.label")}
||||||| parent of 41b0f3a (Add Appearance settings — Theme toggle in Settings UI)
        icon={<Globe className="h-6 w-6 text-primary" />}
        label="Currency & Language"
=======
        icon={<Sun className="h-6 w-6 text-primary" />}
        label={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
        description="Light, Dark, or System"
        onClick={() => onOpen("theme")}
      />
      <SettingItem
        icon={<Monitor className="h-6 w-6 text-primary" />}
        label="Currency & Language"
>>>>>>> 41b0f3a (Add Appearance settings — Theme toggle in Settings UI)
        onClick={() => onOpen("currency")}
      />
    </SettingSection>
  );
};