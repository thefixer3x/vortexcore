import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  Calendar,
  Plus,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Utensils,
  Smartphone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  type: "income" | "expense";
  category: string;
  status?: string;
  reference?: string;
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
    reference: "POS-87654321",
    status: "Completed",
  },
  {
    id: "t2",
    date: new Date(2023, 6, 14),
    description: "Salary Deposit",
    amount: 3200.00,
    currency: "USD",
    type: "income",
    category: "income",
    reference: "DE-09876543",
    status: "Completed",
  },
  {
    id: "t3",
    date: new Date(2023, 6, 12),
    description: "Coffee Shop",
    amount: 5.25,
    currency: "USD",
    type: "expense",
    category: "food",
    reference: "POS-87654300",
    status: "Completed",
  },
  {
    id: "t4",
    date: new Date(2023, 6, 10),
    description: "Car Insurance",
    amount: 145.00,
    currency: "USD",
    type: "expense",
    category: "transportation",
    reference: "ACH-98765432",
    status: "Completed",
  },
  {
    id: "t5",
    date: new Date(2023, 6, 8),
    description: "Rent Payment",
    amount: 1200.00,
    currency: "USD",
    type: "expense",
    category: "housing",
    reference: "ACH-12345678",
    status: "Completed",
  },
  {
    id: "t6",
    date: new Date(2023, 6, 7),
    description: "Mobile Phone Bill",
    amount: 65.00,
    currency: "USD",
    type: "expense",
    category: "utilities",
    reference: "ACH-76543210",
    status: "Completed",
  },
  {
    id: "t7",
    date: new Date(2023, 6, 5),
    description: "Pharmacy",
    amount: 32.50,
    currency: "USD",
    type: "expense",
    category: "health",
    reference: "POS-54321098",
    status: "Completed",
  },
  {
    id: "t8",
    date: new Date(2023, 6, 3),
    description: "Freelance Payment",
    amount: 750.00,
    currency: "USD",
    type: "income",
    category: "income",
    reference: "DE-65432109",
    status: "Completed",
  },
];

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions);
  
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
      day: 'numeric',
      year: 'numeric'
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
        transaction.description.toLowerCase().includes(term) ||
        transaction.category.toLowerCase().includes(term)
      );
      setFilteredTransactions(filtered);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              to="/dashboard" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Back to Dashboard"
            >
              <Home className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          </div>
          <p className="text-muted-foreground">Manage and analyze your financial activities</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>
      
      <Card className="rounded-xl overflow-hidden mb-8 animate-fade-in">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-6 pt-6 pb-2 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expenses</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <div className="relative w-full md:w-auto">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search transactions..."
                    className="pl-10 w-full md:w-[240px]"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <TabsContent value="all" className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-32">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-muted/50 cursor-pointer">
                        <TableCell className="font-medium">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              transaction.type === "income" 
                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-primary/10 text-primary"
                            }`}>
                              {transaction.type === "income" ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : getCategoryIcon(transaction.category)}
                            </div>
                            <span>{transaction.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {transaction.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {transaction.reference}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          transaction.type === "income" 
                            ? "text-green-600 dark:text-green-400" 
                            : ""
                        }`}>
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="text-xs">
                            {transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="income" className="m-0">
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Income transactions will be displayed here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="expense" className="m-0">
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Expense transactions will be displayed here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="pending" className="m-0">
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Pending transactions will be displayed here</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Transactions;
