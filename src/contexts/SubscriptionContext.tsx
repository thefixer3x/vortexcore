import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionTier = "free" | "pro" | "enterprise";

interface SubscriptionState {
  subscribed: boolean;
  status: "none" | "active" | "trialing" | "past_due" | "canceled";
  tier: SubscriptionTier;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultState: SubscriptionState = {
  subscribed: false,
  status: "none",
  tier: "free",
  currentPeriodEnd: null,
  cancelAt: null,
  loading: true,
  refresh: async () => {},
};

const SubscriptionContext = createContext<SubscriptionState>(defaultState);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<Omit<SubscriptionState, "refresh" | "loading">>({
    subscribed: false,
    status: "none",
    tier: "free",
    currentPeriodEnd: null,
    cancelAt: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ subscribed: false, status: "none", tier: "free", currentPeriodEnd: null, cancelAt: null });
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setState({
        subscribed: data.subscribed ?? false,
        status: data.status ?? "none",
        tier: data.tier ?? "free",
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        cancelAt: data.cancelAt ?? null,
      });
    } catch {
      // silent fail — user stays on free tier, avoids gating breaking
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  // Poll every 10 min to pick up webhook-driven tier changes
  useEffect(() => {
    const interval = setInterval(() => void refresh(), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <SubscriptionContext.Provider value={{ ...state, loading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
