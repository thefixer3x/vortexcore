
import { useTranslation } from "react-i18next";
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Landmark, MapPin } from "lucide-react";

interface BusinessSettingsProps {
  onOpen: (id: string) => void;
}

export const BusinessSettings = ({ onOpen }: BusinessSettingsProps) => {
  const { t } = useTranslation();
  return (
    <SettingSection title={t("settings.sections.business")}>
      <SettingItem
        icon={<Landmark className="h-6 w-6 text-primary" />}
        label={t("settings.business.registration.label")}
        onClick={() => onOpen("business")}
      />
      <SettingItem
        icon={<MapPin className="h-6 w-6 text-primary" />}
        label={t("settings.business.public_profile.label")}
        onClick={() => onOpen("public-profile")}
      />
    </SettingSection>
  );
};
