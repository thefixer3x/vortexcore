import { useState } from "react";
import { useTranslation } from "react-i18next";
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

const emptyTransactions: Transaction[] = [];

const Transactions = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState(emptyTransactions);

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
      setFilteredTransactions(emptyTransactions);
    } else {
      setFilteredTransactions([]);
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
              title={t("common.actions.back")}
            >
              <Home className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{t("transactions.title")}</h1>
          </div>
          <p className="text-muted-foreground">{t("transactions.page_subtitle")}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("transactions.actions.new")}
          </Button>
        </div>
      </div>

      <Card className="rounded-xl overflow-hidden mb-8 animate-fade-in">
        <Tabs defaultValue="all" className="w-full">
          <div className="px-6 pt-6 pb-2 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="all">{t("transactions.tabs.all")}</TabsTrigger>
                <TabsTrigger value="income">{t("transactions.tabs.income")}</TabsTrigger>
                <TabsTrigger value="expense">{t("transactions.tabs.expenses")}</TabsTrigger>
                <TabsTrigger value="pending">{t("transactions.tabs.pending")}</TabsTrigger>
              </TabsList>

              <div className="relative w-full md:w-[240px]">
                <Input
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder={t("transactions.filters.search_placeholder")}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <TabsContent value="all" className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("transactions.table.headers.date")}</TableHead>
                    <TableHead>{t("transactions.table.headers.description")}</TableHead>
                    <TableHead>{t("transactions.table.headers.category")}</TableHead>
                    <TableHead>{t("transactions.table.headers.reference")}</TableHead>
                    <TableHead className="text-right">{t("transactions.table.headers.amount")}</TableHead>
                    <TableHead className="text-right">{t("transactions.table.headers.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-32">
                        {t("transactions.table.empty")}
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
              <p className="text-muted-foreground">{t("transactions.tabs.income_empty")}</p>
            </div>
          </TabsContent>

          <TabsContent value="expense" className="m-0">
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">{t("transactions.tabs.expense_empty")}</p>
            </div>
          </TabsContent>

          <TabsContent value="pending" className="m-0">
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">{t("transactions.tabs.pending_empty")}</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Transactions;