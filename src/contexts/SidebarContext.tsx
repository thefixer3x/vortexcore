
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type SidebarContextType = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Cookie name for persisting sidebar state
const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize from cookie if available
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof document !== 'undefined') {
      const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(SIDEBAR_COOKIE_NAME));
      
      if (cookie) {
        const value = cookie.split('=')[1];
        return value === 'true';
      }
    }
    return true; // Default to open on desktop
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const newState = !prev;
      // Set cookie to persist state
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${newState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      return newState;
    });
  };

  // Effect to close sidebar on mobile by default - run only on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    // Check on mount
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array so it only runs on mount

  return (
    <SidebarContext.Provider value={{ sidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  
  // Enhanced error handling with more informative message
  if (context === undefined) {
    console.error("SidebarContext Error: useSidebar() was called outside of SidebarProvider. Check your component hierarchy.");
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  
  return context;
}
