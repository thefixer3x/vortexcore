import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { AuthCallbackHandler } from "./components/auth/AuthCallbackHandler";
import { SignupForm } from "./components/auth/SignupPage";
import BeneficiaryManager from "./components/payments/beneficiaries/BeneficiaryManager";
import BulkUpload from "./components/payments/beneficiaries/BulkUpload";
import CategoryManager from "./components/payments/beneficiaries/CategoryManager";
import BulkPaymentDashboard from "./components/payments/bulk-payments/BulkPaymentDashboard";
import ErrorBoundary from "./components/error/ErrorBoundary";
import ProtectedLayout from "./layouts/ProtectedLayout";
import { OpenAIChat } from "./components/ai/OpenAIChat";

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
            <Route path="/auth" element={<SignupForm />} />
            <Route path="/auth/callback" element={<AuthCallbackHandler />} />

            {/* Protected app routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/virtual-cards" element={<VirtualCards />} />
              <Route
                path="/bulk-payments"
                element={<Navigate to="/profile/payments/bulk-payments" replace />}
              />
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
