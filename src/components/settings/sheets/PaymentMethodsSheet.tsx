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
import {
  usePaymentMethods,
  useStartCardSetup,
  useSetDefaultPaymentMethod,
  useDetachPaymentMethod,
  useFundWallet,
  useTopupKey,
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
  const startCardSetup = useStartCardSetup();
  const setDefault = useSetDefaultPaymentMethod();
  const detach = useDetachPaymentMethod();
  const fundWallet = useFundWallet();
  const topupKey = useTopupKey();


  // --- Handlers ---

  // Cards are saved on Stripe's hosted page; Settings records the card when
  // the user comes back (?card_setup=<session id>).
  const handleAddCard = async () => {
    try {
      await startCardSetup.mutateAsync();
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
      const result = await fundWallet.mutateAsync({
        amount,
        currency: fundCurrency,
        payment_method_id: pm.source_id,
        idempotency_key: topupKey.keyFor(amount, fundCurrency, pm.source_id),
      });
      topupKey.reset();
      toast({
        title: result.idempotent ? "Already added" : "Wallet funded",
        description: `${formatCurrency(amount, fundCurrency)} added to your ${fundCurrency} wallet.`,
      });
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
                disabled={startCardSetup.isPending}
                onClick={handleAddCard}
              >
                {startCardSetup.isPending ? (
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
                        pm.brand === "visa" ? "bg-blue-600" :
                        pm.brand === "mastercard" ? "bg-red-500" :
                        pm.brand === "amex" ? "bg-green-600" :
                        "bg-gray-400"
                      }`}>
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {formatBrand(pm.brand ?? undefined)} •••• {pm.last4}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Exp {String(pm.exp_month ?? "").padStart(2, "0")}/{pm.exp_year}
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
