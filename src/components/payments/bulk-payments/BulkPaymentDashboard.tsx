import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useBulkPayments, type BulkRecipientInput } from "@/hooks/use-bulk-payments";
import { BulkPaymentForm } from "./BulkPaymentForm";
import { BulkPaymentHistory } from "./BulkPaymentHistory";

const RECIPIENT_LIMITS = {
  free: 5,
  pro: 50,
  enterprise: Infinity
} as const;

export default function BulkPaymentDashboard() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { tier } = useSubscription();
  const { wallet, batches, isLoading, error, isSubmitting, submitBatch } = useBulkPayments();

  const recipientLimit = RECIPIENT_LIMITS[tier];

  const handleSubmit = async (items: BulkRecipientInput[]) => {
    try {
      const { batchId } = await submitBatch(items, currency);
      toast({
        title: "Batch submitted",
        description: `${items.length} payment(s) queued as pending (${batchId}).`
      });
    } catch (err) {
      console.error("Failed to submit bulk payment batch", err);
      toast({
        title: "Unable to submit batch",
        description: err instanceof Error ? err.message : "Please try again later",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription>Log in to send bulk payments.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Bulk Payments</h1>
        <p className="text-muted-foreground">
          Pay multiple recipients in one batch. Every payment is recorded as a pending transaction
          against your wallet, same as a single transfer.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn't load bulk payment data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="new" className="space-y-4">
          <TabsList>
            <TabsTrigger value="new">New batch</TabsTrigger>
            <TabsTrigger value="history">History ({batches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <BulkPaymentForm
              tier={tier}
              recipientLimit={recipientLimit}
              walletBalance={wallet?.balance ?? null}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          </TabsContent>

          <TabsContent value="history">
            <BulkPaymentHistory batches={batches} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
