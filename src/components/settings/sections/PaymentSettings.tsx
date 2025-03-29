
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Smartphone, CreditCard, Banknote } from "lucide-react";

interface PaymentSettingsProps {
  onOpen: (id: string) => void;
}

export const PaymentSettings = ({ onOpen }: PaymentSettingsProps) => {
  return (
    <SettingSection title="Payment Methods">
      <SettingItem
        icon={<Smartphone className="h-6 w-6 text-primary" />}
        label="Mobile Payments"
        onClick={() => onOpen("mobile-payments")}
      />
      <SettingItem
        icon={<CreditCard className="h-6 w-6 text-primary" />}
        label="Cards & Bank Accounts"
        onClick={() => onOpen("cards")}
      />
      <SettingItem
        icon={<Banknote className="h-6 w-6 text-primary" />}
        label="Cash Payments"
        onClick={() => onOpen("cash")}
      />
    </SettingSection>
  );
};
