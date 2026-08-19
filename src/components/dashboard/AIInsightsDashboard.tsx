import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Zap, Sparkles, TrendingUp, TrendingDown, PiggyBank, Lightbulb, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { useFinancialInsights } from "@/hooks/use-financial-insights";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TIERS } from "@/lib/subscription-tiers";
import type { PersonalizedInsight } from "@/services/personalizedAIService";

const INSIGHT_ICON = {
  spending_alert: TrendingUp,
  savings_opportunity: PiggyBank,
  investment_suggestion: Sparkles,
  budget_recommendation: Lightbulb,
} as const;

const PRIORITY_BADGE: Record<PersonalizedInsight["priority"], "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export const AIInsightsDashboard = () => {
  const { context, insights, isLoading, hasData } = useFinancialInsights();
  const { tier } = useSubscription();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  const isPro = tier === "pro" || tier === "enterprise";

  const topCategory = context
    ? Object.entries(context.monthlySpending.categories).sort(([, a], [, b]) => b - a)[0]
    : undefined;

  const totalBalance = context?.wallets.reduce((sum, w) => sum + w.balance, 0) ?? 0;

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
            {hasData && (
              <Badge variant="secondary" className="gap-1">
                <Zap className="h-3 w-3" />
                Live Analysis
              </Badge>
            )}
          </div>
        </CardHeader>

        {isLoading ? (
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Analyzing your financial data...</p>
          </CardContent>
        ) : !hasData ? (
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No financial data yet. Start by adding transactions or linking accounts.
            </p>
          </CardContent>
        ) : (
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-0">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{formatCurrency(totalBalance)}</p>
                <p className="text-xs text-muted-foreground">Total balance</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{formatCurrency(context?.monthlySpending.total ?? 0)}</p>
                <p className="text-xs text-muted-foreground">Spent in last 30 days</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{topCategory ? topCategory[0] : "—"}</p>
                <p className="text-xs text-muted-foreground">Top spending category</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {hasData && !isPro && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium">Unlock detailed VortexAI Insights</p>
                <p className="text-sm text-muted-foreground">
                  Category breakdowns and personalized recommendations are a {TIERS.pro.name} feature.
                </p>
              </div>
            </div>
            <Button size="sm" className="gap-2 shrink-0" onClick={() => navigate("/settings")}>
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade to {TIERS.pro.name}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasData && isPro && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(context?.monthlySpending.categories ?? {}).length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">No spending data available</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(context!.monthlySpending.categories)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => {
                      const percent = context!.monthlySpending.total > 0
                        ? Math.round((amount / context!.monthlySpending.total) * 100)
                        : 0;
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{category}</span>
                            <span className="text-muted-foreground">{formatCurrency(amount)} ({percent}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personalized Insights */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Smart Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  No recommendations yet — check back as you add more transactions.
                </p>
              ) : (
                <div className="space-y-3">
                  {insights.map((insight, index) => {
                    const Icon = INSIGHT_ICON[insight.type];
                    return (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="p-1.5 rounded-full bg-background shrink-0">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{insight.title}</p>
                            <Badge variant={PRIORITY_BADGE[insight.priority]} className="text-[10px] px-1.5 py-0">
                              {insight.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{insight.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Monitor */}
      <PerformanceMonitor />
    </div>
  );
};
