import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  Home,
  CreditCard,
  PieChart,
  Settings,
  MessageSquare,
  TrendingUp,
  Wallet,
  Users,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  active?: boolean;
}

interface ResponsiveSideNavProps {
  items: NavItem[];
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

/**
 * Responsive Side Navigation with collapsible functionality
 * Automatically collapses on smaller screens and provides overlay mode
 * Includes smooth animations and proper z-index management
 */
export function ResponsiveSideNav({
  items,
  currentPath = '/',
  onNavigate,
  className
}: ResponsiveSideNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);

      // Auto-collapse on medium screens, force mobile menu on small screens
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile menu when navigating
  const handleNavigate = (path: string) => {
    onNavigate?.(path);
    setMobileMenuOpen(false);
  };

  // Toggle sidebar collapse
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Navigation item component
  const NavItem = ({ item }: { item: NavItem }) => {
    const isActive = currentPath === item.path;

    return (
      <button
        onClick={() => handleNavigate(item.path)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
          isCollapsed && !isMobile && "justify-center px-2"
        )}
        title={isCollapsed && !isMobile ? item.label : undefined}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary-foreground")} />
        {(!isCollapsed || isMobile) && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <Badge
                variant={isActive ? "secondary" : "default"}
                className="ml-auto h-5 px-1.5 text-xs"
              >
                {item.badge > 99 ? '99+' : item.badge}
              </Badge>
            )}
          </>
        )}
      </button>
    );
  };

  // Desktop sidebar content
  const SidebarContent = () => (
    <div
      className={cn(
        "relative h-full flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
        isCollapsed && !isMobile ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header with collapse toggle */}
      <div
        className={cn(
          "flex items-center border-b p-4",
          isCollapsed && !isMobile && "justify-center px-2"
        )}
      >
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">VortexCore</span>
          </div>
        )}

        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className={cn(
              "ml-auto h-8 w-8 p-0",
              isCollapsed && "ml-0"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {items.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        {(!isCollapsed || isMobile) && (
          <div className="text-xs text-muted-foreground text-center">
            VortexCore v2.0
          </div>
        )}
      </div>
    </div>
  );

  // Mobile hamburger menu
  if (isMobile) {
    return (
      <>
        {/* Mobile header with hamburger menu */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="p-0 w-64">
              <div className="h-full">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Wallet className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-bold">VortexCore</span>
          </div>

          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        {/* Mobile content padding */}
        <div className="lg:hidden h-16" />
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="hidden lg:block">
      <SidebarContent />
    </div>
  );
}

// Default navigation items for VortexCore
export const defaultNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/'
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: Wallet,
    path: '/accounts'
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: CreditCard,
    path: '/transactions'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics'
  },
  {
    id: 'insights',
    label: 'AI Insights',
    icon: TrendingUp,
    path: '/insights'
  },
  {
    id: 'chat',
    label: 'AI Assistant',
    icon: MessageSquare,
    path: '/chat',
    badge: 3
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: PieChart,
    path: '/portfolio'
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    path: '/users'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings'
  }
];

export default ResponsiveSideNav;