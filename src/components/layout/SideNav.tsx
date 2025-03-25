
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
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
  X
} from "lucide-react";

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideNav({ isOpen, onClose }: SideNavProps) {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Transactions", path: "/transactions", icon: CreditCard },
    { name: "AI Insights", path: "/insights", icon: PieChart },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const secondaryNavItems = [
    { name: "User Management", path: "/users", icon: Users },
    { name: "Notifications", path: "/notifications", icon: Bell },
    { name: "Security", path: "/security", icon: ShieldCheck },
    { name: "Help & Support", path: "/help", icon: HelpCircle },
  ];

  return (
    <>
      {/* Overlay - shown only on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-background border-r border-border transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          {/* Header (mobile only) */}
          <div className="md:hidden h-16 flex items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                VC
              </div>
              <span className="font-semibold text-lg tracking-tight">
                VortexCore
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* User profile */}
          <div className="p-6 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xl font-medium mb-2">
              AV
            </div>
            <h3 className="font-medium text-foreground">Alex Volkov</h3>
            <p className="text-sm text-muted-foreground">alex@vortexcore.com</p>
          </div>
          
          {/* Main navigation */}
          <div className="px-3 py-2">
            {navItems.map((item) => (
              <Link to={item.path} key={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="lg"
                  className={`w-full justify-start mb-1 ${
                    isActive(item.path) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  }`}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
          
          {/* Secondary navigation */}
          <div className="px-3 py-2 mt-4">
            <h4 className="text-xs text-muted-foreground font-medium px-4 mb-2">
              ADDITIONAL
            </h4>
            {secondaryNavItems.map((item) => (
              <Link to={item.path} key={item.path}>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full justify-start mb-1 hover:bg-muted"
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
          
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
    </>
  );
}
