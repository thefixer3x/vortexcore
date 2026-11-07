import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { usePricingTiers, formatPlanPrice, type PricingTier } from "@/hooks/use-pricing-tiers";

/**
 * Customer-facing pricing page.
 *
 * TODO: Replace tier data, wording, and bulk-payment limit with approved content.
 *       Currently uses fallback tier definitions from @/lib/subscription-tiers.
 *       Contact: Derick — provide exact tier names, prices, features, and bulk-payment limit.
 */

const BULK_PAYMENT_NOTE = "Bulk payments limited to $5,000 per transaction on Free tier";

function TierCard({ tier, isPopular, onSelect }: {
  tier: PricingTier;
  isPopular: boolean;
  onSelect: (tierKey: string) => void;
}) {
  return (
    <Card className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg scale-[1.02]" : "border-border"} h-full`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs">Most Popular</Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg capitalize flex items-center gap-2">
          {tier.tier_key === "free" ? (
            <Sparkles className="h-4 w-4" />
          ) : tier.tier_key === "enterprise" ? (
            <Sparkles className="h-4 w-4" />
          ) : null}
          {tier.name}
        </CardTitle>
        <CardDescription>
          {tier.price === 0 ? "Start free, upgrade when you're ready" : "Pay monthly or yearly"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{formatPlanPrice({ price: tier.price, currency: tier.currency })}</span>
            {tier.billing_interval === "month" && <span className="text-muted-foreground text-sm">/mo</span>}
          </div>
        </div>

        <ul className="space-y-3 flex-1">
          {tier.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {f.comingSoon ? (
                <X className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              ) : (
                <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              )}
              <span className={f.comingSoon ? "text-muted-foreground" : ""}>{f.label}</span>
            </li>
          ))}
          {tier.card_limit != null && (
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <span>Up to {tier.card_limit} virtual cards</span>
            </li>
          )}
        </ul>

        <div className="mt-6">
          <Button
            className={`w-full gap-1 ${tier.price === 0 ? "outline" : ""}`}
            onClick={() => onSelect(tier.tier_key)}
          >
            {tier.price === 0 ? "Get Started" : "Subscribe"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Pricing() {
  const { tiers, loading } = usePricingTiers();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleSelect = (tierKey: string) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    // Navigate to subscription settings with the selected tier preselected
    navigate(`/settings?plan=${tierKey}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading pricing…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
          Choose the plan that fits your needs. Upgrade or downgrade anytime.
        </p>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">{BULK_PAYMENT_NOTE}</p>
      </section>

      {/* Tier cards */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers
            .filter((t) => t.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((t) => (
              <TierCard
                key={t.tier_key}
                tier={t}
                isPopular={t.tier_key === "pro"}
                onSelect={handleSelect}
              />
            ))}
        </div>
      </section>

      {/* FAQ / Info */}
      <section className="px-4 pb-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently asked questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-1">Can I switch plans?</h3>
            <p className="text-sm text-muted-foreground">Yes — change your plan at any time from Settings → Subscription. Changes take effect immediately.</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">What payment methods are accepted?</h3>
            <p className="text-sm text-muted-foreground">We accept Visa, Mastercard, and American Express via Stripe. Corporate invoicing is available on Enterprise.</p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Is there a free trial?</h3>
            <p className="text-sm text-muted-foreground">The Free tier is always available with no credit card required. Paid tiers start at $9.99/month.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
