
import { ChevronRight, MapPin, Shield, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const EnterpriseFeatures = () => {
  const features = [{
    icon: MapPin,
    title: "Advanced Location Intelligence",
    description: "Detect and analyze user locations for enhanced security and regional compliance",
    color: "text-blue-500"
  }, {
    icon: Shield,
    title: "Enterprise Authentication",
    description: "Custom domain authentication with multi-factor authentication and social logins",
    color: "text-green-500"
  }, {
    icon: Globe,
    title: "Custom Domain Integration",
    description: "Use your own domain for all authentication flows and API endpoints",
    color: "text-purple-500"
  }, {
    icon: Lock,
    title: "Enhanced Security",
    description: "IP-based restrictions, session management, and advanced audit logs",
    color: "text-amber-500"
  }];
  
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
