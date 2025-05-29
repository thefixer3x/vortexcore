
import { Button } from "@/components/ui/button";
import { Calendar, Download, Filter, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface InsightsHeaderProps {
  title: string;
  description: string;
}

export function InsightsHeader({ title, description }: InsightsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link 
            to="/dashboard" 
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Dashboard"
          >
            <Home className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Time Period
        </Button>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
