// OBF-001-V: Container panel for OBF accounts + transactions
// Renders only when VITE_OBF_LIVE=true (enforced by hook's `enabled` flag).
// Handles its own loading/error states — never crashes the parent Dashboard.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertCircle, Wifi } from "lucide-react";
import { OBFAccountCard } from "./OBFAccountCard";
import { OBFTransactionList } from "./OBFTransactionList";
import { useOBFAccounts, useOBFTransactions } from "@/hooks/use-obf-accounts";

export const OBFAccountPanel = () => {
  const {
    data: accounts,
    isLoading: accountsLoading,
    error: accountsError,
    refetch,
    isFetching,
  } = useOBFAccounts();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Auto-select first account when data arrives
  const activeAccountId = selectedAccountId ?? accounts?.[0]?.id ?? null;

  const { data: transactions, isLoading: txLoading } = useOBFTransactions(activeAccountId);

  const errorMessage =
    accountsError instanceof Error
      ? accountsError.message
      : accountsError
      ? "Unable to load OBF accounts. Please try again."
      : null;

  return (
    <Card className="border border-border/60 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-lg font-semibold">OBF Accounts</CardTitle>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              · Providus via onasis-gateway
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Error state — inline, no crash */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Loading skeletons */}
        {accountsLoading && !accounts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[148px] rounded-xl" />
            ))}
          </div>
        )}

        {/* Account cards */}
        {accounts && accounts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  aria-pressed={activeAccountId === account.id}
                >
                  <OBFAccountCard
                    account={account}
                    className={
                      activeAccountId === account.id
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "opacity-80 hover:opacity-100"
                    }
                  />
                </button>
              ))}
            </div>

            {/* Transaction list for selected account */}
            {activeAccountId && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Transactions ·{" "}
                  {accounts.find((a) => a.id === activeAccountId)?.displayName}
                </p>
                <OBFTransactionList
                  transactions={transactions ?? []}
                  isLoading={txLoading}
                />
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!accountsLoading && !errorMessage && accounts?.length === 0 && (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No OBF accounts found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
