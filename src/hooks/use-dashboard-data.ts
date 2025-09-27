import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type WalletRow = Tables<"wallets">;
type TransactionRow = Tables<"transactions">;
type ProfileRow = Tables<"profiles">;

export type DashboardWallet = WalletRow & {
  balance: number;
};

export type DashboardTransaction = TransactionRow & {
  amount: number;
  metadata: Record<string, unknown> | null;
};

export interface DashboardProfile {
  full_name: string | null;
  company_name: string | null;
}

interface UseDashboardDataResult {
  wallets: DashboardWallet[];
  transactions: DashboardTransaction[];
  profile: DashboardProfile | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const normalizeAmount = (value: number | string | null | undefined): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export const useDashboardData = (): UseDashboardDataResult => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [wallets, setWallets] = useState<DashboardWallet[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setWallets([]);
      setTransactions([]);
      setProfile(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [walletResponse, transactionResponse, profileResponse] = await Promise.all([
        supabase
          .from("wallets")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("profiles")
          .select("full_name, company_name")
          .eq("id", userId)
          .maybeSingle()
      ]);

      if (walletResponse.error || transactionResponse.error || profileResponse.error) {
        const messages = [
          walletResponse.error?.message,
          transactionResponse.error?.message,
          profileResponse.error?.message
        ].filter(Boolean);

        throw new Error(messages.join(" | "));
      }

      const normalisedWallets = (walletResponse.data ?? []).map((wallet) => ({
        ...wallet,
        balance: normaliseAmount(wallet.balance)
      }));

      const normalisedTransactions = (transactionResponse.data ?? []).map((transaction) => ({
        ...transaction,
        amount: normaliseAmount(transaction.amount),
        metadata: (transaction.metadata as Record<string, unknown> | null) ?? null
      }));

      setWallets(normalisedWallets);
      setTransactions(normalisedTransactions);
      setProfile(profileResponse.data ?? null);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(err instanceof Error ? err.message : "Unable to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const walletChannel = supabase
      .channel(`dashboard_wallets_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        () => {
          void fetchData();
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel(`dashboard_transactions_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        () => {
          void fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(walletChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [userId, fetchData]);

  const value = useMemo<UseDashboardDataResult>(
    () => ({
      wallets,
      transactions,
      profile,
      isLoading,
      error,
      refresh: fetchData
    }),
    [wallets, transactions, profile, isLoading, error, fetchData]
  );

  return value;
};

