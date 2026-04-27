import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CrownIcon, Zap, Building2, Check, Loader2, ExternalLink } from "lucide-react";
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
  const { tier, subscribed, status, currentPeriodEnd, cancelAt, loading, refresh } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

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
          <SheetTitle>Subscription Plan</SheetTitle>
          <SheetDescription>
            {subscribed ? "Manage your active subscription" : "Upgrade to unlock premium features"}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4 sm:py-6">
            {/* Current plan banner */}
            <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {(() => { const Icon = TIER_ICONS[tier]; return <Icon className="h-5 w-5 text-yellow-500" />; })()}
                  <span className="font-semibold text-sm sm:text-base capitalize">
                    Current Plan: {TIERS[tier].name}
                  </span>
                </div>
                <Badge variant={subscribed ? "default" : "secondary"} className="capitalize text-xs">
                  {subscribed ? status : "free"}
                </Badge>
              </div>
              {currentPeriodEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renews {formatDate(currentPeriodEnd)}
                </p>
              )}
              {cancelAt && (
                <p className="text-xs text-destructive mt-1">
                  Cancels {formatDate(cancelAt)}
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
                Manage Subscription
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
                      {isCurrentPlan && <Badge className="text-xs">Current</Badge>}
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
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Opening Checkout…</>
                      ) : (
                        <>Upgrade to {plan.name}</>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}

            {subscribed && (
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => void refresh()}>
                Refresh subscription status
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
