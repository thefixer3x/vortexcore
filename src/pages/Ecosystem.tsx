
import { Link as RouterLink } from "react-router-dom";
import { ArrowRight, ArrowDown, ChevronRight, ShieldCheck, Brain, BarChart4, FileCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HeroSection } from "@/components/marketing/ecosystem/HeroSection";
import { EcosystemModules } from "@/components/marketing/ecosystem/EcosystemModules";
import { HowItWorks } from "@/components/marketing/ecosystem/HowItWorks";
import { UseCases } from "@/components/marketing/ecosystem/UseCases";
import { PartnerCTA } from "@/components/marketing/ecosystem/PartnerCTA";
import { Footer } from "@/components/marketing/Footer";

const Ecosystem = () => {
  // Update document title for SEO
  document.title = "VortexCore | Intelligent Financial Infrastructure Platform";
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header with transparent background */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex items-center justify-between py-6 px-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
              VC
            </div>
            <span className="font-semibold text-xl tracking-tight">VortexCore</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <RouterLink to="/ecosystem" className="text-sm font-medium hover:text-primary transition-colors">
              Ecosystem
            </RouterLink>
            <RouterLink to="#use-cases" className="text-sm font-medium hover:text-primary transition-colors">
              Use Cases
            </RouterLink>
            <RouterLink to="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </RouterLink>
            <RouterLink to="#partner" className="text-sm font-medium hover:text-primary transition-colors">
              Partner With Us
            </RouterLink>
          </div>
          
          <div className="flex items-center gap-4">
            <RouterLink to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Login
            </RouterLink>
            <Button size="sm" className="rounded-full">
              Request Demo
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Ecosystem Modules */}
        <EcosystemModules />
        
        {/* How It Works */}
        <HowItWorks />
        
        {/* Use Cases */}
        <UseCases />
        
        {/* Partner CTA */}
        <PartnerCTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default Ecosystem;
