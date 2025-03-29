
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Landmark, MapPin } from "lucide-react";

interface BusinessSettingsProps {
  onOpen: (id: string) => void;
}

export const BusinessSettings = ({ onOpen }: BusinessSettingsProps) => {
  return (
    <SettingSection title="Business Settings">
      <SettingItem
        icon={<Landmark className="h-6 w-6 text-primary" />}
        label="Business Registration"
        onClick={() => onOpen("business")}
      />
      <SettingItem
        icon={<MapPin className="h-6 w-6 text-primary" />}
        label="Public Profile"
        onClick={() => onOpen("public-profile")}
      />
    </SettingSection>
  );
};
