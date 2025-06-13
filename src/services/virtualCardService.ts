import { supabase } from "@/integrations/supabase/client";
import { 
  createCardholder, 
  createVirtualCard, 
  getVirtualCard, 
  updateCardStatus, 
  getCardTransactions,
  getCardDetails,
  StripeCard,
  StripeTransaction
} from "@/lib/stripe";

/**
 * Create a new virtual card for a user
 */
export async function createUserVirtualCard(
  userId: string, 
  name: string, 
  email: string,
  currency: string = 'usd',
  spendingLimit?: {
    amount: number;
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  }
) {
  try {
    // First create a cardholder in Stripe
    const cardholder = await createCardholder(userId, name, email);
    
    // Then create a virtual card for the cardholder
    const card = await createVirtualCard(
      cardholder.id, 
      currency,
      spendingLimit
    );
    
    // Save the card to our database
    const { data, error } = await supabase
      .from('virtual_cards')
      .insert({
        user_id: userId,
        cardholder_id: cardholder.id,
        card_id: card.id,
        last4: card.last4,
        status: card.status,
        is_locked: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Failed to create virtual card:', error);
    throw error;
  }
}

/**
 * Get all virtual cards for a user
 */
export async function getUserVirtualCards(userId: string) {
  try {
    const { data, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Failed to get user virtual cards:', error);
    throw error;
  }
}

/**
 * Get a specific virtual card with details from Stripe
 */
export async function getVirtualCardWithDetails(cardId: string) {
  try {
    // First get the card from our database
    const { data: dbCard, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .eq('id', cardId)
      .single();
    
    if (error) throw error;
    if (!dbCard) throw new Error('Card not found');
    
    // Then get the card details from Stripe
    const stripeCard = await getVirtualCard(dbCard.card_id);
    
    // Merge the data
    return {
      ...dbCard,
      stripe_details: stripeCard
    };
  } catch (error) {
    console.error('Failed to get virtual card details:', error);
    throw error;
  }
}

/**
 * Lock or unlock a virtual card
 */
export async function toggleCardLock(cardId: string, lock: boolean) {
  try {
    // First get the card from our database
    const { data: dbCard, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .eq('id', cardId)
      .single();
    
    if (error) throw error;
    if (!dbCard) throw new Error('Card not found');
    
    // Update the card status in Stripe
    const newStatus = lock ? 'inactive' : 'active';
    await updateCardStatus(dbCard.card_id, newStatus);
    
    // Update our database
    const { data, error: updateError } = await supabase
      .from('virtual_cards')
      .update({
        is_locked: lock,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return data;
  } catch (error) {
    console.error('Failed to toggle card lock:', error);
    throw error;
  }
}

/**
 * Get card transactions
 */
export async function getCardTransactionHistory(cardId: string, limit: number = 10) {
  try {
    // First get the card from our database
    const { data: dbCard, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .eq('id', cardId)
      .single();
    
    if (error) throw error;
    if (!dbCard) throw new Error('Card not found');
    
    // Get transactions from Stripe
    const transactions = await getCardTransactions(dbCard.card_id, limit);
    
    return transactions.data;
  } catch (error) {
    console.error('Failed to get card transactions:', error);
    throw error;
  }
}

/**
 * Get sensitive card details (number, CVC, expiry)
 * This should only be called when absolutely necessary and with proper authentication
 */
export async function getCardSensitiveDetails(cardId: string) {
  try {
    // First get the card from our database
    const { data: dbCard, error } = await supabase
      .from('virtual_cards')
      .select('*')
      .eq('id', cardId)
      .single();
    
    if (error) throw error;
    if (!dbCard) throw new Error('Card not found');
    
    // Get card details from Stripe
    const cardDetails = await getCardDetails(dbCard.card_id);
    
    return cardDetails.card;
  } catch (error) {
    console.error('Failed to get sensitive card details:', error);
    throw error;
  }
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number, currency: string = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  }).format(amount / 100); // Stripe amounts are in cents
}

/**
 * Format transaction for display
 */
export function formatTransaction(transaction: StripeTransaction) {
  return {
    id: transaction.id,
    amount: formatCurrency(transaction.amount, transaction.currency),
    rawAmount: transaction.amount,
    currency: transaction.currency,
    merchant: transaction.merchant_data?.name || 'Unknown Merchant',
    category: transaction.merchant_data?.category || 'Uncategorized',
    status: transaction.status,
    date: new Date(transaction.created * 1000).toLocaleDateString(),
    time: new Date(transaction.created * 1000).toLocaleTimeString(),
    type: transaction.type
  };
}