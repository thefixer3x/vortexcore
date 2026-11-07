import { supabase } from "@/integrations/supabase/client";
import { useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// --- Types ---

export interface UserPaymentMethod {
  id: string;
  source_id: string;
  type: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FundWalletInput {
  amount: number;
  currency: string;
  payment_method_id: string;
  /** Same key for retries of one top-up, so the card is charged at most once. */
  idempotency_key: string;
}

export interface FundWalletResult {
  success: true;
  idempotent: boolean;
  wallet_id: string;
  transaction_id: string;
  amount: string;
  currency: string;
  new_balance?: string;
}

/** Edge functions return { error } with a non-2xx status; surface that message. */
async function invokeOrThrow<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    let message = error.message;
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const payload = await context.json();
        if (payload?.error) message = payload.error;
      } catch {
        // keep the generic message
      }
    }
    throw new Error(message);
  }
  return data as T;
}

const cards = (action: string, data?: Record<string, unknown>) =>
  invokeOrThrow<{ paymentMethods?: UserPaymentMethod[]; url?: string; success?: boolean }>(
    "stripe-payment-methods",
    { action, data },
  );

// --- Queries ---

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => (await cards("list_payment_methods")).paymentMethods ?? [],
    staleTime: 30_000,
  });
}

// --- Mutations ---

/** Sends the user to Stripe's hosted page to save a card. */
export function useStartCardSetup() {
  return useMutation({
    mutationFn: async () => {
      const { url } = await cards("start_card_setup");
      if (!url) throw new Error("Could not open the card form");
      window.location.assign(url);
    },
  });
}

/** Records the card saved on Stripe's page; called when the user returns. */
export function useCompleteCardSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (session_id: string) => cards("complete_card_setup", { session_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payment_method_id: string) => cards("set_default_payment_method", { payment_method_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}

export function useDetachPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payment_method_id: string) => cards("detach_payment_method", { payment_method_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}

export function useFundWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FundWalletInput) => invokeOrThrow<FundWalletResult>("fund-wallet", { ...input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** A fresh request key for one top-up attempt. */
export function newTopupKey(): string {
  return `topup_${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * One request key per intended top-up: retrying the same amount, currency and
 * card reuses the key (so a retry after a timeout never charges twice); any
 * change, or reset() after success, starts a new one.
 */
export function useTopupKey() {
  const ref = useRef<{ sig: string; key: string } | null>(null);
  const keyFor = useCallback((amount: number, currency: string, paymentMethodId: string) => {
    const sig = `${amount}|${currency}|${paymentMethodId}`;
    if (!ref.current || ref.current.sig !== sig) ref.current = { sig, key: newTopupKey() };
    return ref.current.key;
  }, []);
  const reset = useCallback(() => { ref.current = null; }, []);
  return { keyFor, reset };
}
