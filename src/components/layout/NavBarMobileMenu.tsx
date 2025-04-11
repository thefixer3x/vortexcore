
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useLocation } from "react-router-dom";

export function NavBarMobileMenu() {
  const location = useLocation();
  
  // Only use sidebar context for dashboard routes
  // This prevents the error on /ecosystem page
  const isDashboardRoute = location.pathname !== "/" && location.pathname !== "/ecosystem";
  
  // If not on a dashboard route, render a simplified version
  if (!isDashboardRoute) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
    );
  }
  
  // On dashboard routes, use the sidebar context
  const { sidebarOpen, toggleSidebar } = useSidebar();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation(); // Prevent event bubbling
        toggleSidebar();
      }}
      className="md:hidden"
      aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
    >
      {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );
}
