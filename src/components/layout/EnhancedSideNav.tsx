import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  PieChart, 
  Settings, 
  LogOut,
  Users,
  Bell,
  ShieldCheck,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Home
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";

import { SideNavProfile } from "./SideNavProfile";
import { SideNavSection } from "./SideNavSection";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function EnhancedSideNav() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const { theme, setTheme, toggleTheme } = useTheme();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      
      // Close sidebar with Escape on mobile
      if (event.key === 'Escape' && sidebarOpen && isMobile) {
        toggleSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen, toggleSidebar, isMobile]);

  // Handle clicks outside the sidebar to close it on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) && 
        sidebarOpen && 
        isMobile
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen, toggleSidebar, isMobile]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const timer = setTimeout(() => toggleSidebar(), 0);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, sidebarOpen, toggleSidebar, isMobile]);

  const mainNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Transactions", path: "/transactions", icon: CreditCard },
    { name: "VortexAI", path: "/insights", icon: PieChart },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "User Management", path: "/users", icon: Users },
  ];

  const secondaryNavItems = [
    { name: "Notifications", path: "/notifications", icon: Bell },
    { name: "Security", path: "/security", icon: ShieldCheck },
    { name: "Help & Support", path: "/help", icon: HelpCircle },
  ];

  const getThemeIcon = () => {
    switch (theme) {
      case "light": return Sun;
      case "dark": return Moon;
      default: return Monitor;
    }
  };

  const ThemeIcon = getThemeIcon();

  return (
    <>
      {/* Overlay - mobile only */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Enhanced Sidebar */}
      <div 
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 transition-all duration-300 ease-in-out pt-16",
          "bg-gradient-to-b from-background to-background/95 border-r border-border/50 backdrop-blur-xl",
          sidebarOpen 
            ? "w-[280px] translate-x-0 shadow-xl" 
            : "w-16 -translate-x-full md:translate-x-0 md:shadow-md",
          // Responsive behavior
          !sidebarOpen && !isMobile && "hover:w-[280px] hover:shadow-xl group"
        )}
        aria-label="Sidebar navigation"
        role="navigation"
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header with collapse button */}
          <div className={cn(
            "flex items-center justify-between p-4 border-b border-border/30",
            !sidebarOpen && !isMobile && "group-hover:justify-between"
          )}>
            <div className={cn(
              "transition-opacity duration-300",
              !sidebarOpen && !isMobile && "opacity-0 group-hover:opacity-100"
            )}>
              {sidebarOpen || (!sidebarOpen && !isMobile) ? (
                <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  VortexCore
                </h2>
              ) : null}
            </div>
            
            {/* Collapse button - always visible on desktop */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={cn(
                  "h-8 w-8 transition-transform duration-300 hover:bg-muted/50",
                  !sidebarOpen && "group-hover:opacity-100"
                )}
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Profile section */}
          <div className={cn(
            "transition-all duration-300",
            !sidebarOpen && !isMobile && "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          )}>
            {(sidebarOpen || (!sidebarOpen && !isMobile)) && <SideNavProfile />}
          </div>

          {/* Navigation sections */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className={cn(
              "transition-all duration-300",
              !sidebarOpen && !isMobile && "opacity-0 group-hover:opacity-100"
            )}>
              {(sidebarOpen || (!sidebarOpen && !isMobile)) && (
                <>
                  <SideNavSection 
                    items={mainNavItems} 
                    currentPath={location.pathname} 
                  />
                  
                  <SideNavSection 
                    title="Additional" 
                    items={secondaryNavItems} 
                    currentPath={location.pathname} 
                  />
                </>
              )}
            </div>

            {/* Collapsed state icons */}
            {!sidebarOpen && !isMobile && (
              <div className="px-3 py-2 space-y-2 group-hover:opacity-0 transition-opacity duration-300">
                {[...mainNavItems, ...secondaryNavItems].map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 mx-auto block"
                    asChild
                  >
                    <a href={item.path} title={item.name}>
                      <item.icon className="h-5 w-5" />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Bottom section with theme toggle and logout */}
          <div className="border-t border-border/30 p-4 space-y-3">
            {/* Theme selector */}
            <div className={cn(
              "flex items-center justify-between transition-all duration-300",
              !sidebarOpen && !isMobile && "opacity-0 group-hover:opacity-100"
            )}>
              {(sidebarOpen || (!sidebarOpen && !isMobile)) && (
                <>
                  <span className="text-sm font-medium text-muted-foreground">Theme</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-muted/50 transition-colors"
                      >
                        <ThemeIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                        <Monitor className="mr-2 h-4 w-4" />
                        System
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* Quick theme toggle for collapsed state */}
            {!sidebarOpen && !isMobile && (
              <div className="flex justify-center group-hover:opacity-0 transition-opacity duration-300">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8"
                  title="Toggle theme"
                >
                  <ThemeIcon className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Logout button */}
            <div className={cn(
              "transition-all duration-300",
              !sidebarOpen && !isMobile && "opacity-0 group-hover:opacity-100"
            )}>
              {(sidebarOpen || (!sidebarOpen && !isMobile)) && (
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => window.location.href = '/'}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Sign Out
                </Button>
              )}
            </div>

            {/* Collapsed logout */}
            {!sidebarOpen && !isMobile && (
              <div className="flex justify-center group-hover:opacity-0 transition-opacity duration-300">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.location.href = '/'}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating expand button - only visible when collapsed on desktop */}
      {!sidebarOpen && !isMobile && (
        <button
          onClick={toggleSidebar}
          className={cn(
            "fixed left-4 bottom-4 z-40 h-10 w-10 rounded-full transition-all duration-300",
            "bg-primary text-primary-foreground shadow-lg hover:shadow-xl",
            "flex items-center justify-center group-hover:opacity-0",
            "hover:scale-110 active:scale-95"
          )}
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
