import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap } from "lucide-react";
import { PerformanceMonitor } from "./PerformanceMonitor";

export const AIInsightsDashboard = () => {
  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Financial Insights</CardTitle>
                <p className="text-muted-foreground">Powered by advanced analytics and machine learning</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Live Analysis
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            No financial data yet. Start by adding transactions or linking accounts.
          </p>
        </CardContent>
      </Card>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trends */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Spending Trends</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">No spending data available</p>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">No spending data available</p>
          </CardContent>
        </Card>

        {/* Savings Progress */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Savings Growth</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">No savings data available</p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Smart Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">No data to base recommendations on yet</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor />
    </div>
  );
};