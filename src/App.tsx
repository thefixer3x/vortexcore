import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Ecosystem from "./pages/Ecosystem";
import VirtualCards from "./pages/VirtualCards";
import GeminiDemo from "./pages/GeminiDemo";
import PerplexityDemo from "./pages/PerplexityDemo";
import TestAuth from "./pages/TestAuth";
import { AuthCallbackHandler } from "./components/auth/AuthCallbackHandler";
import BeneficiaryManager from "./components/payments/beneficiaries/BeneficiaryManager";
import BulkUpload from "./components/payments/beneficiaries/BulkUpload";
import CategoryManager from "./components/payments/beneficiaries/CategoryManager";
import BulkPaymentDashboard from "./components/payments/bulk-payments/BulkPaymentDashboard";
import ErrorBoundary from "./components/error/ErrorBoundary";
import ProtectedLayout from "./layouts/ProtectedLayout";
import { OpenAIChat } from "./components/ai/OpenAIChat";
import { Home } from "lucide-react";
import { Button } from "./components/ui/button";

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
    <ErrorBoundary>
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
            <Route path="/test-auth" element={<TestAuth />} />
            
            {/* Protected app routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/users" element={<Users />} />
              <Route path="/virtual-cards" element={<VirtualCards />} />
            </Route>
            
            {/* Add temporary routes for missing pages */}
            <Route element={<ProtectedLayout />}>
              <Route path="/notifications" element={<ComingSoon title="Notifications" />} />
              <Route path="/security" element={<ComingSoon title="Security" />} />
              <Route path="/help" element={<ComingSoon title="Help & Support" />} />
            </Route>

            {/* Payment-related routes */}
            <Route path="/profile/payments" element={<ProtectedLayout />}>
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
    </ErrorBoundary>
  );
};

export default App;
