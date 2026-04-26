// OBF-001-V: Client-side service for OBF accounts via obf-accounts edge function
// Schema mirrors onasis-gateway OBF normalized types — keep in sync with gateway repo.
// Feature flag check lives in the React layer (use-obf-accounts hook), not here.

import { supabase } from "@/integrations/supabase/client";

// ── Shared normalized types (mirrored from onasis-gateway) ───────────────────

export interface OBFAccount {
  id: string;
  displayName: string;
  maskedNumber: string;
  type: string;
  currency: string;
  balance: number;
  asOf: string; // ISO 8601
}

export interface OBFTransaction {
  id: string;
  accountId: string;
  postedAt: string; // ISO 8601
  amount: number;
  currency: string;
  direction: "credit" | "debit";
  counterparty: string;
  description: string;
  status: "posted" | "pending" | "failed";
}

export interface OBFFetchError {
  code: string;
  message: string;
  upstreamStatus?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isOBFFetchError(v: unknown): v is OBFFetchError {
  return typeof v === "object" && v !== null && "code" in v && "message" in v;
}

function throwIfError(data: unknown, error: unknown): void {
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(msg);
  }
  if (isOBFFetchError(data)) {
    throw new Error(`[${data.code}] ${data.message}`);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch normalized Providus accounts via the obf-accounts edge function.
 * Throws on any error — callers should handle via React Query error state.
 */
export async function fetchAccounts(): Promise<OBFAccount[]> {
  const { data, error } = await supabase.functions.invoke<OBFAccount[]>(
    "obf-accounts",
    { method: "GET" }
  );
  throwIfError(data, error);
  if (!Array.isArray(data)) {
    throw new Error("[obf] fetchAccounts: unexpected response shape");
  }
  return data;
}

/**
 * Fetch transactions for a given account via the obf-accounts edge function.
 * Throws on any error — callers should handle via React Query error state.
 */
export async function fetchTransactions(
  accountId: string,
  opts: { from?: string; to?: string; limit?: number } = {}
): Promise<OBFTransaction[]> {
  const params = new URLSearchParams();
  if (opts.from) params.set("from", opts.from);
  if (opts.to) params.set("to", opts.to);
  if (opts.limit) params.set("limit", String(opts.limit));

  const query = params.toString();
  const { data, error } = await supabase.functions.invoke<OBFTransaction[]>(
    "obf-accounts",
    {
      method: "GET",
      headers: {
        "x-obf-path": `/${accountId}/transactions${query ? `?${query}` : ""}`,
      },
    }
  );
  throwIfError(data, error);
  if (!Array.isArray(data)) {
    throw new Error("[obf] fetchTransactions: unexpected response shape");
  }
  return data;
}
