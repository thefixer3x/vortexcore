
import { Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const VortexAIDemo = () => {
  return (
    <section id="vortexai-demo" className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto bg-background rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="p-8 md:p-12">
              <div className="uppercase tracking-wide text-sm text-primary font-semibold mb-1">
                Enterprise AI Demo with Real-Time Data
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                Experience VortexCore AI Realtime
              </h2>
              <p className="text-muted-foreground mb-6">
                Try our interactive demo powered by Perplexity's real-time web search technology. 
                Get instant access to the latest market data, financial news, and business intelligence for informed decision-making.
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <Link to="/ecosystem/perplexity">
                    Try VortexCore AI Realtime <Globe className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/80 to-primary h-48 md:h-auto md:w-1/3 flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-2">
                <Globe className="h-16 w-16 text-primary-foreground" />
                <Sparkles className="h-8 w-8 text-primary-foreground/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
