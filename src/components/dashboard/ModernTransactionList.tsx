import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  Calendar,
  MoreHorizontal,
  ShoppingBag,
  Car,
  Home,
  Utensils,
  Coffee,
  Gamepad2,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface DashboardTransactionItem {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  status: "completed" | "pending" | "failed" | "reversed";
  currency: string;
  merchant?: string;
}

interface ModernTransactionListProps {
  transactions: DashboardTransactionItem[];
  isLoading?: boolean;
}

const getCategoryIcon = (category: string) => {
  const icons = {
    'Food': Utensils,
    'Transport': Car,
    'Entertainment': Gamepad2,
    'Utilities': Zap,
    'Shopping': ShoppingBag,
    'Housing': Home,
    'Coffee': Coffee
  };
  return icons[category as keyof typeof icons] || ShoppingBag;
};

const getCategoryColor = (category: string) => {
  const colors = {
    'Food': 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    'Transport': 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    'Entertainment': 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    'Utilities': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    'Shopping': 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    'Housing': 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    'Salary': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
  };
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400';
};

const formatAmount = (amount: number, currency: string, isIncome: boolean) => {
  try {
    const formatted = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2
    }).format(amount);

    return `${isIncome ? "+" : "-"}${formatted}`;
  } catch (error) {
    console.warn("Unable to format amount", error);
    return `${isIncome ? "+" : "-"}${currency} ${amount.toFixed(2)}`;
  }
};

export const ModernTransactionList = ({ transactions, isLoading = false }: ModernTransactionListProps) => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = useMemo(() => {
    const data = filter === 'all' ? transactions : transactions.filter((transaction) => transaction.type === filter);
    return data;
  }, [filter, transactions]);

  const isInitialLoading = isLoading && transactions.length === 0;
  const showEmptyState = !isLoading && filteredTransactions.length === 0;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Recent Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Date</span>
            </Button>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'income' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('income')}
            className="gap-1"
          >
            <ArrowDownRight className="h-3 w-3 text-green-500" />
            Income
          </Button>
          <Button
            variant={filter === 'expense' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('expense')}
            className="gap-1"
          >
            <ArrowUpRight className="h-3 w-3 text-red-500" />
            Expenses
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-0">
        <div className="space-y-1">
          {isInitialLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-dashed border-muted/40"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                    <Skeleton className="h-3 w-24 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredTransactions.map((transaction, index) => {
            const IconComponent = getCategoryIcon(transaction.category);

            const statusVariant = transaction.status === 'completed'
              ? 'secondary'
              : transaction.status === 'pending'
                ? 'outline'
                : 'destructive';

            const isIncome = transaction.type === 'income';
            const formattedAmount = formatAmount(transaction.amount, transaction.currency, isIncome);

            const transactionDate = new Date(transaction.date);
            const readableDate = Number.isNaN(transactionDate.getTime())
              ? transaction.date
              : transactionDate.toLocaleDateString();

            return (
              <div
                key={transaction.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer",
                  index === 0 && "bg-muted/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-full",
                    getCategoryColor(transaction.category)
                  )}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{transaction.description}</p>
                      <Badge
                        variant={statusVariant}
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {transaction.merchant && (
                        <>
                          <span>{transaction.merchant}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{readableDate}</span>
                      <Badge variant="outline" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={cn(
                      "font-semibold",
                      isIncome
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {formattedAmount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isIncome ? 'Credit' : 'Debit'}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="pt-4 mt-4 border-t">
          <Button variant="outline" className="w-full">
            View All Transactions
          </Button>
        </div>

        {showEmptyState && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No transactions to display yet. Complete an action to see it here.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
