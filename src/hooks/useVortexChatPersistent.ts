import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LogRocket from 'logrocket';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

interface ChatOptions {
  wantRealtime?: boolean;
}

interface ChatSession {
  id: string;
  session_name: string | null;
  messages: Message[];
  ai_model: string;
  created_at: string;
  updated_at: string;
}

/**
 * Enhanced hook for VortexAI with database persistence
 * Integrates with ai_chat_sessions table for persistent chat history
 * Supports session management, message history, and cloud sync
 */
export function useVortexChatPersistent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to VortexCore! How can I assist you with your financial needs today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const { getAccessToken, isAuthenticated, user } = useAuth();

  /**
   * Load user's chat sessions from database
   */
  const loadSessions = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  }, [isAuthenticated, user]);

  /**
   * Create a new chat session
   */
  const createNewSession = useCallback(async (sessionName?: string) => {
    if (!isAuthenticated || !user) return null;

    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert([
          {
            user_id: user.id,
            session_name: sessionName || `Chat ${new Date().toLocaleDateString()}`,
            messages: [
              {
                role: 'assistant',
                content: 'Welcome to VortexCore! How can I assist you with your financial needs today?',
                timestamp: new Date().toISOString()
              }
            ],
            ai_model: 'vortex-router'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(data.id);
      setMessages(data.messages);
      setSessions(prev => [data, ...prev]);

      return data.id;
    } catch (error) {
      console.error('Error creating new session:', error);
      return null;
    }
  }, [isAuthenticated, user]);

  /**
   * Load a specific chat session
   */
  const loadSession = useCallback(async (sessionId: string) => {
    if (!isAuthenticated) return;

    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setCurrentSessionId(sessionId);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }, [isAuthenticated, user]);

  /**
   * Save current messages to the active session
   */
  const saveSession = useCallback(async (messagesToSave?: Message[]) => {
    if (!currentSessionId || !isAuthenticated) return;

    const messagesData = messagesToSave || messages;

    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({
          messages: messagesData,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSessionId);

      if (error) throw error;

      // Update local sessions list
      setSessions(prev =>
        prev.map(session =>
          session.id === currentSessionId
            ? { ...session, messages: messagesData, updated_at: new Date().toISOString() }
            : session
        )
      );
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, [currentSessionId, isAuthenticated, messages]);

  /**
   * Send a message with database persistence
   */
  const sendMessage = useCallback(async (
    message: string | { role: 'user', content: string, wantRealtime?: boolean },
    options?: ChatOptions
  ) => {
    // Normalize message format
    const userMessage: Message = typeof message === 'string'
      ? { role: 'user', content: message, timestamp: new Date().toISOString() }
      : { ...message, timestamp: new Date().toISOString() };

    const wantRealtime = options?.wantRealtime ||
      (typeof message === 'object' && message.wantRealtime) ||
      false;

    // Update message list immediately
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Create session if none exists and user is authenticated
    let sessionId = currentSessionId;
    if (!sessionId && isAuthenticated) {
      sessionId = await createNewSession();
    }

    // Track analytics
    LogRocket.track('ai_prompt_sent', {
      provider: 'vortex_router',
      promptLength: userMessage.content.length,
      historyLength: newMessages.length,
      wantRealtime,
      sessionId
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

      // Call the AI router function
      const response = await supabase.functions.invoke('ai-router', {
        body: {
          messages: newMessages,
          wantRealtime
        },
        headers: authHeaders
      });

      if (response.data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.data.response || response.data,
          timestamp: new Date().toISOString()
        };

        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);

        // Save to database if user is authenticated
        if (sessionId) {
          await saveSession(finalMessages);
        }
      } else if (response.error) {
        throw new Error(response.error.message);
      }
    } catch (error) {
      console.error('Error in VortexAI chat:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I encountered an issue processing your request. Please try again in a moment.',
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);

      // Save error state if session exists
      if (sessionId) {
        await saveSession(finalMessages);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, isAuthenticated, getAccessToken, currentSessionId, createNewSession, saveSession]);

  /**
   * Clear the current chat and create new session
   */
  const startNewChat = useCallback(async () => {
    if (isAuthenticated) {
      await createNewSession();
    } else {
      // For non-authenticated users, just reset local state
      setMessages([
        {
          role: 'assistant',
          content: 'Welcome to VortexCore! How can I assist you with your financial needs today?',
          timestamp: new Date().toISOString()
        }
      ]);
      setCurrentSessionId(null);
    }
  }, [isAuthenticated, createNewSession]);

  /**
   * Delete a chat session
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!isAuthenticated) return;

    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== sessionId));

      // If deleting current session, start new chat
      if (sessionId === currentSessionId) {
        await startNewChat();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [isAuthenticated, user, currentSessionId, startNewChat]);

  /**
   * Rename a chat session
   */
  const renameSession = useCallback(async (sessionId: string, newName: string) => {
    if (!isAuthenticated) return;

    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({ session_name: newName })
        .eq('id', sessionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSessions(prev =>
        prev.map(session =>
          session.id === sessionId
            ? { ...session, session_name: newName }
            : session
        )
      );
    } catch (error) {
      console.error('Error renaming session:', error);
    }
  }, [isAuthenticated, user]);

  /**
   * Specialized helper for requesting real-time market data
   */
  const askForMarketData = useCallback((query: string) => {
    return sendMessage({ role: 'user', content: query, wantRealtime: true });
  }, [sendMessage]);

  // Load sessions when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSessions();
    }
  }, [isAuthenticated, user, loadSessions]);

  return {
    messages,
    isLoading,
    sendMessage,
    startNewChat,
    askForMarketData,

    // Session management
    currentSessionId,
    sessions,
    loadSession,
    deleteSession,
    renameSession,
    saveSession,

    // Utilities
    hasUnsavedChanges: currentSessionId && messages.length > 0
  };
}

export default useVortexChatPersistent;