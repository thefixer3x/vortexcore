
import { LoginForm } from "@/components/auth/LoginForm";
import { NavBar } from "@/components/layout/NavBar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar toggleSidebar={() => {}} />
      
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Hero Section */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary to-primary/80 p-12 items-center justify-center">
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
        </div>
        
        {/* Login Section */}
        <div className="md:w-1/2 flex items-center justify-center py-16 px-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Index;
