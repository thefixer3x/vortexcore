
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BellRing } from "lucide-react";
import OverviewTabContent from "./OverviewTabContent";
import { BankStatementAnalysis } from "./BankStatementAnalysis";

interface FinancialOverviewTabsProps {
  spendingTrend: { month: string; amount: number }[];
  formatCurrency: (value: number) => string;
}

export function FinancialOverviewTabs({ spendingTrend, formatCurrency }: FinancialOverviewTabsProps) {
  return (
    <Card className="rounded-xl overflow-hidden mb-8 animate-fade-in">
      <Tabs defaultValue="overview" className="w-full">
        <div className="px-6 pt-6 border-b">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold">Financial Overview</h2>
              <p className="text-muted-foreground">Track your financial health and trends</p>
            </div>
            <Badge variant="outline" className="bg-primary/5 px-3 py-1 flex items-center gap-1">
              <BellRing className="h-3 w-3" />
              <span>AI-Powered Insights</span>
            </Badge>
          </div>
          <TabsList className="mb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="savings">Savings</TabsTrigger>
            <TabsTrigger value="statements">Bank Statements</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview">
          <OverviewTabContent spendingTrend={spendingTrend} formatCurrency={formatCurrency} />
        </TabsContent>
        
        <TabsContent value="income" className="m-0">
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Income analytics will be displayed here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="expenses" className="m-0">
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Expense analytics will be displayed here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="savings" className="m-0">
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Savings analytics will be displayed here</p>
          </div>
        </TabsContent>

        <TabsContent value="statements" className="p-6">
          <BankStatementAnalysis />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
