
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { CrownIcon, Receipt } from "lucide-react";

interface BillingSettingsProps {
  onOpen: (id: string) => void;
}

export const BillingSettings = ({ onOpen }: BillingSettingsProps) => {
  return (
    <SettingSection title="Billing & Taxes">
      <SettingItem
        icon={<CrownIcon className="h-6 w-6 text-primary" />}
        label="Subscription Plan"
        onClick={() => onOpen("subscription")}
      />
      <SettingItem
        icon={<Receipt className="h-6 w-6 text-primary" />}
        label="Tax Information"
        onClick={() => onOpen("taxes")}
      />
    </SettingSection>
  );
};
