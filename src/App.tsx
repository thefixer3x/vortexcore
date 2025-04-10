
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

// Create a new page for User Management
const Users = () => (
  <div className="animate-fade-in">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>
    </div>
    <div className="p-8 text-center">
      <h2 className="text-xl font-medium mb-2">User Management Coming Soon</h2>
      <p className="text-muted-foreground">This feature is currently under development.</p>
    </div>
  </div>
);

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
              
              {/* Dashboard routes with layout */}
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
              <Route 
                path="/users" 
                element={
                  <DashboardLayout>
                    <Users />
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
