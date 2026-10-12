import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, ClipboardList, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useObligations } from "@/hooks/use-obligations";

export const ObligationsWidget = () => {
  const { summary, isLoading } = useObligations();
  const stats = [
    { label: "Total obligations", value: summary.total, icon: ClipboardList, tone: "text-primary" },
    { label: "Overdue", value: summary.overdue, icon: AlertTriangle, tone: "text-destructive" },
    { label: "Due in 7 days", value: summary.soon, icon: CalendarClock, tone: "text-amber-500" },
  ];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Obligations</CardTitle>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/obligations">View all <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border bg-muted/30 p-4">
            <Icon className={`h-5 w-5 ${tone}`} aria-hidden />
            <div className="mt-2 text-2xl font-semibold">{isLoading ? "–" : value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
