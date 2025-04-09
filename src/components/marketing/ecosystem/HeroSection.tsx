
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  const scrollToEcosystem = () => {
    const ecosystemSection = document.getElementById("ecosystem");
    if (ecosystemSection) {
      ecosystemSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="min-h-[80vh] flex flex-col justify-center items-center text-center px-4 py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-4xl animate-fade-in">
        <div className="mb-3">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            Enterprise-Ready
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-foreground">
          The Future of Financial Infrastructure for Africa
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          We're building an intelligent ecosystem to power real-time compliance, risk intelligence, and fintech solutions tailored for African financial institutions.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="rounded-full flex items-center gap-2" onClick={scrollToEcosystem}>
            Explore Preview
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" className="rounded-full">
            Join Waitlist
          </Button>
        </div>
        
        <div className="mt-20 opacity-80">
          <p className="text-sm text-muted-foreground mb-3">Trusted by leading African financial institutions</p>
          <div className="flex flex-wrap justify-center gap-8">
            {['Standard Bank', 'GTBank', 'Access Bank', 'FCMB', 'Fidelity'].map((partner, index) => (
              <div key={index} className="h-10 flex items-center justify-center">
                <div className="h-8 px-6 bg-muted/40 rounded-md flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">{partner}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
