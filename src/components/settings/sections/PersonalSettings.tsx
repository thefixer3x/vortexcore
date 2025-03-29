
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Inbox, Lock, ShieldCheck, Cookie } from "lucide-react";

interface PersonalSettingsProps {
  onOpen: (id: string) => void;
}

export const PersonalSettings = ({ onOpen }: PersonalSettingsProps) => {
  return (
    <SettingSection title="Personal">
      <SettingItem
        icon={<Inbox className="h-6 w-6 text-primary" />}
        label="Profile Information"
        onClick={() => onOpen("profile")}
      />
      <SettingItem
        icon={<Lock className="h-6 w-6 text-primary" />}
        label="Login and Security"
        onClick={() => onOpen("security")}
      />
      <SettingItem
        icon={<ShieldCheck className="h-6 w-6 text-primary" />}
        label="Account Security"
        onClick={() => onOpen("account-security")}
      />
      <SettingItem
        icon={<Cookie className="h-6 w-6 text-primary" />}
        label="Cookies Preferences"
        onClick={() => onOpen("cookies")}
      />
    </SettingSection>
  );
};
