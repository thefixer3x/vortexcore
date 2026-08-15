import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CrownIcon, Zap, Building2, Check, Loader2, ExternalLink, CreditCard, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { TIERS } from "@/lib/subscription-tiers";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionSheetProps {
  open: boolean;
  onClose: () => void;
}

const TIER_ICONS = {
  free: CrownIcon,
  pro: Zap,
  enterprise: Building2,
};

export const SubscriptionSheet = ({ open, onClose }: SubscriptionSheetProps) => {
  const { t } = useTranslation();
  const { tier, subscribed, status, currentPeriodEnd, cancelAt, loading, refresh } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  const isPastDue = status === "past_due";
  const isTrialing = status === "trialing";

  const handleSubscribe = async (priceId: string, tierKey: string) => {
    setCheckoutLoading(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Unable to start checkout",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", { body: {} });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast({
        title: "Portal unavailable",
        description: err instanceof Error ? err.message : "Unable to open billing portal",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", { body: {} });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast({
        title: "Portal unavailable",
        description: err instanceof Error ? err.message : "Unable to open billing portal",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : null;

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="space-y-2 sm:space-y-3">
          <SheetTitle>{t("subscription.title")}</SheetTitle>
          <SheetDescription>
            {subscribed ? t("subscription.description.active") : t("subscription.description.inactive")}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4 sm:py-6">
            {/* Past Due Warning Banner */}
            {isPastDue && (
              <div className="flex items-start gap-3 p-4 border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Payment Failed
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    We couldn't process your last payment. Your subscription is temporarily suspended until the payment is resolved.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    onClick={handleUpdatePaymentMethod}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Update Payment Method
                  </Button>
                </div>
              </div>
            )}

            {/* Trial Banner */}
            {isTrialing && (
              <div className="flex items-start gap-3 p-4 border border-blue-500/30 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Trial Active
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    You're currently on a trial period. Your trial will end on {formatDate(currentPeriodEnd)}.
                  </p>
                </div>
              </div>
            )}

            {/* Current plan banner */}
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {(() => { const Icon = TIER_ICONS[tier]; return <Icon className="h-5 w-5 text-yellow-500" />; })()}
                  <span className="font-semibold text-sm sm:text-base capitalize">
                    {t("subscription.current_plan", { plan: TIERS[tier].name })}
                  </span>
                </div>
                <Badge variant={subscribed ? "default" : "secondary"} className="capitalize text-xs">
                  {subscribed ? (isPastDue ? "payment_failed" : t(`subscription.status.${status}`, { defaultValue: status })) : t("subscription.status.free")}
                </Badge>
              </div>
              {currentPeriodEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("subscription.renews", { date: formatDate(currentPeriodEnd) })}
                </p>
              )}
              {cancelAt && (
                <p className="text-xs text-destructive mt-1">
                  {t("subscription.cancels", { date: formatDate(cancelAt) })}
                </p>
              )}
            </div>

            {/* Manage button for subscribers */}
            {subscribed && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                {t("subscription.actions.manage")}
              </Button>
            )}

            {/* Plan cards */}
            {(["pro", "enterprise"] as const).map((key) => {
              const plan = TIERS[key];
              const isCurrentPlan = tier === key;
              const isLoading = checkoutLoading === key;

              return (
                <div
                  key={key}
                  className={`p-3 sm:p-4 border rounded-lg space-y-3 ${isCurrentPlan ? "border-primary bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => { const Icon = TIER_ICONS[key]; return <Icon className="h-4 w-4 text-primary" />; })()}
                      <span className="font-semibold text-sm">{plan.name}</span>
                      {isCurrentPlan && <Badge className="text-xs">{t("subscription.status.active")}</Badge>}
                    </div>
                    <span className="text-sm font-bold">${plan.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                  </div>

                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {!isCurrentPlan && plan.priceId && (
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => void handleSubscribe(plan.priceId!, key)}
                      disabled={isLoading || !!checkoutLoading}
                    >
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("subscription.actions.opening_checkout")}</>
                      ) : (
                        <>{t("subscription.actions.upgrade", { plan: plan.name })}</>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}

            {subscribed && (
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => void refresh()}>
                {t("subscription.actions.refresh")}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
