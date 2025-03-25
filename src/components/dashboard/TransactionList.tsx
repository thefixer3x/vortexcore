
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Utensils,
  Smartphone,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  type: "income" | "expense";
  category: string;
  logo?: string;
}

const mockTransactions: Transaction[] = [
  {
    id: "t1",
    date: new Date(2023, 6, 15),
    description: "Grocery Store",
    amount: 86.42,
    currency: "USD",
    type: "expense",
    category: "shopping",
  },
  {
    id: "t2",
    date: new Date(2023, 6, 14),
    description: "Salary Deposit",
    amount: 3200.00,
    currency: "USD",
    type: "income",
    category: "income",
  },
  {
    id: "t3",
    date: new Date(2023, 6, 12),
    description: "Coffee Shop",
    amount: 5.25,
    currency: "USD",
    type: "expense",
    category: "food",
  },
  {
    id: "t4",
    date: new Date(2023, 6, 10),
    description: "Car Insurance",
    amount: 145.00,
    currency: "USD",
    type: "expense",
    category: "transportation",
  },
  {
    id: "t5",
    date: new Date(2023, 6, 8),
    description: "Rent Payment",
    amount: 1200.00,
    currency: "USD",
    type: "expense",
    category: "housing",
  },
  {
    id: "t6",
    date: new Date(2023, 6, 7),
    description: "Mobile Phone Bill",
    amount: 65.00,
    currency: "USD",
    type: "expense",
    category: "utilities",
  }
];

export function TransactionList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(mockTransactions);
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "shopping":
        return <ShoppingBag className="h-4 w-4" />;
      case "food":
        return <Coffee className="h-4 w-4" />;
      case "transportation":
        return <Car className="h-4 w-4" />;
      case "housing":
        return <Home className="h-4 w-4" />;
      case "utilities":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Utensils className="h-4 w-4" />;
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term === "") {
      setFilteredTransactions(mockTransactions);
    } else {
      const filtered = mockTransactions.filter(transaction => 
        transaction.description.toLowerCase().includes(term)
      );
      setFilteredTransactions(filtered);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Recent Transactions</h3>
        <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
          <Filter className="h-3 w-3" />
          <span>Filter</span>
        </Badge>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search transactions..."
          className="pl-10"
        />
      </div>
      
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="p-3 rounded-lg border bg-card flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  transaction.type === "income" 
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-primary/10 text-primary"
                }`}>
                  {transaction.type === "income" ? (
                    <ArrowDownLeft className="h-5 w-5" />
                  ) : getCategoryIcon(transaction.category)}
                </div>
                
                <div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)}
                  </div>
                </div>
              </div>
              
              <div className={`text-right ${
                transaction.type === "income" 
                  ? "text-green-600 dark:text-green-400" 
                  : ""
              }`}>
                <div className="font-medium">
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount, transaction.currency)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="text-center">
        <button className="text-sm text-primary font-medium hover:underline">
          View all transactions
        </button>
      </div>
    </div>
  );
}
