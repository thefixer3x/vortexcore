import { supabase } from "@/integrations/supabase/client";

/**
 * Create a cardholder in Stripe
 */
export async function createCardholder(userId: string, name: string, email: string) {
  const { data, error } = await supabase.functions.invoke('stripe', {
    body: { action: 'create_cardholder', data: { name, email, metadata: { user_id: userId } } }
  });
  if (error) throw error;
  return data.cardholder as StripeCardholder;
}

/**
 * Create a virtual card in Stripe
 */
export async function createVirtualCard(
  cardholderId: string,
  currency: string = 'usd',
  spendingLimits?: { amount: number; interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time' }
) {
  const payload: any = { cardholder_id: cardholderId, currency };
  if (spendingLimits) payload.spending_limits = spendingLimits;
  const { data, error } = await supabase.functions.invoke('stripe', {
    body: { action: 'create_card', data: payload }
  });
  if (error) throw error;
  return data.card as StripeCard;
}

/**
 * Get virtual card details
 */
export async function getVirtualCard(cardId: string) {
  const { data, error } = await supabase.functions.invoke('stripe', {
    body: { action: 'get_card', data: { card_id: cardId } }
  });
  if (error) throw error;
  return data.card as StripeCard;
}

/**
 * Update virtual card status (lock/unlock)
 */
export async function updateCardStatus(cardId: string, status: 'active' | 'inactive' | 'canceled') {
  const { data, error } = await supabase.functions.invoke('stripe', {
    body: { action: 'update_card', data: { card_id: cardId, status } }
  });
  if (error) throw error;
  return data.card as StripeCard;
}

/**
 * Get card transactions
 */
export async function getCardTransactions(cardId: string, limit: number = 10) {
  const { data, error } = await supabase.functions.invoke('stripe', {
    body: { action: 'get_transactions', data: { card_id: cardId, limit } }
  });
  if (error) throw error;
  return data.transactions as StripeListResponse<StripeTransaction>;
}

/**
 * Get card details including number, CVC, expiry
 */
export async function getCardDetails(cardId: string) {
  const { data, error } = await supabase.functions.invoke('stripe', {
    body: { action: 'get_card_details', data: { card_id: cardId } }
  });
  if (error) throw error;
  return data as StripeCardDetails;
}

// Stripe Types
export interface StripeCardholder {
  id: string;
  object: 'issuing.cardholder';
  created: number;
  email: string;
  livemode: boolean;
  metadata: Record<string, string>;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  type: 'individual' | 'company';
}

export interface StripeCard {
  id: string;
  object: 'issuing.card';
  brand: string;
  cardholder: {
    id: string;
    object: 'issuing.cardholder';
  };
  created: number;
  currency: string;
  last4: string;
  livemode: boolean;
  metadata: Record<string, string>;
  status: 'active' | 'inactive' | 'canceled';
  type: 'virtual' | 'physical';
  spending_controls?: {
    spending_limits?: Array<{
      amount: number;
      interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
    }>;
  };
}

export interface StripeCardDetails {
  card: {
    number: string;
    cvc: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface StripeTransaction {
  id: string;
  object: 'issuing.transaction';
  amount: number;
  card: {
    id: string;
  };
  cardholder: {
    id: string;
  };
  created: number;
  currency: string;
  merchant_data: {
    category: string;
    name: string;
    network_id: string;
  };
  metadata: Record<string, string>;
  status: 'pending' | 'complete';
  type: 'capture' | 'refund';
}

export interface StripeListResponse<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  url: string;
}
