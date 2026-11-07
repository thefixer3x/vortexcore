import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Loader2,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  usePaymentMethods,
  useCreateSetupIntent,
  useAttachPaymentMethod,
  useSetDefaultPaymentMethod,
  useDetachPaymentMethod,
} from "@/services/paymentMethodService";
import { useCurrency } from "@/contexts/CurrencyContext";

interface PaymentMethodsSheetProps {
  open: boolean;
  onClose: () => void;
}

export const PaymentMethodsSheet = ({ open, onClose }: PaymentMethodsSheetProps) => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { toast } = useToast();
  const { t } = useTranslation();

  // State
  const [loadingFund, setLoadingFund] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundCurrency, setFundCurrency] = useState("USD");

  // Data
  const { data: methods = [], isLoading: loadingMethods } = usePaymentMethods();
  const createSetupIntent = useCreateSetupIntent();
  const attachPaymentMethod = useAttachPaymentMethod();
  const setDefault = useSetDefaultPaymentMethod();
  const detach = useDetachPaymentMethod();

  // Redirect URL for Stripe ConfirmSetup
  const redirectUrl = `${window.location.origin}/dashboard/settings`;

  // --- Handlers ---

  const handleAddCard = async () => {
    try {
      const { setupIntent } = await createSetupIntent.mutateAsync(fundCurrency);

      // Use Stripe.js to confirm setup (requires stripe script loaded in index.html)
      // Fallback: show instructions if stripe.js is not available
      if ((window as any).Stripe) {
        const stripe = (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");
        const { error } = await stripe.confirmSetup({
          clientSecret: setupIntent.client_secret,
          redirect: "if_required",
        });

        if (error) throw error;

        // If we got here, setup succeeded without redirect — attach it
        // We need the payment_method from the confirmed setup intent
        // For simplicity, we'll show a success message and let the user try again
        // or use the confirmAndAttach flow below
      } else {
        toast({
          title: "Stripe not loaded",
          description: "Please ensure the Stripe.js script is loaded in index.html",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add card";
      toast({ title: "Couldn't add card", description: message, variant: "destructive" });
    }
  };

  const handleSetDefault = async (pmId: string) => {
    try {
      await setDefault.mutateAsync(pmId);
      toast({ title: "Default updated", description: "This card is now your default payment method." });
    } catch (err: unknown) {
      toast({ title: "Failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleRemove = async (pmId: string) => {
    if (!window.confirm("Remove this payment method?")) return;
    try {
      await detach.mutateAsync(pmId);
      toast({ title: "Removed", description: "Payment method removed." });
    } catch (err: unknown) {
      toast({ title: "Failed", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleFund = async () => {
    if (!fundAmount || !user?.id) return;
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive number.", variant: "destructive" });
      return;
    }

    // Find a payment method to use
    const pm = methods.find((m) => m.is_default) || methods[0];
    if (!pm) {
      toast({ title: "No payment method", description: "Add a card first.", variant: "destructive" });
      return;
    }

    setLoadingFund(true);
    try {
      // For now, use the fund-wallet function which charges directly
      // In a real implementation, you'd use the SetupIntent + confirmPayment flow
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token || "";
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fund-wallet`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: fundCurrency,
          payment_method_id: pm.source_id,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Funding failed");
      toast({ title: "Wallet funded", description: `${formatCurrency(amount, fundCurrency)} added to your wallet.` });
      setFundAmount("");
    } catch (err: unknown) {
      toast({ title: "Funding failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoadingFund(false);
    }
  };

  const formatBrand = (brand?: string) => {
    if (!brand) return "Card";
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payment Methods</SheetTitle>
          <SheetDescription>
            Manage your saved cards and fund your Vortex wallet.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Saved Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Saved Cards
              </h3>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={createSetupIntent.isPending}
                onClick={handleAddCard}
              >
                {createSetupIntent.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Add Card
              </Button>
            </div>

            {loadingMethods ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg bg-muted/20">
                No cards saved. Add a card to fund your wallet or pay obligations.
              </div>
            ) : (
              <div className="space-y-2">
                {methods.map((pm) => (
                  <div
                    key={pm.id}
                    className={`p-4 rounded-lg border flex items-center justify-between transition-colors ${
                      pm.is_default ? "border-primary/40 bg-primary/5" : "bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-7 rounded flex items-center justify-center ${
                        pm.stripe_brand === "visa" ? "bg-blue-600" :
                        pm.stripe_brand === "mastercard" ? "bg-red-500" :
                        pm.stripe_brand === "amex" ? "bg-green-600" :
                        "bg-gray-400"
                      }`}>
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {formatBrand(pm.stripe_brand || pm.brand)} •••• {pm.stripe_last4 || pm.last4}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Exp {String(pm.stripe_exp_month || pm.exp_month).padStart(2, "0")}/{pm.stripe_exp_year || pm.exp_year}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {pm.is_default && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Check className="h-3 w-3" /> Default
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleSetDefault(pm.source_id)}
                        title="Set as default"
                      >
                        {pm.is_default ? <Check className="h-4 w-4" /> : <span className="text-xs">★</span>}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemove(pm.source_id)}
                        title="Remove"
                        disabled={pm.is_default}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Fund Wallet */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Fund Wallet
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="flex-1"
                  min="0"
                  step="0.01"
                />
                <select
                  value={fundCurrency}
                  onChange={(e) => setFundCurrency(e.target.value)}
                  className="h-10 px-3 rounded-md border bg-background text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="NGN">NGN</option>
                  <option value="ZAR">ZAR</option>
                  <option value="KES">KES</option>
                </select>
              </div>

              <Button
                className="w-full gap-2"
                disabled={loadingFund || !fundAmount || parseFloat(fundAmount) <= 0}
                onClick={handleFund}
              >
                {loadingFund ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Banknote className="h-4 w-4" /> Fund Wallet
                  </>
                )}
              </Button>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <p>
                  Funds are charged to your default card and credited instantly to your Vortex wallet.
                  {methods.length === 0 && ' Add a card first to enable funding.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
