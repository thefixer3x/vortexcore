
import { LoginForm } from "@/components/auth/LoginForm";
import { NavBar } from "@/components/layout/NavBar";
import { VortexAIChat } from "@/components/ai/VortexAIChat";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  CreditCard,
  FileText,
  Banknote,
  Smartphone,
  Users
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar toggleSidebar={() => {}} />
      
      <div className="flex-1 flex flex-col md:flex-row mt-16">
        {/* Hero Section */}
        <div className="md:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-6 md:p-12 flex flex-col justify-between">
          <div className="max-w-md text-primary-foreground">
            <h1 className="text-3xl font-bold mb-4">
              All your finances in one powerful platform
            </h1>
            <p className="text-primary-foreground/80 mb-8">
              Connect all your accounts, track spending, and gain AI-powered insights to make smarter financial decisions.
            </p>
            
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="flex flex-col">
                <div className="font-medium mb-1">Multi-bank Integration</div>
                <p className="text-primary-foreground/70">Connect and manage all your accounts in one place</p>
              </div>
              <div className="flex flex-col">
                <div className="font-medium mb-1">Advanced Security</div>
                <p className="text-primary-foreground/70">Bank-level encryption and biometric authentication</p>
              </div>
              <div className="flex flex-col">
                <div className="font-medium mb-1">Smart Insights</div>
                <p className="text-primary-foreground/70">AI-powered analysis of your spending habits</p>
              </div>
              <div className="flex flex-col">
                <div className="font-medium mb-1">Seamless Payments</div>
                <p className="text-primary-foreground/70">Send money, pay bills, and schedule transfers</p>
              </div>
            </div>
          </div>
          
          {/* Value Added Services */}
          <div className="mt-12">
            <h3 className="text-primary-foreground font-medium mb-4">Value Added Services</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Button variant="secondary" size="sm" className="justify-start">
                <Banknote className="mr-2 h-4 w-4" />
                <span>Send Payment</span>
              </Button>
              <Button variant="secondary" size="sm" className="justify-start">
                <FileText className="mr-2 h-4 w-4" />
                <span>Receive Payment</span>
              </Button>
              <Button variant="secondary" size="sm" className="justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Virtual Card</span>
              </Button>
              <Button variant="secondary" size="sm" className="justify-start">
                <Banknote className="mr-2 h-4 w-4" />
                <span>Get Financing</span>
              </Button>
              <Button variant="secondary" size="sm" className="justify-start">
                <Users className="mr-2 h-4 w-4" />
                <span>Business Account</span>
              </Button>
              <Button variant="secondary" size="sm" className="justify-start">
                <Smartphone className="mr-2 h-4 w-4" />
                <span>Mobile Banking</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Login Section */}
        <div className="md:w-1/2 flex flex-col items-center justify-between py-8 px-6">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
          
          {/* Security Standards */}
          <div className="w-full max-w-md mt-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-foreground font-medium">Security & Compliance</h3>
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-sm">GDPR</div>
                <p className="text-xs text-muted-foreground">Compliant</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-sm">NDPR</div>
                <p className="text-xs text-muted-foreground">Certified</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-sm">ISO 27001</div>
                <p className="text-xs text-muted-foreground">Certified</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-sm">PCI DSS</div>
                <p className="text-xs text-muted-foreground">Compliant</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-sm">SOC 2</div>
                <p className="text-xs text-muted-foreground">Certified</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-sm">128-bit SSL</div>
                <p className="text-xs text-muted-foreground">Encryption</p>
              </div>
            </div>
          </div>
          
          {/* Partner Logos */}
          <div className="w-full max-w-md mt-12">
            <h3 className="text-foreground font-medium mb-4 text-center">Our Trusted Partners</h3>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-medium">Bank Partner</div>
              <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-medium">Fintech Co.</div>
              <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-medium">Payment Inc.</div>
              <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-medium">Credit Corp</div>
              <div className="h-8 w-24 bg-muted rounded flex items-center justify-center text-xs font-medium">Tech Partner</div>
            </div>
          </div>
          
          <div className="w-full mt-16 text-center text-sm text-muted-foreground">
            <p>
              Default Currency: <span className="font-medium">NGN (₦)</span> • Change in Settings
            </p>
          </div>
        </div>
      </div>
      
      {/* VortexAI Chat */}
      <VortexAIChat />
    </div>
  );
};

export default Index;
