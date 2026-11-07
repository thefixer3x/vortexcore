import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { Link, useSearchParams } from "react-router-dom";
import { Home, Users } from "lucide-react";

// Import section components
import { PersonalSettings } from "@/components/settings/sections/PersonalSettings";
import { BusinessSettings } from "@/components/settings/sections/BusinessSettings";
import { PaymentSettings } from "@/components/settings/sections/PaymentSettings";
import { BillingSettings } from "@/components/settings/sections/BillingSettings";
import { NotificationSettings } from "@/components/settings/sections/NotificationSettings";
import { GlobalSettings } from "@/components/settings/sections/GlobalSettings";

// Import sheet components
import { ProfileSheet } from "@/components/settings/sheets/ProfileSheet";
import { SecuritySheet } from "@/components/settings/sheets/SecuritySheet";
import { AccountSecuritySheet } from "@/components/settings/sheets/AccountSecuritySheet";
import { CurrencySheet } from "@/components/settings/sheets/CurrencySheet";
import { NotificationSheet } from "@/components/settings/sheets/NotificationSheet";
import { BusinessSheet } from "@/components/settings/sheets/BusinessSheet";
import { SubscriptionSheet } from "@/components/settings/sheets/SubscriptionSheet";
import { ThemeSheet } from "@/components/settings/sheets/ThemeSheet";
import { PaymentMethodsSheet } from "@/components/settings/sheets/PaymentMethodsSheet";
import { useCompleteCardSetup } from "@/services/paymentMethodService";

export default function Settings() {
  const { t } = useTranslation();
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const { toast } = useToast();

  const openSheet = (id: string) => setActiveSheet(id);
  const closeSheet = () => setActiveSheet(null);

  // Returning from Stripe's hosted card form: ?card_setup=<checkout session id>
  // or ?card_setup=cancelled. Record the card once, then clear the parameter.
  const [searchParams, setSearchParams] = useSearchParams();
  const completeCardSetup = useCompleteCardSetup();
  const handledSetup = useRef<string | null>(null);
  useEffect(() => {
    const setup = searchParams.get("card_setup");
    if (!setup || handledSetup.current === setup) return;
    handledSetup.current = setup;
    const next = new URLSearchParams(searchParams);
    next.delete("card_setup");
    setSearchParams(next, { replace: true });
    setActiveSheet("payment-methods");
    if (setup === "cancelled") return;
    completeCardSetup.mutate(setup, {
      onSuccess: () => toast({ title: "Card saved", description: "You can now use it to fund your wallet." }),
      onError: (err) => toast({ title: "Couldn't save card", description: err.message, variant: "destructive" }),
    });
  }, [searchParams, setSearchParams, completeCardSetup, toast]);

  const showToast = () => {
    toast({
      title: t("settings.notifications_saved.title"),
      description: t("settings.notifications_saved.description"),
    });
  };

  const handleSave = () => {
    closeSheet();
    showToast();
  };

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
            <Home className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        </div>
        <p className="text-muted-foreground">
          {t("settings.page_description")}
        </p>
      </div>
      
      {/* Settings Sections */}
      <PersonalSettings onOpen={openSheet} />
      <BusinessSettings onOpen={openSheet} />
      <PaymentSettings onOpen={openSheet} />
      <BillingSettings onOpen={openSheet} />
      <NotificationSettings onOpen={openSheet} />
      <GlobalSettings onOpen={openSheet} />

      {/* Sheets */}
      <ProfileSheet 
        open={activeSheet === "profile"} 
        onClose={closeSheet}
        onSave={handleSave}
      />
      
      <SecuritySheet 
        open={activeSheet === "security"} 
        onClose={closeSheet}
        onSave={handleSave}
      />
      
      <AccountSecuritySheet 
        open={activeSheet === "account-security"} 
        onClose={closeSheet}
        onSave={handleSave}
      />
      
      <CurrencySheet 
        open={activeSheet === "currency"} 
        onClose={closeSheet}
        onSave={handleSave}
      />
      
      <NotificationSheet 
        open={activeSheet === "notifications"} 
        onClose={closeSheet}
        onSave={handleSave}
      />
      
      <BusinessSheet 
        open={activeSheet === "business"} 
        onClose={closeSheet}
      />
      
      <SubscriptionSheet 
        open={activeSheet === "subscription"} 
        onClose={closeSheet}
      />

      <ThemeSheet
        open={activeSheet === "theme"}
        onClose={closeSheet}
      />

      <PaymentMethodsSheet
        open={activeSheet === "payment-methods"}
        onClose={closeSheet}
      />
      
      {/* We could add all other sheets here, but for brevity I'll just include these for now */}
      {/* The pattern would be the same for the rest */}
    </div>
  );
}
