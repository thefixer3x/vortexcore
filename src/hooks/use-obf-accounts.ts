// OBF-001-V: React hooks for OBF accounts + transactions
// Feature flag VITE_OBF_LIVE gates the enabled state — no network call when false.

import { useQuery } from "@tanstack/react-query";
import { fetchAccounts, fetchTransactions } from "@/services/obf/accounts";

// Feature flag — read once at module level, never changes at runtime
const OBF_LIVE = import.meta.env.VITE_OBF_LIVE === "true";

/**
 * Fetch all Providus OBF accounts via onasis-gateway.
 * Returns empty data when VITE_OBF_LIVE=false (no network call made).
 */
export function useOBFAccounts() {
  return useQuery({
    queryKey: ["obf", "accounts"],
    queryFn: fetchAccounts,
    enabled: OBF_LIVE,
    staleTime: 60_000,       // 1 min — bank data doesn't change that fast
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });
}

/**
 * Fetch transactions for a specific OBF account.
 * Only runs when VITE_OBF_LIVE=true AND an accountId is provided.
 */
export function useOBFTransactions(
  accountId: string | null,
  opts: { from?: string; to?: string; limit?: number } = {}
) {
  return useQuery({
    queryKey: ["obf", "transactions", accountId, opts],
    queryFn: () => fetchTransactions(accountId!, opts),
    enabled: OBF_LIVE && !!accountId,
    staleTime: 30_000,
    retry: 1,
  });
}
