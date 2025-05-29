import { useState } from "react";
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

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  merchant?: string;
  icon?: typeof ShoppingBag;
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    description: "Salary Payment",
    amount: 450000,
    type: "income",
    category: "Salary",
    date: "2024-01-15",
    status: "completed",
    merchant: "Acme Corp"
  },
  {
    id: "2", 
    description: "Grocery Shopping",
    amount: 12500,
    type: "expense",
    category: "Food",
    date: "2024-01-14",
    status: "completed",
    merchant: "Shoprite",
    icon: ShoppingBag
  },
  {
    id: "3",
    description: "Uber Ride",
    amount: 2800,
    type: "expense", 
    category: "Transport",
    date: "2024-01-14",
    status: "completed",
    merchant: "Uber",
    icon: Car
  },
  {
    id: "4",
    description: "Netflix Subscription",
    amount: 4900,
    type: "expense",
    category: "Entertainment",
    date: "2024-01-13",
    status: "completed",
    merchant: "Netflix",
    icon: Gamepad2
  },
  {
    id: "5",
    description: "Electricity Bill",
    amount: 15600,
    type: "expense",
    category: "Utilities",
    date: "2024-01-12",
    status: "pending",
    merchant: "PHCN",
    icon: Zap
  }
];

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

export const ModernTransactionList = () => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  const filteredTransactions = mockTransactions.filter(transaction => 
    filter === 'all' || transaction.type === filter
  );

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
          {filteredTransactions.map((transaction, index) => {
            const IconComponent = transaction.icon || getCategoryIcon(transaction.category);
            
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
                        variant={transaction.status === 'completed' ? 'secondary' : 
                                transaction.status === 'pending' ? 'outline' : 'destructive'}
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{transaction.merchant}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
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
                      transaction.type === 'income' 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {transaction.type === 'income' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.type === 'income' ? 'Credit' : 'Debit'}
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
      </CardContent>
    </Card>
  );
};
