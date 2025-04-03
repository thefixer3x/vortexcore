
import { ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PartnerCTA = () => {
  return (
    <section id="partner" className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Coming Soon
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            Full Ecosystem Launch in Progress
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            We're working on expanding our ecosystem to provide even more powerful financial solutions. 
            Be the first to know when we launch new features and capabilities.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="rounded-full">
            Request Demo
          </Button>
          <Button variant="outline" size="lg" className="rounded-full flex items-center gap-2">
            Explore Docs
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="lg" className="rounded-full">
            Talk to Our Team
          </Button>
        </div>
        
        <div className="mt-16 p-8 rounded-xl bg-card border border-muted">
          <h3 className="text-xl font-medium mb-4">Join the waitlist</h3>
          <p className="text-muted-foreground mb-6">
            Get early access to our full ecosystem of financial products and services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="w-full sm:w-auto flex items-center gap-2">
              Get Early Access
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
