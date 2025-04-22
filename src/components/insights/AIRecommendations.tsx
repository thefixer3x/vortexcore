
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Check, AlertTriangle } from "lucide-react";

interface AISuggestion {
  id: number;
  title: string;
  description: string;
  impact: string;
  type: string;
}

interface AIRecommendationsProps {
  suggestions: AISuggestion[];
}

export function AIRecommendations({ suggestions }: AIRecommendationsProps) {
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "saving":
        return <TrendingDown className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "opportunity":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Check className="h-5 w-5" />;
    }
  };

  return (
    <Card className="rounded-xl overflow-hidden animate-fade-in">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">AI Recommendations</h2>
          <Badge variant="secondary">{suggestions.length} new suggestions</Badge>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.id} className="border shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <Badge variant="outline" className="ml-2">
                        {suggestion.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {suggestion.description}
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">Dismiss</Button>
                      <Button size="sm">Take Action</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
}
