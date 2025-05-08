
import { Footer } from "@/components/marketing/Footer";
import { HeroSection } from "@/components/marketing/ecosystem/HeroSection";
import { EcosystemModules } from "@/components/marketing/ecosystem/EcosystemModules";
import { HowItWorks } from "@/components/marketing/ecosystem/HowItWorks";
import { PartnerCTA } from "@/components/marketing/ecosystem/PartnerCTA";
import { EnterpriseFeatures } from "@/components/marketing/ecosystem/EnterpriseFeatures";
import { PremiumServices } from "@/components/marketing/ecosystem/PremiumServices";
import { VortexAIDemo } from "@/components/marketing/ecosystem/VortexAIDemo";
import { EcosystemHeader } from "@/components/marketing/ecosystem/EcosystemHeader";

const Ecosystem = () => {
  // Update document title for SEO
  document.title = "VortexCore | Enterprise Security Solutions";
  
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header with transparent background */}
      <EcosystemHeader />

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Ecosystem Modules */}
        <EcosystemModules />
        
        {/* How It Works Section */}
        <HowItWorks />
        
        {/* Enterprise Features */}
        <EnterpriseFeatures />
        
        {/* Premium Services */}
        <PremiumServices />
        
        {/* VortexAI Demo Section */}
        <VortexAIDemo />
        
        {/* Partner CTA */}
        <PartnerCTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default Ecosystem;
