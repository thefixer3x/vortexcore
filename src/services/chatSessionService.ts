import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  session_name: string | null;
  messages: ChatMessage[];
  ai_model: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service for managing AI chat sessions in the database
 * Provides clean separation of concerns for database operations
 */
export class ChatSessionService {
  /**
   * Create a new chat session for the authenticated user
   */
  static async createSession(
    userId: string,
    sessionName?: string,
    initialMessage?: ChatMessage
  ): Promise<ChatSession | null> {
    try {
      const defaultMessage: ChatMessage = {
        role: 'assistant',
        content: 'Welcome to VortexCore! How can I assist you with your financial needs today?',
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert([
          {
            user_id: userId,
            session_name: sessionName || `Chat ${new Date().toLocaleDateString()}`,
            messages: [initialMessage || defaultMessage],
            ai_model: 'vortex-router'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }

  /**
   * Get all chat sessions for a user
   */
  static async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserSessions:', error);
      return [];
    }
  }

  /**
   * Get a specific chat session by ID
   */
  static async getSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSession:', error);
      return null;
    }
  }

  /**
   * Update messages in a chat session
   */
  static async updateSessionMessages(
    sessionId: string,
    messages: ChatMessage[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({
          messages,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session messages:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSessionMessages:', error);
      return false;
    }
  }

  /**
   * Add a single message to a session
   */
  static async addMessageToSession(
    sessionId: string,
    userId: string,
    newMessage: ChatMessage
  ): Promise<boolean> {
    try {
      // First get the current session
      const session = await this.getSession(sessionId, userId);
      if (!session) return false;

      // Add the new message
      const updatedMessages = [...session.messages, newMessage];

      return await this.updateSessionMessages(sessionId, updatedMessages);
    } catch (error) {
      console.error('Error in addMessageToSession:', error);
      return false;
    }
  }

  /**
   * Rename a chat session
   */
  static async renameSession(
    sessionId: string,
    userId: string,
    newName: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({ session_name: newName })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error renaming session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in renameSession:', error);
      return false;
    }
  }

  /**
   * Delete a chat session
   */
  static async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteSession:', error);
      return false;
    }
  }

  /**
   * Get recent sessions for quick access
   */
  static async getRecentSessions(userId: string, limit: number = 5): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRecentSessions:', error);
      return [];
    }
  }

  /**
   * Search sessions by name or content
   */
  static async searchSessions(
    userId: string,
    searchTerm: string
  ): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .or(`session_name.ilike.%${searchTerm}%,messages.cs.${JSON.stringify({ content: searchTerm })}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error searching sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchSessions:', error);
      return [];
    }
  }

  /**
   * Get session statistics for a user
   */
  static async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    mostUsedModel: string;
    oldestSession: string | null;
    newestSession: string | null;
  }> {
    try {
      const sessions = await this.getUserSessions(userId);

      const totalSessions = sessions.length;
      const totalMessages = sessions.reduce((total, session) => total + session.messages.length, 0);

      // Count AI models used
      const modelCounts: Record<string, number> = {};
      sessions.forEach(session => {
        modelCounts[session.ai_model] = (modelCounts[session.ai_model] || 0) + 1;
      });

      const mostUsedModel = Object.keys(modelCounts).reduce((a, b) =>
        modelCounts[a] > modelCounts[b] ? a : b, 'vortex-router'
      );

      const oldestSession = sessions.length > 0 ? sessions[sessions.length - 1].created_at : null;
      const newestSession = sessions.length > 0 ? sessions[0].created_at : null;

      return {
        totalSessions,
        totalMessages,
        mostUsedModel,
        oldestSession,
        newestSession
      };
    } catch (error) {
      console.error('Error in getSessionStats:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        mostUsedModel: 'vortex-router',
        oldestSession: null,
        newestSession: null
      };
    }
  }
}

export default ChatSessionService;