
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X, Bell, Sun, Moon } from "lucide-react";
import { VortexAISearch } from "@/components/ai/VortexAISearch";
import { useSidebar } from "@/contexts/SidebarContext";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDarkMode(!isDarkMode);
  };

  const isActive = (path: string) => location.pathname === path;
  
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

  const isDashboardRoute = location.pathname !== "/" && location.pathname !== "/ecosystem";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className={`flex items-center justify-between px-4 h-16 ${
        isDashboardRoute && isOpen && !isMobile ? "md:ml-[280px]" : ""
      }`}>
        <div className="flex items-center gap-3">
          {isDashboardRoute && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden"
              aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              VC
            </div>
            {!isMobile && (
              <span className="font-semibold text-lg tracking-tight">
                VortexCore
              </span>
            )}
          </div>
        </div>
        
        {isDashboardRoute && (
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard">
              <Button
                variant={isActive("/dashboard") ? "default" : "ghost"}
                size="sm"
                className={`rounded-full px-4 ${isActive("/dashboard") ? "" : "hover:bg-muted"}`}
              >
                Control Room
              </Button>
            </Link>
            <Link to="/transactions">
              <Button
                variant={isActive("/transactions") ? "default" : "ghost"}
                size="sm"
                className={`rounded-full px-4 ${isActive("/transactions") ? "" : "hover:bg-muted"}`}
              >
                Transactions
              </Button>
            </Link>
            <Link to="/insights">
              <Button
                variant={isActive("/insights") ? "default" : "ghost"}
                size="sm"
                className={`rounded-full px-4 ${isActive("/insights") ? "" : "hover:bg-muted"}`}
              >
                VortexAI
              </Button>
            </Link>
            <Link to="/settings">
              <Button
                variant={isActive("/settings") ? "default" : "ghost"}
                size="sm"
                className={`rounded-full px-4 ${isActive("/settings") ? "" : "hover:bg-muted"}`}
              >
                Settings
              </Button>
            </Link>
            <Link to="/users">
              <Button
                variant={isActive("/users") ? "default" : "ghost"}
                size="sm"
                className={`rounded-full px-4 ${isActive("/users") ? "" : "hover:bg-muted"}`}
              >
                Users
              </Button>
            </Link>
          </div>
        )}

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
      </div>
    </div>
  );
}
