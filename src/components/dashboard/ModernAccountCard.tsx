import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Copy,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  name: string;
  number: string;
  balance: number;
  currency: string;
  type: string;
  color: string;
  change?: number;
  changePercent?: number;
  isPositive?: boolean;
}

interface ModernAccountCardProps {
  account: Account;
  className?: string;
}

export const ModernAccountCard = ({ account, className }: ModernAccountCardProps) => {
  const [showBalance, setShowBalance] = useState(true);
  
  return (
    <Card className={cn(
      "group relative overflow-hidden border-0 bg-gradient-to-br hover:shadow-xl transition-all duration-500 hover:scale-[1.02] animate-gradient", 
      account.color,
      "min-h-[180px] sm:min-h-[200px]", // Responsive height
      className
    )}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/5 dark:bg-white/5" />
      <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-xl" />
      <div className="absolute -bottom-4 -left-4 w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-full blur-lg" />
      
      <CardContent className="relative p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              {account.type === 'Credit' ? (
                <CreditCard className="h-4 w-4" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white/90">{account.name}</h3>
              <p className="text-xs text-white/60">••••{account.number}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold">
              {showBalance 
                ? `${account.currency} ${account.balance.toLocaleString()}`
                : `${account.currency} ••••••`
              }
            </p>
            {account.change && (
              <div className="flex items-center gap-1 mt-1">
                {account.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-200" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-200" />
                )}
                <span className={cn(
                  "text-xs font-medium",
                  account.isPositive ? "text-green-200" : "text-red-200"
                )}>
                  {account.isPositive ? '+' : ''}{account.change?.toLocaleString()} ({account.changePercent}%)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Send
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              <ArrowDownRight className="h-3 w-3 mr-1" />
              Receive
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm px-3"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Account Type Badge */}
        <Badge 
          variant="secondary" 
          className="absolute top-4 right-4 bg-white/20 text-white border-0 backdrop-blur-sm"
        >
          {account.type}
        </Badge>

        {/* Quick Action Indicator */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const AddAccountCard = () => {
  return (
    <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-all duration-300 group hover:shadow-lg">
      <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
        <div className="p-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 mb-4 group-hover:scale-110 transition-transform">
          <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="font-semibold mb-2">Connect New Account</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          Link your bank account to get a complete view of your finances
        </p>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </CardContent>
    </Card>
  );
};
