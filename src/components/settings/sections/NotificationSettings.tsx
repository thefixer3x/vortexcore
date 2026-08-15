
import { useTranslation } from "react-i18next";
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Bell } from "lucide-react";

interface NotificationSettingsProps {
  onOpen: (id: string) => void;
}

export const NotificationSettings = ({ onOpen }: NotificationSettingsProps) => {
  const { t } = useTranslation();
  return (
    <SettingSection title={t("settings.sections.notifications")}>
      <SettingItem
        icon={<Bell className="h-6 w-6 text-primary" />}
        label={t("settings.notifications_preferences.preferences.label")}
        onClick={() => onOpen("notifications")}
      />
    </SettingSection>
  );
};
