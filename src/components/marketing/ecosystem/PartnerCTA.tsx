
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PartnerCTA = () => {
  return (
    <section id="partner" className="py-24 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
          Partner With Us to Build the Future
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
          Join forces with our team to create innovative financial solutions that transform the way people and businesses manage money.
        </p>
        
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
          <h3 className="text-xl font-medium mb-4">Ready to get started?</h3>
          <p className="text-muted-foreground mb-6">
            Experience the power of VortexCore with a personalized demo tailored to your business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="w-full sm:w-auto">
              Schedule a Meeting
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
