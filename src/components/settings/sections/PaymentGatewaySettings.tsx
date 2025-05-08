
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { CreditCard, Wallet } from "lucide-react";

interface PaymentGatewaySettingsProps {
  onOpen: (id: string) => void;
}

export const PaymentGatewaySettings = ({ onOpen }: PaymentGatewaySettingsProps) => {
  return (
    <SettingSection title="Payment Gateways">
      <SettingItem
        icon={<CreditCard className="h-6 w-6 text-primary" />}
        label="SaySwitch Integration"
        onClick={() => onOpen("sayswitch-settings")}
      />
      <SettingItem
        icon={<Wallet className="h-6 w-6 text-primary" />}
        label="Virtual Account Configuration"
        onClick={() => onOpen("virtual-accounts")}
      />
    </SettingSection>
  );
};
