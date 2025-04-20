import { LoginForm } from "@/components/auth/LoginForm";
import { VortexAIChat } from "@/components/ai/VortexAIChat";
import { SecurityBadges } from "@/components/marketing/SecurityBadges";
import { PartnerLogos } from "@/components/marketing/PartnerLogos";
import { ValueAddedServices } from "@/components/marketing/ValueAddedServices";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-6 px-4 md:px-8 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-md">
              VC
            </div>
            <span className="font-semibold text-xl tracking-tight">VortexCore</span>
          </div>
          <button className="flex items-center justify-center h-10 w-10 rounded-md focus:outline-none focus:ring-2 focus:ring-ring md:hidden" aria-label="Menu">
            <Menu className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>
        <div className="container mx-auto items-center justify-between hidden md:flex">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              VC
            </div>
            <span className="font-semibold text-xl tracking-tight">VortexCore</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/ecosystem" className="text-sm font-medium hover:underline mr-2">Ecosystem</Link>
            <a href="#" className="text-sm font-medium hover:underline">Features</a>
            <a href="#" className="text-sm font-medium hover:underline">Pricing</a>
            <a href="#" className="text-sm font-medium hover:underline">Support</a>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 lg:py-16 flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-20">
        <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              Take control of your financial ecosystem
            </h1>
            <p className="text-lg text-muted-foreground">
              Link all your accounts, manage transactions, and get AI-powered financial insights with our secure and intelligent banking aggregation platform.
            </p>
          </div>

          <SecurityBadges />

          <ValueAddedServices />

          <PartnerLogos />
        </div>

        <div className="order-1 md:order-2 w-full md:w-1/2 flex items-center justify-center md:justify-end">
          <div className="w-full max-w-md p-6 rounded-xl border bg-card shadow-lg animate-fade-in">
            <LoginForm />
          </div>
        </div>
      </main>
      
      <VortexAIChat />
    </div>
  );
};

export default Index;
