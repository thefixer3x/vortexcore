
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  CreditCard, 
  PieChart, 
  Settings, 
  LogOut,
  Users,
  Bell,
  ShieldCheck,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { SideNavHeader } from "./SideNavHeader";
import { SideNavProfile } from "./SideNavProfile";
import { SideNavSection } from "./SideNavSection";

export function SideNav() {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && sidebarOpen) {
        toggleSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen, toggleSidebar]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  }, [location.pathname, toggleSidebar]);

  const mainNavItems = [
    { name: "Control Room", path: "/dashboard", icon: LayoutDashboard },
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

  return (
    <>
      {/* Overlay - mobile only */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 left-0 bottom-0 z-40 w-[280px] bg-background border-r border-border transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        aria-label="Sidebar navigation"
        role="navigation"
      >
        <div className="h-full flex flex-col overflow-y-auto">
          <SideNavHeader />
          <SideNavProfile />
          
          {/* Main navigation */}
          <SideNavSection 
            items={mainNavItems} 
            currentPath={location.pathname} 
          />
          
          {/* Secondary navigation */}
          <SideNavSection 
            title="Additional" 
            items={secondaryNavItems} 
            currentPath={location.pathname} 
          />
          
          {/* Bottom logout */}
          <div className="mt-auto p-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = '/'}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      
      {/* Toggle button that appears when sidebar is closed (desktop only) */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed left-4 bottom-4 z-40 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center md:flex hidden"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
