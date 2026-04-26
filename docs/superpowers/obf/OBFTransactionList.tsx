// OBF-001-V: Transaction list for a selected OBF account

import { OBFTransaction } from "@/services/obf/accounts";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface OBFTransactionListProps {
  transactions: OBFTransaction[];
  isLoading?: boolean;
}

const STATUS_VARIANT: Record<OBFTransaction["status"], "secondary" | "outline" | "destructive"> = {
  posted: "secondary",
  pending: "outline",
  failed: "destructive",
};

export const OBFTransactionList = ({
  transactions,
  isLoading,
}: OBFTransactionListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No transactions found for this account.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const isCredit = tx.direction === "credit";
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                  isCredit
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                )}
              >
                {isCredit ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{tx.description}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {tx.counterparty} ·{" "}
                  {new Date(tx.postedAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p
                className={cn(
                  "font-semibold text-sm",
                  isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {isCredit ? "+" : "−"}
                {tx.currency}{" "}
                {tx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
              <Badge variant={STATUS_VARIANT[tx.status]} className="text-xs mt-0.5">
                {tx.status}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};
