import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TIERS, type TierFeature, type TierKey } from "@/lib/subscription-tiers";

export interface PricingTier {
  tier_key: TierKey;
  name: string;
  price: number;
  currency: string;
  billing_interval: "month" | "year";
  stripe_price_id: string | null;
  features: TierFeature[];
  card_limit: number | null;
  is_active: boolean;
  sort_order: number;
}

export const FALLBACK_TIERS: PricingTier[] = (Object.keys(TIERS) as TierKey[]).map((k, i) => ({
  tier_key: k,
  name: TIERS[k].name,
  price: TIERS[k].price,
  currency: "USD",
  billing_interval: "month",
  stripe_price_id: TIERS[k].priceId,
  features: [...TIERS[k].features],
  card_limit: k === "free" ? 3 : null,
  is_active: true,
  sort_order: i,
}));

/** Active plans as set by admins, falling back to the built-in list. */
export function usePricingTiers() {
  const [tiers, setTiers] = useState<PricingTier[]>(FALLBACK_TIERS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    supabase
      .from("vortex_pricing_tiers" as never)
      .select("tier_key,name,price,currency,billing_interval,stripe_price_id,features,card_limit,is_active,sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data, error }) => {
        if (!alive) return;
        if (!error && data && (data as unknown[]).length) {
          setTiers((data as unknown as PricingTier[]).map((t) => ({ ...t, price: Number(t.price) })));
        }
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);
  return { tiers, loading };
}

export const formatPlanPrice = (t: Pick<PricingTier, "price" | "currency">) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: t.currency || "USD" }).format(t.price);
