import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, ArrowDownRight, Wallet, Plus } from "lucide-react";
import { ModernDashboardHeader } from "@/components/dashboard/ModernDashboardHeader";
import { ModernAccountCard, AddAccountCard } from "@/components/dashboard/ModernAccountCard";
import { ModernTransactionList, type DashboardTransactionItem } from "@/components/dashboard/ModernTransactionList";
import { AIInsightsDashboard } from "@/components/dashboard/AIInsightsDashboard";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { FloatingActionButton } from "@/components/dashboard/FloatingActionButton";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
// import LogRocket from "logrocket"; // Temporarily disabled
import { useDashboardData, type DashboardWallet } from "@/hooks/use-dashboard-data";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { DashboardActionDialog } from "@/components/dashboard/DashboardActionDialog";
import {
  type DashboardActionType,
  DASHBOARD_ACTIONS
} from "@/components/dashboard/action-config";
import { OBFAccountPanel } from "@/components/obf";

const ACCOUNT_COLORS = [
  "bg-gradient-to-br from-blue-500 to-blue-700",
  "bg-gradient-to-br from-green-500 to-green-700",
  "bg-gradient-to-br from-purple-500 to-purple-700",
  "bg-gradient-to-br from-indigo-500 to-indigo-700",
  "bg-gradient-to-br from-amber-500 to-orange-600"
];

const Dashboard = () => {
  const { t } = useTranslation();
  const { wallets, transactions, profile, isLoading, error, refresh } = useDashboardData();
  const { currency } = useCurrency();
  const [selectedAction, setSelectedAction] = useState<DashboardActionType | null>(null);

  const OBF_LIVE = import.meta.env.VITE_OBF_LIVE === "true";

  const hasWallets = wallets.length > 0;
  const totalBalance = useMemo(
    () => wallets.reduce((total, wallet) => total + wallet.balance, 0),
    [wallets]
  );

  const accountCards = useMemo(
    () =>
      wallets
      .filter((wallet): wallet is DashboardWallet & { id: string } => Boolean(wallet.id))
      .map((wallet, index) => ({
        id: wallet.id,
        name: index === 0 ? "Primary Wallet" : "Wallet",
        number: wallet.id.slice(-4).toUpperCase(),
        balance: wallet.balance,
        currency,
        type: index === 0 ? "Primary" : "Wallet",
        color: ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]
      })),
    [currency, wallets]
  );

  const transactionItems: DashboardTransactionItem[] = useMemo(() => {
    return transactions
      .filter((transaction): transaction is typeof transaction & { id: string } => Boolean(transaction.id))
      .map((transaction) => {
      const metadata = (transaction.metadata ?? {}) as Record<string, unknown>;
      const metadataDescription = metadata["description"];
      const metadataCategory = metadata["category"];
      const metadataCounterparty = metadata["counterparty"];
      const metadataAction = metadata["action"];

      const actionKey = typeof metadataAction === "string" ? metadataAction : undefined;
      const actionConfig = actionKey
        ? DASHBOARD_ACTIONS[actionKey as DashboardActionType]
        : undefined;
      const transactionType = transaction.type ?? "";

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
        typeLabel[transactionType] ||
        "Transaction";

      const category =
        (typeof metadataCategory === "string" && metadataCategory) ||
        actionConfig?.category ||
        typeLabel[transactionType] ||
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
        date: transaction.created_at ?? "",
        status,
        merchant,
        currency
      };
    });
  }, [currency, transactions]);

  const showSkeleton = isLoading && !hasWallets && transactions.length === 0;

  if (showSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-fade-in space-y-8">
      {error && (
        <Alert variant="destructive" className="animate-slide-up">
          <AlertTitle>{t("dashboard.balance.connect_prompt")}</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Modern Header with AI Features */}
      <div className="animate-slide-up">
        <ModernDashboardHeader
          totalBalance={totalBalance}
          currency={currency}
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

      {/* OBF Accounts — Providus via onasis-gateway (gated by VITE_OBF_LIVE) */}
      {OBF_LIVE && (
        <div className="animate-fade-in [animation-delay:0.25s]">
          <OBFAccountPanel />
        </div>
      )}

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

      {/* Wallet Ready State — shown for new users with no transactions yet */}
      {!isLoading && hasWallets && transactionItems.length === 0 && (
        <div className="animate-scale-in my-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Your wallet is ready! 🎉</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  You have {wallets.length} wallet{wallets.length > 1 ? "s" : ""} set up. Start by connecting a bank or adding your first transaction.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() => setSelectedAction("send")}
              >
                <Send className="w-4 h-4" />
                Send Money
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setSelectedAction("request")}
              >
                <ArrowDownRight className="w-4 h-4" />
                Request Payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => window.location.href = "/transactions"}
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Onboarding Flow - shows for new users with no transactions */}
      <OnboardingFlow />
    </div>
  );
};

export default Dashboard;
