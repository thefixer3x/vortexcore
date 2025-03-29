
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Globe } from "lucide-react";

interface GlobalSettingsProps {
  onOpen: (id: string) => void;
}

export const GlobalSettings = ({ onOpen }: GlobalSettingsProps) => {
  return (
    <SettingSection title="Global Settings">
      <SettingItem
        icon={<Globe className="h-6 w-6 text-primary" />}
        label="Currency & Language"
        onClick={() => onOpen("currency")}
      />
    </SettingSection>
  );
};
