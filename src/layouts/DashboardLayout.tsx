
import { ReactNode } from "react";
import { SideNav } from "@/components/layout/SideNav";
import { NavBar } from "@/components/layout/NavBar";
import { useSidebar } from "@/contexts/SidebarContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />
      <div className="flex flex-1 pt-16 relative">
        <SideNav />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-[280px]" : ""}`}>
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
