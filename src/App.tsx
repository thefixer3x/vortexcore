
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SideNav } from "@/components/layout/SideNav";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Ecosystem from "./pages/Ecosystem";
import { AuthCallbackHandler } from "./components/auth/AuthCallbackHandler";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/ecosystem" element={<Ecosystem />} />
              <Route path="/auth/callback" element={<AuthCallbackHandler />} />
              <Route 
                path="/dashboard" 
                element={
                  <DashboardLayout toggleSidebar={toggleSidebar} isOpen={sidebarOpen}>
                    <Dashboard />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/transactions" 
                element={
                  <DashboardLayout toggleSidebar={toggleSidebar} isOpen={sidebarOpen}>
                    <Transactions />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/insights" 
                element={
                  <DashboardLayout toggleSidebar={toggleSidebar} isOpen={sidebarOpen}>
                    <Insights />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <DashboardLayout toggleSidebar={toggleSidebar} isOpen={sidebarOpen}>
                    <Settings />
                  </DashboardLayout>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Dashboard Layout with collapsible sidebar
interface DashboardLayoutProps {
  children: React.ReactNode;
  toggleSidebar: () => void;
  isOpen: boolean;
}

const DashboardLayout = ({ children, toggleSidebar, isOpen }: DashboardLayoutProps) => {
  return (
    <>
      <NavBar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 pt-16">
        <SideNav isOpen={isOpen} onClose={() => toggleSidebar()} />
        <main className={`flex-1 transition-all duration-300 ${isOpen ? "md:pl-[280px]" : ""}`}>
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

// Import at the top to avoid circular dependencies
import { NavBar } from "./components/layout/NavBar";

export default App;
