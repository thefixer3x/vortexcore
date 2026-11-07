import { useState, useEffect } from "react";
import { SettingItem } from "../SettingItem";
import { SettingSection } from "../SettingSection";
import { Smartphone, CreditCard, Banknote, Settings2, RotateCcw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePaymentMethods } from "@/services/paymentMethodService";

const SETTINGS_KEY = "payment_preferences";

export const PaymentSettings = ({ onOpen }: { onOpen: (id: string) => void }) => {
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { user } = useAuth();
  const [defaultSource, setDefaultSource] = useState<"wallet" | "card">("wallet");
  const [isLoading, setIsLoading] = useState(true);

  // Load default payment source preference
  useEffect(() => {
    if (!user?.id) return;
    const fetchPref = async () => {
      try {
        const { data } = await supabase
          .from("vortex_settings")
          .select("value")
          .eq("user_id", user.id)
          .eq("key", SETTINGS_KEY)
          .maybeSingle();
        if (data?.value && typeof data.value === "object" && "default_payment_source" in data.value) {
          const val = (data.value as { default_payment_source?: string }).default_payment_source;
          if (val === "wallet" || val === "card") setDefaultSource(val);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchPref();
  }, [user?.id]);

  const toggleDefaultSource = async () => {
    const newVal = defaultSource === "wallet" ? "card" : "wallet";
    setDefaultSource(newVal);

    try {
      // Upsert the preference
      const { error } = await supabase
        .from("vortex_settings")
        .upsert({
          user_id: user?.id,
          key: SETTINGS_KEY,
          value: { default_payment_source: newVal },
        }, { onConflict: "user_id,key" });

      if (error) throw error;
      toast({ title: "Preference saved", description: `Payments will default to ${newVal === "wallet" ? "your wallet" : "your saved card"} when available.` });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

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
        onClick={() => onOpen("payment-methods")}
      />
      <SettingItem
        icon={<Banknote className="h-6 w-6 text-primary" />}
        label="Cash Payments"
        onClick={() => onOpen("cash")}
      />

      {/* Default Payment Source Toggle */}
      <div className="mt-4 p-4 rounded-lg border bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Default Payment Source</span>
          </div>
          {isLoading ? (
            <span className="text-xs text-muted-foreground">…</span>
          ) : (
            <Switch
              checked={defaultSource === "card"}
              onCheckedChange={toggleDefaultSource}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          When {defaultSource === "wallet" ? "off" : "on"}, obligations and payments
          will use your saved card instead of your wallet balance if the wallet has
          insufficient funds.
        </p>
      </div>

      {/* Default card display (if available) */}
      <DefaultCardDisplay />
    </SettingSection>
  );
};

function DefaultCardDisplay() {
  const { data: methods } = usePaymentMethods();
  const defaultCard = methods?.find((m) => m.is_default);

  if (!defaultCard) return null;

  return (
    <div className="mt-3 p-3 rounded-lg border bg-muted/30 flex items-center gap-3">
      <div className="w-8 h-5 rounded bg-gray-300 flex items-center justify-center">
        <CreditCard className="h-3 w-3 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">
          Default card: •••• {defaultCard.stripe_last4 || defaultCard.last4}
        </p>
      </div>
      <Settings2 className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}
