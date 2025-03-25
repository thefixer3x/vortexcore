
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface SpendingCategory {
  name: string;
  value: number;
  color: string;
}

const mockData: SpendingCategory[] = [
  { name: "Housing", value: 1200, color: "#3b82f6" },
  { name: "Food", value: 450, color: "#10b981" },
  { name: "Transportation", value: 350, color: "#f59e0b" },
  { name: "Utilities", value: 220, color: "#6366f1" },
  { name: "Entertainment", value: 180, color: "#ec4899" },
  { name: "Other", value: 260, color: "#8b5cf6" },
];

export function InsightWidget() {
  const total = mockData.reduce((sum, item) => sum + item.value, 0);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getPercentage = (value: number) => {
    return ((value / total) * 100).toFixed(1);
  };
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border p-2 rounded-md shadow-sm text-sm">
          <p className="font-medium">{data.name}</p>
          <p className="text-muted-foreground">
            {formatCurrency(data.value)} ({getPercentage(data.value)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border bg-card shadow-sm animate-fade-in overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h3 className="font-medium">Monthly Spending Breakdown</h3>
          <p className="text-sm text-muted-foreground">July 2023</p>
        </div>
        <Badge variant="outline" className="bg-primary/5">AI Insights</Badge>
      </div>
      
      <div className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 flex flex-col items-center justify-center">
          <div className="h-[180px] w-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {mockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-semibold">{formatCurrency(total)}</p>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Top Categories</h4>
            <div className="space-y-2">
              {mockData.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="h-3 w-3 rounded-full mr-2" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {formatCurrency(category.value)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({getPercentage(category.value)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-2 mt-4 border-t">
              <h4 className="text-sm font-medium mb-2">AI Suggestions</h4>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p>You're spending 15% more on food compared to last month. Consider setting a budget to optimize your spending.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-muted/50 border-t">
        <Button variant="ghost" size="sm" className="w-full justify-between">
          <span>View detailed insights</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
