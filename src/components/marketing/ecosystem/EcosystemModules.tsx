
import { FileCheck, ShieldCheck, Brain, BarChart4, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const modules = [
  {
    icon: FileCheck,
    title: "VortexComply",
    description: "Compliance as a Service",
    content: "Streamline regulatory requirements with automated KYC/AML processes, transaction monitoring, and real-time compliance checks.",
    color: "from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    price: "₦55,000"
  },
  {
    icon: BarChart4,
    title: "VortexRisk",
    description: "Real-time risk scoring and RegTech AI",
    content: "Analyze patterns, detect fraud, and make data-driven decisions with our advanced risk scoring engine.",
    color: "from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    price: "₦65,000"
  },
  {
    icon: Brain,
    title: "VortexIQ",
    description: "Data intelligence platform",
    content: "Transform financial data into actionable insights with our AI-powered analytics and visualization tools.",
    color: "from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    price: "₦75,000"
  },
  {
    icon: ShieldCheck,
    title: "VortexShield",
    description: "Security and risk monitoring",
    content: "Protect your financial infrastructure with enterprise-grade security, continuous monitoring, and rapid incident response.",
    color: "from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    price: "₦85,000"
  }
];

export const EcosystemModules = () => {
  return (
    <section id="ecosystem" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Preview Our Ecosystem</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A sneak peek at our upcoming modular platform designed to adapt to your unique needs.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {modules.map((module, index) => (
            <Card key={index} className={`border overflow-hidden bg-gradient-to-br ${module.color} hover:shadow-md transition-all duration-300 animate-fade-in relative`} style={{animationDelay: `${index * 150}ms`}}>
              <div className="absolute top-3 right-3">
                <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium">
                  Coming Soon
                </span>
              </div>
              <CardHeader className="pb-2">
                <div className={`inline-flex items-center justify-center p-2 rounded-lg ${module.iconColor} bg-white/50 dark:bg-black/10 mb-2`}>
                  <module.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl tracking-tight">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {module.content}
                </p>
                <div className="text-sm font-semibold">
                  Starting from {module.price}/month
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="group text-sm px-0">
                  Join waitlist 
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
