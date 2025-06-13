import { supabase } from "@/integrations/supabase/client";

// Stripe API configuration
const STRIPE_API_VERSION = '2023-10-16';
const STRIPE_BASE_URL = 'https://api.stripe.com/v1';

/**
 * Get Stripe API key from environment or function
 */
async function getStripeSecretKey(): Promise<string> {
  // First try to get from environment
  const envKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
  if (envKey) return envKey;
  
  // If not in environment, try to get from Supabase function
  try {
    const { data, error } = await supabase.functions.invoke('stripe', {
      body: { action: 'get_api_key' }
    });
    
    if (error) throw error;
    return data.key;
  } catch (error) {
    console.error('Failed to get Stripe API key:', error);
    throw new Error('Stripe API key not available');
  }
}

/**
 * Make authenticated request to Stripe API
 */
async function stripeRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'DELETE' = 'GET', 
  data?: Record<string, any>
): Promise<T> {
  const apiKey = await getStripeSecretKey();
  
  const url = `${STRIPE_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Stripe-Version': STRIPE_API_VERSION
  };
  
  // Convert data to URL encoded format for Stripe
  const body = data ? 
    Object.keys(data)
      .map(key => {
        // Handle nested objects
        if (typeof data[key] === 'object' && data[key] !== null) {
          return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(data[key]))}`;
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
      })
      .join('&') : 
    undefined;
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' ? body : undefined
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error?.message || 'Stripe API request failed');
    }
    
    return responseData as T;
  } catch (error) {
    console.error(`Stripe API error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Create a cardholder in Stripe
 */
export async function createCardholder(userId: string, name: string, email: string) {
  try {
    const cardholderData = {
      type: 'individual',
      name,
      email,
      metadata: {
        user_id: userId
      }
    };
    
    const cardholder = await stripeRequest<StripeCardholder>(
      '/issuing/cardholders',
      'POST',
      cardholderData
    );
    
    return cardholder;
  } catch (error) {
    console.error('Failed to create cardholder:', error);
    throw error;
  }
}

/**
 * Create a virtual card in Stripe
 */
export async function createVirtualCard(
  cardholderId: string, 
  currency: string = 'usd',
  spendingLimits?: {
    amount: number;
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  }
) {
  try {
    const cardData: any = {
      cardholder: cardholderId,
      currency: currency.toLowerCase(),
      type: 'virtual',
      status: 'active'
    };
    
    // Add spending limits if provided
    if (spendingLimits) {
      cardData.spending_controls = {
        spending_limits: [{
          amount: spendingLimits.amount,
          interval: spendingLimits.interval
        }]
      };
    }
    
    const card = await stripeRequest<StripeCard>(
      '/issuing/cards',
      'POST',
      cardData
    );
    
    return card;
  } catch (error) {
    console.error('Failed to create virtual card:', error);
    throw error;
  }
}

/**
 * Get virtual card details
 */
export async function getVirtualCard(cardId: string) {
  try {
    return await stripeRequest<StripeCard>(`/issuing/cards/${cardId}`);
  } catch (error) {
    console.error('Failed to get virtual card:', error);
    throw error;
  }
}

/**
 * Update virtual card status (lock/unlock)
 */
export async function updateCardStatus(cardId: string, status: 'active' | 'inactive' | 'canceled') {
  try {
    return await stripeRequest<StripeCard>(
      `/issuing/cards/${cardId}`,
      'POST',
      { status }
    );
  } catch (error) {
    console.error('Failed to update card status:', error);
    throw error;
  }
}

/**
 * Get card transactions
 */
export async function getCardTransactions(cardId: string, limit: number = 10) {
  try {
    return await stripeRequest<StripeListResponse<StripeTransaction>>(
      '/issuing/transactions',
      'GET',
      { 
        card: cardId,
        limit
      }
    );
  } catch (error) {
    console.error('Failed to get card transactions:', error);
    throw error;
  }
}

/**
 * Get card details including number, CVC, expiry
 */
export async function getCardDetails(cardId: string) {
  try {
    return await stripeRequest<StripeCardDetails>(
      `/issuing/cards/${cardId}/details`,
      'GET'
    );
  } catch (error) {
    console.error('Failed to get card details:', error);
    throw error;
  }
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