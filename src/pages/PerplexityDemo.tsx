import { PerplexityAIChat } from "@/components/ai/PerplexityAIChat";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PerplexityDemo = () => {
  return (
    <div className="container mx-auto py-8 animate-fade-in">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/ecosystem">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">VortexCore AI Realtime</h1>
        </div>
        
        <p className="text-muted-foreground">
          Experience the power of VortexCore's advanced AI capabilities with real-time information. 
          Our enterprise-grade language models provide up-to-date market intelligence, 
          financial news, and personalized recommendations for your business needs.
        </p>
        
        <div className="mt-4">
          <PerplexityAIChat />
        </div>
      </div>
    </div>
  );
};

export default PerplexityDemo;
