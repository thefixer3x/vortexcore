
import { ChevronRight, Award, Sparkles, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const PremiumServices = () => {
  const services = [{
    icon: Award,
    title: "Dedicated Support",
    description: "24/7 dedicated technical support with priority response times",
    price: "₦55,000",
    color: "text-amber-500"
  }, {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Advanced analytics and predictive risk modeling for your business",
    price: "₦75,000",
    color: "text-blue-500"
  }, {
    icon: Server,
    title: "Enterprise Infrastructure",
    description: "Dedicated servers and resources with 99.99% uptime guarantee",
    price: "₦95,000",
    color: "text-purple-500"
  }];
  
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
