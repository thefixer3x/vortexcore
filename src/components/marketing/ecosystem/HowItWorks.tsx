
import { ArrowDown } from "lucide-react";

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A plug-and-play financial infrastructure that integrates seamlessly with your existing systems
          </p>
        </div>
        
        <div className="relative">
          {/* API Flow Visualization */}
          <div className="grid md:grid-cols-3 gap-10 relative">
            {/* Left Column - Data Sources */}
            <div className="space-y-8">
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="font-medium mb-2">Financial Systems</h3>
                <p className="text-sm text-muted-foreground">Banking cores, payment processors, and financial data</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="font-medium mb-2">Customer Data</h3>
                <p className="text-sm text-muted-foreground">KYC information, transaction history, and user profiles</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="font-medium mb-2">Regulatory APIs</h3>
                <p className="text-sm text-muted-foreground">Compliance databases, watchlists, and reporting systems</p>
              </div>
            </div>
            
            {/* Center Column - VortexCore */}
            <div className="relative flex flex-col items-center">
              <div className="hidden md:block absolute left-0 top-1/4 w-full">
                <div className="flex items-center justify-center">
                  <ArrowDown className="h-10 w-10 text-primary/20 rotate-90 absolute -left-5" />
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                  <ArrowDown className="h-10 w-10 text-primary/20 -rotate-90 absolute -right-5" />
                </div>
              </div>
              
              <div className="hidden md:block absolute left-0 top-2/4 w-full">
                <div className="flex items-center justify-center">
                  <ArrowDown className="h-10 w-10 text-primary/20 -rotate-90 absolute -left-5" />
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                  <ArrowDown className="h-10 w-10 text-primary/20 rotate-90 absolute -right-5" />
                </div>
              </div>
              
              <div className="hidden md:block absolute left-0 top-3/4 w-full">
                <div className="flex items-center justify-center">
                  <ArrowDown className="h-10 w-10 text-primary/20 rotate-90 absolute -left-5" />
                  <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
                  <ArrowDown className="h-10 w-10 text-primary/20 -rotate-90 absolute -right-5" />
                </div>
              </div>
              
              <div className="bg-primary text-primary-foreground p-8 rounded-xl shadow-lg flex flex-col items-center justify-center h-full">
                <div className="h-16 w-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-4">
                  <div className="h-10 w-10 rounded-lg bg-primary-foreground text-primary flex items-center justify-center font-bold text-lg">
                    VC
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-3">VortexCore</h3>
                <p className="text-sm text-center text-primary-foreground/80">
                  Intelligent Financial Infrastructure
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span className="text-xs text-primary-foreground/70">Real-time Processing</span>
                </div>
              </div>
            </div>
            
            {/* Right Column - Outputs */}
            <div className="space-y-8">
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="font-medium mb-2">Risk Intelligence</h3>
                <p className="text-sm text-muted-foreground">Real-time scoring, fraud detection, and behavioral analysis</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="font-medium mb-2">Compliance Reporting</h3>
                <p className="text-sm text-muted-foreground">Automated reporting, audit trails, and regulatory documentation</p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <h3 className="font-medium mb-2">Business Insights</h3>
                <p className="text-sm text-muted-foreground">Actionable data visualizations, trends, and predictive analytics</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Enterprise-grade architecture built for scale, security, and flexibility
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
              <span>99.99% Uptime SLA</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span>Real-time Data Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-purple-500"></span>
              <span>Bank-grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-500"></span>
              <span>Flexible API Integration</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
