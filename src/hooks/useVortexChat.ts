import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LogRocket from 'logrocket';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatOptions {
  wantRealtime?: boolean;
}

/**
 * Hook for interacting with the VortexAI assistant
 * Supports cascading AI providers (OpenAI → Gemini → Perplexity)
 * with automatic fallback for real-time information
 */
export function useVortexChat() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Welcome to VortexCore! How can I assist you with your financial needs today?' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { getAccessToken, isAuthenticated } = useAuth();

  /**
   * Send a message to the AI router
   * @param message User message content or message object
   * @param options Additional options (wantRealtime flag for market data)
   */
  const sendMessage = useCallback(async (
    message: string | { role: 'user', content: string, wantRealtime?: boolean },
    options?: ChatOptions
  ) => {
    // Normalize message format
    const userMessage: Message = typeof message === 'string' 
      ? { role: 'user', content: message }
      : message;
    
    // Extract options
    const wantRealtime = options?.wantRealtime || 
      (typeof message === 'object' && message.wantRealtime) || 
      false;

    // Update message list immediately
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Track analytics
    LogRocket.track('ai_prompt_sent', {
      provider: 'vortex_router',
      promptLength: userMessage.content.length,
      historyLength: messages.length,
      wantRealtime
    });

    try {
      // Get auth token if authenticated
      let authHeaders = {};
      if (isAuthenticated) {
        const token = await getAccessToken();
        if (token) {
          authHeaders = {
            Authorization: `Bearer ${token}`
          };
        }
      }

      // Call the new AI router function
      const response = await supabase.functions.invoke('ai-router', {
        body: { 
          messages: [...messages, userMessage],
          wantRealtime
        },
        headers: authHeaders
      });

      // Handle different response scenarios
      if (response.error) {
        console.error('Supabase function invoke error:', response.error);
        throw new Error(response.error.message || 'AI service request failed');
      }

      // Handle streaming response or regular response
      if (response.data) {
        // For non-streaming responses
        const content = response.data.response || response.data;
        if (typeof content === 'string' && content.trim()) {
          setMessages(prev => [
            ...prev, 
            { role: 'assistant', content }
          ]);
        } else {
          throw new Error('AI service returned empty or invalid response');
        }
      } else {
        throw new Error('AI service returned no data');
      }
    } catch (error) {
      console.error('Error in VortexAI chat:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'I encountered an issue processing your request. Please try again in a moment.';
      
      if (error instanceof Error) {
        if (error.message.includes('Missing') || error.message.includes('not configured')) {
          errorMessage = 'AI service is not properly configured. Please contact support.';
        } else if (error.message.includes('timeout') || error.message.includes('network')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          errorMessage = 'Authentication required. Please sign in to continue.';
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (error.message.includes('empty') || error.message.includes('invalid response')) {
          errorMessage = 'The AI service returned an unexpected response. Please try again.';
        }
      }
      
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: errorMessage
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isAuthenticated, getAccessToken]);

  /**
   * Clear the chat history
   */
  const clearChat = useCallback(() => {
    setMessages([
      { 
        role: 'assistant', 
        content: 'Welcome to VortexCore! How can I assist you with your financial needs today?' 
      }
    ]);
  }, []);

  /**
   * Specialized helper for requesting real-time market data
   */
  const askForMarketData = useCallback((query: string) => {
    return sendMessage({ role: 'user', content: query, wantRealtime: true });
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    askForMarketData
  };
}

export default useVortexChat;
