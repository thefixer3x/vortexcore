
import { Footer } from "@/components/marketing/Footer";
import { HeroSection } from "@/components/marketing/ecosystem/HeroSection";
import { EcosystemModules } from "@/components/marketing/ecosystem/EcosystemModules";
import { HowItWorks } from "@/components/marketing/ecosystem/HowItWorks";
import { PartnerCTA } from "@/components/marketing/ecosystem/PartnerCTA";
import { EnterpriseFeatures } from "@/components/marketing/ecosystem/EnterpriseFeatures";
import { PremiumServices } from "@/components/marketing/ecosystem/PremiumServices";
import { VortexAIDemo } from "@/components/marketing/ecosystem/VortexAIDemo";
import { EcosystemHeader } from "@/components/marketing/ecosystem/EcosystemHeader";
import { Helmet } from "react-helmet-async";

const Ecosystem = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Helmet>
        <title>VortexCore Ecosystem — Enterprise Security Solutions</title>
        <meta name="description" content="Explore the VortexCore ecosystem: compliance, risk, AI, and shield modules for enterprise-grade security." />
        <link rel="canonical" href="https://vortexcore.lovable.app/ecosystem" />
        <meta property="og:title" content="VortexCore Ecosystem — Enterprise Security Solutions" />
        <meta property="og:description" content="Compliance, risk, AI, and shield modules for enterprise-grade security." />
        <meta property="og:url" content="https://vortexcore.lovable.app/ecosystem" />
      </Helmet>
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
