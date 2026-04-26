// OBF-001-V: Single OBF account card
// Visually distinct from internal ModernAccountCard to prevent data model confusion.

import { cn } from "@/lib/utils";
import { OBFAccount } from "@/services/obf/accounts";
import { Building2 } from "lucide-react";

interface OBFAccountCardProps {
  account: OBFAccount;
  className?: string;
}

export const OBFAccountCard = ({ account, className }: OBFAccountCardProps) => {
  const formattedBalance = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: account.currency,
    minimumFractionDigits: 2,
  }).format(account.balance);

  const asOf = new Date(account.asOf).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "rounded-xl p-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white",
        "border border-slate-700 transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            {account.type}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          ···· {account.maskedNumber.slice(-4)}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm text-slate-300 mb-1 truncate">{account.displayName}</p>
        <p className="text-xl font-bold tracking-tight">{formattedBalance}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">as of {asOf}</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-400 font-medium">
          LIVE
        </span>
      </div>
    </div>
  );
};
