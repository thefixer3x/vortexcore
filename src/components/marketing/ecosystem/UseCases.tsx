
import { Building2, Building, Globe, ShoppingBag, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const useCases = [
  {
    icon: Building2,
    title: "Digital Banks",
    description: "Streamline onboarding, reduce fraud, and ensure compliance with automated KYC/AML processes.",
    color: "bg-blue-50 dark:bg-blue-950/20",
    iconColor: "text-blue-600 dark:text-blue-400"
  },
  {
    icon: Globe,
    title: "IMTOs",
    description: "Secure cross-border payments with real-time transaction monitoring and risk assessment.",
    color: "bg-emerald-50 dark:bg-emerald-950/20",
    iconColor: "text-emerald-600 dark:text-emerald-400"
  },
  {
    icon: ShoppingBag,
    title: "Marketplaces",
    description: "Protect buyers and sellers with fraud detection and secure payment infrastructure.",
    color: "bg-amber-50 dark:bg-amber-950/20",
    iconColor: "text-amber-600 dark:text-amber-400"
  },
  {
    icon: Building,
    title: "Fintechs",
    description: "Accelerate growth with modular financial infrastructure that scales with your business.",
    color: "bg-purple-50 dark:bg-purple-950/20",
    iconColor: "text-purple-600 dark:text-purple-400"
  },
  {
    icon: Shield,
    title: "Regulators",
    description: "Monitor compliance across financial ecosystems with powerful oversight tools.",
    color: "bg-red-50 dark:bg-red-950/20",
    iconColor: "text-red-600 dark:text-red-400"
  }
];

export const UseCases = () => {
  return (
    <section id="use-cases" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Use Cases</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trusted by a diverse range of financial institutions and platforms
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {useCases.map((useCase, index) => (
            <Card key={index} className={`border hover:shadow-md transition-all duration-300 ${index === useCases.length - 1 ? "md:col-span-3 md:max-w-md mx-auto" : ""}`}>
              <CardHeader className={`flex flex-row items-center gap-4 ${useCase.color} rounded-t-lg`}>
                <div className={`inline-flex items-center justify-center p-2 rounded-lg bg-white/50 dark:bg-black/10 ${useCase.iconColor}`}>
                  <useCase.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{useCase.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <CardDescription>{useCase.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
