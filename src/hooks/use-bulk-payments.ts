import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type WalletRow = Tables<"vortex_wallets">;
type TransactionRow = Tables<"vortex_transactions">;

export interface BulkRecipientInput {
  recipient: string;
  amount: number;
  notes?: string;
}

export interface BulkBatchItem {
  id: string;
  recipient: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface BulkBatch {
  batchId: string;
  createdAt: string;
  currency: string;
  items: BulkBatchItem[];
  totalAmount: number;
  status: "pending" | "processing" | "completed" | "failed" | "mixed";
}

interface UseBulkPaymentsResult {
  wallet: (WalletRow & { balance: number }) | null;
  batches: BulkBatch[];
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  submitBatch: (items: BulkRecipientInput[], currency: string) => Promise<{ batchId: string }>;
  refresh: () => Promise<void>;
}

const normalizeAmount = (value: number | string | null | undefined): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const isBulkPaymentTransaction = (transaction: TransactionRow): boolean => {
  const metadata = transaction.metadata as Record<string, unknown> | null;
  return Boolean(metadata && metadata.action === "bulk_payment" && typeof metadata.batch_id === "string");
};

const deriveBatchStatus = (statuses: string[]): BulkBatch["status"] => {
  const unique = new Set(statuses);
  if (unique.size === 1) {
    const only = statuses[0];
    if (only === "completed" || only === "pending" || only === "processing" || only === "failed") {
      return only;
    }
  }
  return "mixed";
};

const groupIntoBatches = (transactions: TransactionRow[]): BulkBatch[] => {
  const byBatchId = new Map<string, TransactionRow[]>();

  for (const transaction of transactions) {
    if (!isBulkPaymentTransaction(transaction)) continue;
    const metadata = transaction.metadata as Record<string, unknown>;
    const batchId = metadata.batch_id as string;
    const existing = byBatchId.get(batchId) ?? [];
    existing.push(transaction);
    byBatchId.set(batchId, existing);
  }

  return Array.from(byBatchId.entries())
    .map(([batchId, items]) => {
      const sorted = [...items].sort((a, b) =>
        (a.created_at ?? "").localeCompare(b.created_at ?? "")
      );

      return {
        batchId,
        createdAt: sorted[0].created_at ?? new Date(0).toISOString(),
        currency: sorted[0].currency ?? "USD",
        totalAmount: sorted.reduce((sum, item) => sum + normalizeAmount(item.amount), 0),
        status: deriveBatchStatus(sorted.map((item) => item.status ?? "pending")),
        items: sorted.map((item) => ({
          id: item.id ?? item.reference ?? `${batchId}-${item.created_at}`,
          recipient:
            typeof (item.metadata as Record<string, unknown>)?.recipient === "string"
              ? ((item.metadata as Record<string, unknown>).recipient as string)
              : "Unknown recipient",
          amount: normalizeAmount(item.amount),
          status: item.status ?? "pending",
          createdAt: item.created_at ?? new Date(0).toISOString()
        }))
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const useBulkPayments = (): UseBulkPaymentsResult => {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [wallet, setWallet] = useState<(WalletRow & { balance: number }) | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setWallet(null);
      setTransactions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [walletResponse, transactionResponse] = await Promise.all([
        supabase
          .from("vortex_wallets")
          .select("*")
          .eq("user_id", userId)
          .eq("is_locked", false)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("vortex_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(300)
      ]);

      if (walletResponse.error) throw walletResponse.error;
      if (transactionResponse.error) throw transactionResponse.error;

      setWallet(
        walletResponse.data
          ? { ...walletResponse.data, balance: normalizeAmount(walletResponse.data.balance) }
          : null
      );
      setTransactions(transactionResponse.data ?? []);
    } catch (err) {
      console.error("Failed to load bulk payment data:", err);
      setError(err instanceof Error ? err.message : "Unable to load bulk payment data");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submitBatch = useCallback(
    async (items: BulkRecipientInput[], currency: string) => {
      if (!userId) {
        throw new Error("You need to be signed in to submit a bulk payment");
      }
      if (!items.length) {
        throw new Error("Add at least one recipient before submitting");
      }

      setIsSubmitting(true);

      try {
        const batchId = `BULK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

        const rows = items.map((item, index) => ({
          user_id: userId,
          wallet_id: wallet?.id ?? null,
          type: "transfer",
          status: "pending",
          amount: item.amount,
          currency,
          category: "Bulk Payment",
          reference: `${batchId}-${index}`,
          description: item.notes
            ? `Bulk payment: ${item.recipient} — ${item.notes}`
            : `Bulk payment: ${item.recipient}`,
          metadata: {
            action: "bulk_payment",
            batch_id: batchId,
            recipient: item.recipient,
            notes: item.notes ?? null
          }
        }));

        const { error: insertError } = await supabase.from("vortex_transactions").insert(rows);

        if (insertError) throw insertError;

        await fetchData();

        return { batchId };
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, wallet, fetchData]
  );

  const batches = useMemo(() => groupIntoBatches(transactions), [transactions]);

  return { wallet, batches, isLoading, error, isSubmitting, submitBatch, refresh: fetchData };
};
