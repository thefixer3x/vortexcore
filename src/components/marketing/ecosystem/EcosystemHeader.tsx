
import { Link as RouterLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const EcosystemHeader = () => {
  return (
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
  );
};
