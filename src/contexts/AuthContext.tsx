import { createContext, useContext, useState, ReactNode, useEffect } from "react";
// import LogRocket from "logrocket";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  identifyUser: (user: User) => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state from Supabase
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        setIsLoading(true);
        
        // Get the current session
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData.session);
        
        // Set user if session exists
        if (sessionData.session?.user) {
          const supabaseUser = sessionData.session.user;
          const userData: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || undefined,
            name: supabaseUser.user_metadata?.name,
            role: supabaseUser.user_metadata?.role || 'user',
          };
          
          setUser(userData);
          
          // Identify in analytics
          // LogRocket.identify(userData.id, {
          //   name: userData.name || 'Unknown User',
          //   email: userData.email || '',
          //   role: userData.role || 'user',
          // });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Call immediately to set initial state
    checkAuthState();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        const supabaseUser = newSession.user;
        const userData: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || undefined,
          name: supabaseUser.user_metadata?.name,
          role: supabaseUser.user_metadata?.role || 'user',
        };
        
        setUser(userData);
        // LogRocket.track('user_signed_in');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // LogRocket.track('user_signed_out');
      }
    });
    
    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const identifyUser = (userData: User) => {
    // Set user in context
    setUser(userData);
    
    // Identify user in LogRocket for session tracking
    // LogRocket.identify(userData.id, {
    //   name: userData.name || 'Unknown User',
    //   email: userData.email || '',
    //   role: userData.role || 'user',
    // });
    
    // Add custom LogRocket events or tags if needed
    // LogRocket.track('user_identified');
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.session) {
        return { success: true };
      }

      return { success: false, error: 'No session created' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      // LogRocket.track('user_logged_out');
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };
  
  // Helper function to get access token for authenticated API calls
  const getAccessToken = async (): Promise<string | null> => {
    try {
      // First check if we already have a valid session
      if (session?.access_token) {
        return session.access_token;
      }
      
      // If not, try to get a fresh session
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session,
        isAuthenticated: !!user && !!session, 
        isLoading,
        identifyUser,
        signIn, 
        logout,
        getAccessToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
