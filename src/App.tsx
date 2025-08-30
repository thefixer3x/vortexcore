import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Ecosystem from "./pages/Ecosystem";
import GeminiDemo from "./pages/GeminiDemo";
import PerplexityDemo from "./pages/PerplexityDemo";
import { AuthCallbackHandler } from "./components/auth/AuthCallbackHandler";
import BeneficiaryManager from "./components/payments/beneficiaries/BeneficiaryManager";
import BulkUpload from "./components/payments/beneficiaries/BulkUpload";
import CategoryManager from "./components/payments/beneficiaries/CategoryManager";
import BulkPaymentDashboard from "./components/payments/bulk-payments/BulkPaymentDashboard";
import ProtectedLayout from "./layouts/ProtectedLayout";
import { OpenAIChat } from "./components/ai/OpenAIChat";
import { Home } from "lucide-react";
import { Button } from "./components/ui/button";
import VirtualCards from "./pages/VirtualCards";

// Create a new page for User Management
const Users = () => (
  <div className="animate-fade-in">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>
      <Link to="/dashboard">
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 hover:bg-muted/50 transition-colors"
          title="Return to Dashboard"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      </Link>
    </div>
    <div className="p-8 text-center">
      <h2 className="text-xl font-medium mb-2">User Management Coming Soon</h2>
      <p className="text-muted-foreground">This feature is currently under development.</p>
    </div>
  </div>
);

// Temporary component for features that are coming soon
const ComingSoon = ({ title }: { title: string }) => (
  <div className="animate-fade-in">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">This feature is on the way</p>
      </div>
      <Link to="/dashboard">
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 hover:bg-muted/50 transition-colors"
          title="Return to Dashboard"
        >
          <Home className="h-4 w-4" />
          Home
        </Button>
      </Link>
    </div>
    <div className="p-8 text-center border rounded-lg shadow-sm my-8">
      <h2 className="text-xl font-medium mb-2">{title} - Coming Soon</h2>
      <p className="text-muted-foreground mb-4">This feature is currently under development and will be available in a future update.</p>
      <p className="text-sm text-muted-foreground">We appreciate your patience as we work to bring you the best experience.</p>
    </div>
  </div>
);

const App = () => {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/ecosystem" element={<Ecosystem />} />
            <Route path="/ecosystem/gemini" element={<GeminiDemo />} />
            <Route path="/ecosystem/perplexity" element={<PerplexityDemo />} />
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
            <Route 
              path="/virtual-cards" 
              element={
                <DashboardLayout>
                  <VirtualCards />
                </DashboardLayout>
              } 
            />
            
            {/* Add temporary routes for missing pages */}
            <Route 
              path="/notifications" 
              element={
                <DashboardLayout>
                  <ComingSoon title="Notifications" />
                </DashboardLayout>
              } 
            />
            <Route 
              path="/security" 
              element={
                <DashboardLayout>
                  <ComingSoon title="Security" />
                </DashboardLayout>
              } 
            />
            <Route 
              path="/help" 
              element={
                <DashboardLayout>
                  <ComingSoon title="Help & Support" />
                </DashboardLayout>
              } 
            />

            {/* Payment-related routes */}
            <Route 
              path="/profile/payments" 
              element={<ProtectedLayout />}
            >
              <Route 
                path="beneficiaries" 
                element={<BeneficiaryManager />}
              >
                <Route path="upload" element={<BulkUpload />} />
                <Route path="categories" element={<CategoryManager />} />
              </Route>
              <Route path="bulk-payments" element={<BulkPaymentDashboard />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Persistent AI Chat Bubble - available on all pages */}
          <OpenAIChat />
        </SidebarProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;