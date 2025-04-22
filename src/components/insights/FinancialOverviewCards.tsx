
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FinancialCardProps {
  formatCurrency: (value: number) => string;
}

export function FinancialOverviewCards({ formatCurrency }: FinancialCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Monthly Income</p>
            <p className="text-2xl font-semibold">{formatCurrency(4000)}</p>
            <div className="flex items-center text-green-500 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+5% from last month</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Monthly Expenses</p>
            <p className="text-2xl font-semibold">{formatCurrency(1900)}</p>
            <div className="flex items-center text-red-500 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12% from last month</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Savings Rate</p>
            <p className="text-2xl font-semibold">52.5%</p>
            <div className="flex items-center text-green-500 text-sm">
              <TrendingDown className="h-4 w-4 mr-1" />
              <span>-3% from last month</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
