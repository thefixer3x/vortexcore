import { useMemo, useState } from "react";
import { ModernDashboardHeader } from "@/components/dashboard/ModernDashboardHeader";
import { ModernAccountCard, AddAccountCard } from "@/components/dashboard/ModernAccountCard";
import { ModernTransactionList, type DashboardTransactionItem } from "@/components/dashboard/ModernTransactionList";
import { AIInsightsDashboard } from "@/components/dashboard/AIInsightsDashboard";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { FloatingActionButton } from "@/components/dashboard/FloatingActionButton";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import LogRocket from "logrocket"; // Temporarily disabled
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { DashboardActionDialog } from "@/components/dashboard/DashboardActionDialog";
import {
  type DashboardActionType,
  DASHBOARD_ACTIONS
} from "@/components/dashboard/action-config";

const ACCOUNT_COLORS = [
  "bg-gradient-to-br from-blue-500 to-blue-700",
  "bg-gradient-to-br from-green-500 to-green-700",
  "bg-gradient-to-br from-purple-500 to-purple-700",
  "bg-gradient-to-br from-indigo-500 to-indigo-700",
  "bg-gradient-to-br from-amber-500 to-orange-600"
];

const Dashboard = () => {
  const { wallets, transactions, profile, isLoading, error, refresh } = useDashboardData();
  const [selectedAction, setSelectedAction] = useState<DashboardActionType | null>(null);

  const hasWallets = wallets.length > 0;
  const totalBalance = useMemo(
    () => wallets.reduce((total, wallet) => total + wallet.balance, 0),
    [wallets]
  );

  const primaryCurrency = wallets[0]?.currency ?? "USD";

  const accountCards = useMemo(
    () =>
      wallets.map((wallet, index) => ({
        id: wallet.id,
        name: `${wallet.currency} Wallet`,
        number: wallet.id.slice(-4).toUpperCase(),
        balance: wallet.balance,
        currency: wallet.currency,
        type: index === 0 ? "Primary" : "Wallet",
        color: ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
      })),
    [wallets]
  );

  const transactionItems: DashboardTransactionItem[] = useMemo(() => {
    return transactions.map((transaction) => {
      const metadata = (transaction.metadata ?? {}) as Record<string, unknown>;
      const metadataDescription = metadata["description"];
      const metadataCategory = metadata["category"];
      const metadataCounterparty = metadata["counterparty"];
      const metadataAction = metadata["action"];

      const actionKey = typeof metadataAction === "string" ? metadataAction : undefined;
      const actionConfig = actionKey && DASHBOARD_ACTIONS[actionKey as DashboardActionType];

      const typeLabel: Record<string, string> = {
        deposit: "Deposit",
        withdrawal: "Withdrawal",
        transfer: "Transfer",
        payment: "Payment"
      };

      const description =
        transaction.description ||
        (typeof metadataDescription === "string" && metadataDescription) ||
        actionConfig?.label ||
        typeLabel[transaction.type] ||
        "Transaction";

      const category =
        (typeof metadataCategory === "string" && metadataCategory) ||
        actionConfig?.category ||
        typeLabel[transaction.type] ||
        "General";

      const merchant = typeof metadataCounterparty === "string" ? metadataCounterparty : undefined;

      const status =
        transaction.status === "reversed"
          ? "reversed"
          : (transaction.status as "completed" | "pending" | "failed" | "reversed");

      const type: "income" | "expense" = transaction.type === "deposit"
        ? "income"
        : transaction.type === "withdrawal"
          ? "expense"
          : transaction.type === "transfer"
            ? (actionKey === "request" ? "income" : "expense")
            : transaction.type === "payment"
              ? "expense"
              : "expense";

      return {
        id: transaction.id,
        description,
        amount: transaction.amount,
        type,
        category,
        date: transaction.created_at,
        status,
        merchant,
        currency: transaction.currency
      };
    });
  }, [transactions]);

  const showSkeleton = isLoading && !hasWallets && transactions.length === 0;

  if (showSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-fade-in space-y-8">
      {error && (
        <Alert variant="destructive" className="animate-slide-up">
          <AlertTitle>Unable to load financial data</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Modern Header with AI Features */}
      <div className="animate-slide-up">
        <ModernDashboardHeader
          totalBalance={totalBalance}
          currency={primaryCurrency}
          onNewTransaction={() => setSelectedAction("send")}
          userName={profile?.full_name || profile?.company_name || null}
          hasWallets={hasWallets}
        />
      </div>

      {/* Account Cards with Modern Design and Staggered Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {accountCards.map((account, index) => (
          <div
            key={account.id}
            className={`animate-stagger-in card-hover hover-lift ${
              index === 1 ? '[animation-delay:0.1s]' :
              index === 2 ? '[animation-delay:0.2s]' : ''
            }`}
          >
            <ModernAccountCard account={account} />
          </div>
        ))}
        {!hasWallets && (
          <div className="animate-stagger-in [animation-delay:0.3s]">
            <AddAccountCard />
          </div>
        )}
      </div>

      {/* Quick Actions Grid with Enhanced Animations */}
      <div className="animate-scale-in">
        <QuickActionsGrid
          onActionSelect={(action) => setSelectedAction(action)}
          disabled={!hasWallets}
        />
      </div>

      {/* Transactions List */}
      <div className="animate-fade-in [animation-delay:0.2s]">
        <ModernTransactionList
          transactions={transactionItems}
          isLoading={isLoading}
        />
      </div>

      {/* AI Insights - Now placed below transactions */}
      <div className="animate-fade-in [animation-delay:0.3s]">
        <AIInsightsDashboard />
      </div>

      {/* Floating Action Button for Quick Access */}
      <FloatingActionButton
        onActionSelect={(action) => setSelectedAction(action)}
        disabled={!hasWallets}
      />

      <DashboardActionDialog
        action={selectedAction}
        open={selectedAction !== null}
        onClose={() => setSelectedAction(null)}
        wallets={wallets}
        onSuccess={() => refresh()}
      />
    </div>
  );
};

export default Dashboard;