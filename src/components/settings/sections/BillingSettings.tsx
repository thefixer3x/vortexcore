
import { useTranslation } from "react-i18next";
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { CrownIcon, Receipt } from "lucide-react";

interface BillingSettingsProps {
  onOpen: (id: string) => void;
}

export const BillingSettings = ({ onOpen }: BillingSettingsProps) => {
  const { t } = useTranslation();
  return (
    <SettingSection title={t("settings.sections.billing")}>
      <SettingItem
        icon={<CrownIcon className="h-6 w-6 text-primary" />}
        label={t("settings.billing.subscription.label")}
        onClick={() => onOpen("subscription")}
      />
      <SettingItem
        icon={<Receipt className="h-6 w-6 text-primary" />}
        label={t("settings.billing.tax.label")}
        onClick={() => onOpen("taxes")}
      />
    </SettingSection>
  );
};
