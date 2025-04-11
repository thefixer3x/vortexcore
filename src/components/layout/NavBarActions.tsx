
import { Button } from "@/components/ui/button";
import { Bell, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { VortexAISearch } from "@/components/ai/VortexAISearch";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export function NavBarActions() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const isDashboardRoute = location.pathname !== "/" && location.pathname !== "/ecosystem";
  
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDarkMode(!isDarkMode);
  };
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Login";
      case "/dashboard":
        return "Control Room";
      case "/transactions":
        return "Transactions";
      case "/insights":
        return "VortexAI";
      case "/settings":
        return "Settings";
      case "/users":
        return "User Management";
      default:
        return "VortexCore APP";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isDashboardRoute && (
        <VortexAISearch />
      )}
      
      {isDashboardRoute && (
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
      
      {isMobile && isDashboardRoute && (
        <div className="text-sm font-medium ml-2">{getPageTitle()}</div>
      )}
    </div>
  );
}
