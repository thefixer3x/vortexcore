
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    number: string;
    balance: number;
    currency: string;
    type: string;
    bankLogo?: string;
    color?: string;
  };
  className?: string;
}

export function AccountCard({ account, className }: AccountCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  const getAccountTypeIcon = (type: string) => {
    // Future: choose icon by type
    switch (type?.toLowerCase()) {
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };
  
  const getCardBackground = () => {
    if (account.color) return account.color;
    
    // Default gradient colors based on account type
    const gradients: Record<string, string> = {
      checking: "from-blue-500 to-blue-700",
      savings: "from-green-500 to-green-700",
      credit: "from-purple-500 to-purple-700",
      investment: "from-amber-500 to-amber-700",
    };
    
    return `bg-gradient-to-br ${gradients[account.type.toLowerCase()] || "from-gray-700 to-gray-900"}`;
  };
  
  const maskAccountNumber = (number: string) => {
    if (!number) return "••••";
    return "•••• " + number.slice(-4);
  };

  return (
    <div 
      className={cn(
        "rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]",
        className
      )}
    >
      <div className={`p-6 text-white ${getCardBackground()}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            {getAccountTypeIcon(account.type)}
            <span className="ml-2 text-sm font-medium opacity-90">
              {account.type}
            </span>
          </div>
          {account.bankLogo ? (
            <img src={account.bankLogo} alt="Bank logo" className="h-6" />
          ) : (
            <div className="h-5 w-10 rounded bg-white/20 backdrop-blur-sm"></div>
          )}
        </div>
        
        <div className="mb-6">
          <div className="text-sm font-medium opacity-90 mb-1">{account.name}</div>
          <div className="font-mono text-lg">{maskAccountNumber(account.number)}</div>
        </div>
        
        <div className="flex flex-col">
          <div className="text-sm opacity-90">Available Balance</div>
          <div className="text-2xl font-semibold mt-1">
            {formatCurrency(account.balance, account.currency)}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-card flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Last activity: Today
        </span>
        <button className="text-sm font-medium text-primary hover:underline">
          View Details
        </button>
      </div>
    </div>
  );
}
