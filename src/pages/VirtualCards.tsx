import { VirtualCardManager } from "@/components/cards/VirtualCardManager";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, ShieldCheck } from "lucide-react";

export default function VirtualCards() {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              to="/dashboard" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Dashboard"
            >
              <Home className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Virtual Cards</h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage virtual cards for secure online payments
          </p>
        </div>
      </div>
      
      <div className="mb-8 p-4 bg-muted/50 rounded-lg border border-border flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm">
            Virtual cards provide enhanced security for online purchases. Each card can be locked or unlocked instantly, and you can set spending limits to control your budget.
          </p>
        </div>
      </div>
      
      <VirtualCardManager />
    </div>
  );
}