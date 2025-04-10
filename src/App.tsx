
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/ecosystem" element={<Ecosystem />} />
              <Route path="/auth/callback" element={<AuthCallbackHandler />} />
              <Route 
                path="/dashboard" 
                element={
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/transactions" 
                element={
                  <DashboardLayout>
                    <Transactions />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/insights" 
                element={
                  <DashboardLayout>
                    <Insights />
                  </DashboardLayout>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
