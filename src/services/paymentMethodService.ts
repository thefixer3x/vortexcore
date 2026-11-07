import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// --- Types ---

export interface UserPaymentMethod {
  id: string;
  user_id: string;
  source_id: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  // Enriched from Stripe:
  stripe_last4?: string;
  stripe_brand?: string;
  stripe_exp_month?: number;
  stripe_exp_year?: number;
}

export interface SetupIntentResult {
  setupIntent: { client_secret: string; id: string };
}

// --- Queries ---

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("stripe-payment-methods", {
        body: { action: "list_payment_methods" },
      });
      if (error) throw error;
      return (data?.paymentMethods as UserPaymentMethod[]) ?? [];
    },
    staleTime: 30_000,
  });
}

// --- Mutations ---

export function useCreateSetupIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (currency?: string) => {
      const { data, error } = await supabase.functions.invoke("stripe-payment-methods", {
        body: { action: "create_setup_intent", data: { currency } },
      });
      if (error) throw error;
      return data as SetupIntentResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

export function useAttachPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ setup_intent_id, payment_method_id }: { setup_intent_id?: string; payment_method_id: string }) => {
      const { data, error } = await supabase.functions.invoke("stripe-payment-methods", {
        body: { action: "attach_payment_method", data: { setup_intent_id, payment_method_id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

export function useSetDefaultPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payment_method_id: string) => {
      const { data, error } = await supabase.functions.invoke("stripe-payment-methods", {
        body: { action: "set_default_payment_method", data: { payment_method_id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

export function useDetachPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payment_method_id: string) => {
      const { data, error } = await supabase.functions.invoke("stripe-payment-methods", {
        body: { action: "detach_payment_method", data: { payment_method_id } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}

export function useFundWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      currency,
      payment_method_id,
      note,
    }: {
      amount: number;
      currency: string;
      payment_method_id: string;
      note?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("fund-wallet", {
        body: { amount, currency, payment_method_id, note },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallets"] });
      qc.invalidateQueries({ queryKey: ["payment-methods"] });
    },
  });
}
