
import { Link as RouterLink } from "react-router-dom";
import { ArrowRight, ChevronRight, MapPin, Shield, Globe, Lock, Award, Sparkles, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/marketing/ecosystem/HeroSection";
import { EcosystemModules } from "@/components/marketing/ecosystem/EcosystemModules";
import { HowItWorks } from "@/components/marketing/ecosystem/HowItWorks";
import { PartnerCTA } from "@/components/marketing/ecosystem/PartnerCTA";
import { Footer } from "@/components/marketing/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const EnterpriseFeatures = () => {
  const features = [
    {
      icon: MapPin,
      title: "Advanced Location Intelligence",
      description: "Detect and analyze user locations for enhanced security and regional compliance",
      color: "text-blue-500"
    },
    {
      icon: Shield,
      title: "Enterprise Authentication",
      description: "Custom domain authentication with multi-factor authentication and social logins",
      color: "text-green-500"
    },
    {
      icon: Globe,
      title: "Custom Domain Integration",
      description: "Use your own domain for all authentication flows and API endpoints",
      color: "text-purple-500"
    },
    {
      icon: Lock,
      title: "Enhanced Security",
      description: "IP-based restrictions, session management, and advanced audit logs",
      color: "text-amber-500"
    }
  ];

  return (
    <section id="enterprise" className="py-16 px-4 bg-muted/20">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Premium
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Enterprise Security Features
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Advanced security and compliance tools designed for enterprise clients
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border overflow-hidden hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${feature.color} bg-muted/50`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <span className="text-sm font-medium">Starting from ₦55,000/month</span>
                <Button variant="ghost" size="sm" className="group">
                  Learn more
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Button size="lg" className="rounded-full">
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
};

const PremiumServices = () => {
  const services = [
    {
      icon: Award,
      title: "Dedicated Support",
      description: "24/7 dedicated technical support with priority response times",
      price: "₦55,000",
      color: "text-amber-500"
    },
    {
      icon: Sparkles,
      title: "AI-Powered Insights",
      description: "Advanced analytics and predictive risk modeling for your business",
      price: "₦75,000",
      color: "text-blue-500"
    },
    {
      icon: Server,
      title: "Enterprise Infrastructure",
      description: "Dedicated servers and resources with 99.99% uptime guarantee",
      price: "₦95,000",
      color: "text-purple-500"
    }
  ];

  return (
    <section id="premium-services" className="py-16 px-4 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Services
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Premium Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tailored solutions to help your business scale and succeed
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <Card key={index} className="border-2 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
              <CardHeader>
                <div className={`inline-flex items-center justify-center p-3 rounded-full ${service.color} bg-muted/30 mb-4`}>
                  <service.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mt-4 mb-6">
                  <p className="text-3xl font-bold">{service.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                </div>
                <ul className="space-y-2">
                  {[1, 2, 3].map((_, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>Premium Feature {i + 1}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Get Started</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Add a new section for the Gemini AI Demo
const GeminiAIDemo = () => {
  return (
    <section id="gemini-demo" className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto bg-background rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="p-8 md:p-12">
              <div className="uppercase tracking-wide text-sm text-primary font-semibold mb-1">
                Enterprise AI Demo
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Experience Gemini AI
              </h2>
              <p className="text-muted-foreground mb-6">
                Try our interactive demo powered by Google's advanced Gemini AI models. 
                Discover how this technology can transform your business workflows and decision-making processes.
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <RouterLink to="/ecosystem/gemini">
                    Try Gemini AI <ArrowRight className="ml-2 h-4 w-4" />
                  </RouterLink>
                </Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/80 to-primary h-48 md:h-auto md:w-1/3 flex items-center justify-center p-8">
              <Sparkles className="h-20 w-20 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Ecosystem = () => {
  // Update document title for SEO
  document.title = "VortexCore | Enterprise Security Solutions";
  
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
            <RouterLink to="#ecosystem" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </RouterLink>
            <RouterLink to="#enterprise" className="text-sm font-medium hover:text-primary transition-colors">
              Enterprise
            </RouterLink>
            <RouterLink to="#premium-services" className="text-sm font-medium hover:text-primary transition-colors">
              Services
            </RouterLink>
            <RouterLink to="#gemini-demo" className="text-sm font-medium hover:text-primary transition-colors">
              Gemini AI
            </RouterLink>
            <RouterLink to="#partner" className="text-sm font-medium hover:text-primary transition-colors">
              Early Access
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
        
        {/* How It Works Section */}
        <HowItWorks />
        
        {/* Enterprise Features */}
        <EnterpriseFeatures />
        
        {/* Premium Services */}
        <PremiumServices />
        
        {/* Gemini AI Demo Section - New section */}
        <GeminiAIDemo />
        
        {/* Partner CTA */}
        <PartnerCTA />
      </main>
      
      <Footer />
    </div>
  );
};

export default Ecosystem;
