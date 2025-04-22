
import React from "react";
import { FinancialOverviewCards } from "./FinancialOverviewCards";
import { CashFlowChart } from "./CashFlowChart";

interface OverviewTabContentProps {
  spendingTrend: { month: string; amount: number }[];
  formatCurrency: (value: number) => string;
}

export function OverviewTabContent({ spendingTrend, formatCurrency }: OverviewTabContentProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border p-2 rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-8 m-0">
      <FinancialOverviewCards formatCurrency={formatCurrency} />
      <CashFlowChart data={spendingTrend} CustomTooltip={CustomTooltip} />
    </div>
  );
}
