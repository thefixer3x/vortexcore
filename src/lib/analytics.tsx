import { supabase } from "@/integrations/supabase/client";

// In-memory cache for frequently accessed data
class InMemoryCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  set(key: string, data: any, ttl: number = 300000) { // Default TTL: 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new InMemoryCache();

// Enhanced analytics with performance monitoring and caching for Supabase queries
export const logSlowQueries = async (query: Promise<any>, queryName: string) => {
  const start = Date.now();
  const result = await query;
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    // In a production environment, you might send this to a monitoring service
    // like Sentry, LogRocket, etc.
  }

  return result;
};

// Function to batch related queries into a single request with caching
export const batchUserQueries = async (userId: string) => {
  const cacheKey = `batch_user_queries_${userId}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return { data: cachedResult, error: null };
  }

  const query = supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  const { data, error } = await logSlowQueries(query, 'batch_user_queries');

  if (error) {
    console.error('Error in batchUserQueries:', error);
    return { data: null, error };
  }

  // Cache the result for 5 minutes
  cache.set(cacheKey, data, 300000);
  return { data, error: null };
};

// Function to get AI chat session data with caching
export const getChatWithRelatedData = async (sessionId: string) => {
  const cacheKey = `chat_with_related_data_${sessionId}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return { data: cachedResult, error: null };
  }

  const query = supabase
    .from('ai_chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
    
  const { data, error } = await logSlowQueries(query, 'get_chat_with_related_data');

  if (error) {
    console.error('Error in getChatWithRelatedData:', error);
    return { data: null, error };
  }

  // Cache the result for 2 minutes (chats might update frequently)
  cache.set(cacheKey, data, 120000);
  return { data, error: null };
};

// Function to get transaction data with related information with caching
export const getTransactionWithRelatedData = async (transactionId: string) => {
  const cacheKey = `transaction_with_related_data_${transactionId}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return { data: cachedResult, error: null };
  }

  const query = supabase
    .from('vortex_transactions')
    .select('*')
    .eq('id', transactionId)
    .single();
    
  const { data, error } = await logSlowQueries(query, 'get_transaction_with_related_data');

  if (error) {
    console.error('Error in getTransactionWithRelatedData:', error);
    return { data: null, error };
  }

  // Cache the result for 1 minute (transactions are relatively static after creation)
 cache.set(cacheKey, data, 60000);
  return { data, error: null };
};

// Optimized function for getting virtual card data with related transactions with caching
export const getVirtualCardWithTransactions = async (cardId: string) => {
  const cacheKey = `virtual_card_with_transactions_${cardId}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return { data: cachedResult, error: null };
  }

  const query = supabase
    .from('virtual_cards')
    .select('*')
    .eq('id', cardId)
    .single();
    
  const { data, error } = await logSlowQueries(query, 'get_virtual_card_with_transactions');

  if (error) {
    console.error('Error in getVirtualCardWithTransactions:', error);
    return { data: null, error };
  }

  // Cache the result for 2 minutes
  cache.set(cacheKey, data, 1200);
  return { data, error: null };
};

// Function to get user's recent transactions with caching
export const getUserRecentTransactions = async (userId: string, limit: number = 10) => {
  const cacheKey = `user_recent_transactions_${userId}_${limit}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return { data: cachedResult, error: null };
  }

  const query = supabase
    .from('vortex_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  const { data, error } = await logSlowQueries(query, 'get_user_recent_transactions');

  if (error) {
    console.error('Error in getUserRecentTransactions:', error);
    return { data: null, error };
  }

  // Cache the result for 1 minute
 cache.set(cacheKey, data, 60000);
  return { data, error: null };
};

// Function to get user's wallet information with caching
export const getUserWallet = async (userId: string) => {
  const cacheKey = `user_wallet_${userId}`;
  const cachedResult = cache.get(cacheKey);
  
  if (cachedResult) {
    return { data: cachedResult, error: null };
  }

  const query = supabase
    .from('vortex_wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
    
  const { data, error} = await logSlowQueries(query, 'get_user_wallet');

  if (error) {
    console.error('Error in getUserWallet:', error);
    return { data: null, error };
  }

  // Cache the result for 30 seconds (balance might change frequently)
  cache.set(cacheKey, data, 30000);
  return { data, error: null };
};

// Function to clear all cache
export const invalidateCache = () => {
  cache.clear();
};

// Function to clear all cache
export const clearCache = () => {
  cache.clear();
};