import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Enhanced analytics hook with performance monitoring
export const useAnalytics = () => {
 const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track slow queries
  const logSlowQuery = (queryName: string, duration: number) => {
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }
  };

  // Optimized function to subscribe to specific user data only
  const subscribeToUserData = async (userId: string) => {
    // Instead of subscribing to entire tables, use specific filters
    const start = Date.now();
    
    const subscription = supabase
      .channel(`user-specific-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`, // Only subscribe to specific user's data
        },
        (payload) => {
          console.log('Transaction change received:', payload);
          // Handle the specific transaction change
          setAnalyticsData((prev: any) => ({
            ...prev,
            transactions: {
              ...prev?.transactions,
              [(payload.new as any).id]: payload.new
            }
          }));
        }
      )
      .subscribe();

    const duration = Date.now() - start;
    logSlowQuery('subscribe_to_user_data', duration);
    
    return subscription;
  };

  // Optimized function to subscribe to specific chat conversations
  const subscribeToChat = async (conversationId: string) => {
    const start = Date.now();
    
    const subscription = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`, // Only subscribe to specific conversation
        },
        (payload) => {
          console.log('Chat message change received:', payload);
          setAnalyticsData((prev: any) => ({
            ...prev,
            chatMessages: {
              ...prev?.chatMessages,
              [(payload.new as any).id]: payload.new
            }
          }));
        }
      )
      .subscribe();

    const duration = Date.now() - start;
    logSlowQuery('subscribe_to_chat', duration);
    
    return subscription;
  };

  // Optimized function to subscribe to specific wallet changes
  const subscribeToWallet = async (userId: string) => {
    const start = Date.now();
    
    const subscription = supabase
      .channel(`wallet-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${userId}`, // Only subscribe to specific user's wallet
        },
        (payload) => {
          console.log('Wallet change received:', payload);
          setAnalyticsData((prev: any) => ({
            ...prev,
            wallet: payload.new
          }));
        }
      )
      .subscribe();

    const duration = Date.now() - start;
    logSlowQuery('subscribe_to_wallet', duration);
    
    return subscription;
 };

  // Cleanup function to unsubscribe from all channels
  const unsubscribeAll = () => {
    supabase.removeAllChannels();
  };

  // Fetch analytics data efficiently using batched queries
  const fetchAnalyticsData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const start = Date.now();

      // Batch related queries into a single efficient request
      const [{ data: profileData, error: profileError }, 
             { data: walletData, error: walletError },
             { data: transactionData, error: transactionError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        
        supabase
          .from('vortex_wallets')
          .select('*')
          .eq('user_id', userId)
          .single(),
        
        supabase
          .from('vortex_transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (profileError || walletError || transactionError) {
        throw new Error(profileError?.message || walletError?.message || transactionError?.message || 'Error fetching analytics data');
      }

      const duration = Date.now() - start;
      logSlowQuery('fetch_analytics_data', duration);

      setAnalyticsData({
        profile: profileData,
        wallet: walletData,
        recentTransactions: transactionData
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    analyticsData,
    loading,
    error,
    fetchAnalyticsData,
    subscribeToUserData,
    subscribeToChat,
    subscribeToWallet,
    unsubscribeAll
  };
};