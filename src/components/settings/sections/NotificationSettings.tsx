
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Bell } from "lucide-react";

interface NotificationSettingsProps {
  onOpen: (id: string) => void;
}

export const NotificationSettings = ({ onOpen }: NotificationSettingsProps) => {
  return (
    <SettingSection title="Notifications">
      <SettingItem
        icon={<Bell className="h-6 w-6 text-primary" />}
        label="Notification Preferences"
        onClick={() => onOpen("notifications")}
      />
    </SettingSection>
  );
};
