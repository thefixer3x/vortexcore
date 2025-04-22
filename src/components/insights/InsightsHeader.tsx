
import { Button } from "@/components/ui/button";
import { Calendar, Download, Filter } from "lucide-react";

interface InsightsHeaderProps {
  title: string;
  description: string;
}

export function InsightsHeader({ title, description }: InsightsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
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
