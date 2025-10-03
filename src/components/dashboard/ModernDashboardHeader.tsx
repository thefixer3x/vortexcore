import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  CreditCard,
  Sparkles,
  Settings,
  TrendingUp,
  Eye,
  EyeOff,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "./NotificationCenter";

interface ModernDashboardHeaderProps {
  totalBalance: number;
  currency?: string;
  onNewTransaction?: () => void;
  userName?: string | null;
  hasWallets?: boolean;
}

const formatBalance = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency
    }).format(amount);
  } catch (error) {
    console.warn("Unable to format balance", error);
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const ModernDashboardHeader = ({
  totalBalance,
  currency = "USD",
  onNewTransaction,
  userName,
  hasWallets = false
}: ModernDashboardHeaderProps) => {
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  const displayName = useMemo(() => {
    if (userName) {
      return userName;
    }

    if (user?.name) {
      return user.name;
    }

    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "there";
  }, [userName, user]);

  return (
    <div className="space-y-6 mb-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {greeting}, {displayName}
            </h1>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Pro
            </Badge>
          </div>
          <p className="text-muted-foreground">Here's your financial overview for today</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <NotificationCenter />
          <Button size="sm" variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
          <Button
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={onNewTransaction}
            disabled={!hasWallets}
          >
            <Plus className="h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* AI Insights Card */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">AI Financial Insights</h3>
                <p className="text-sm text-muted-foreground">Powered by Claude AI</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Live
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Spending Down 12%</p>
                <p className="text-xs text-muted-foreground">vs last month</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Save ₦2,400</p>
                <p className="text-xs text-muted-foreground">on subscriptions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Investment Tip</p>
                <p className="text-xs text-muted-foreground">Ready for you</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Overview */}
      <Card className="border-0 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white/90">Total Balance</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">
              {showBalance ? formatBalance(totalBalance, currency) : "••••••"}
            </p>
            {hasWallets ? (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">Track your spending trends in real time</span>
              </div>
            ) : (
              <div className="text-sm text-white/70">
                Connect a wallet to start monitoring your balances
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
