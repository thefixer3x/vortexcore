import { useState } from "react";
import { Activity, Check, Loader2, Trash2, Wallet, Plus, AlertTriangle } from "lucide-react";
import { VortexAIIcon } from "@/components/ai/VortexAIIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useObligations, classifyObligation, type Obligation } from "@/hooks/use-obligations";
import { ObligationsWidget } from "@/components/dashboard/ObligationsWidget";
import { StatementUpload } from "@/components/obligations/StatementUpload";
import { usePaymentMethods, useFundWallet } from "@/services/paymentMethodService";
import { supabase } from "@/integrations/supabase/client";

const stateBadge = {
  overdue: { label: "Overdue", variant: "destructive" as const },
  soon: { label: "Due soon", variant: "default" as const },
  upcoming: { label: "Upcoming", variant: "secondary" as const },
  paid: { label: "Paid", variant: "outline" as const },
};

const lastPayment = (o: Obligation) => o.metadata?.payments?.slice(-1)[0];

const Obligations = () => {
  const { obligations, feed, isLoading, isDetecting, error, detect, importStatement, pay, markPaid, remove } = useObligations({ live: true });
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const fmt = (n: number | null, c?: string | null) =>
    n == null ? "" : c ? formatCurrency(n, c) : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositCurrency, setDepositCurrency] = useState("USD");
  const [depositing, setDepositing] = useState(false);
  const { data: paymentMethods = [], isLoading: loadingMethods } = usePaymentMethods();
  const fundWallet = useFundWallet();

  // Show deposit prompt when there are unpaid obligations
  const hasUnpaidObligations = obligations.some(o => o.status !== "paid" && o.amount != null && o.amount > 0);
  const defaultCard = paymentMethods.find(m => m.is_default);
  const hasSavedCard = paymentMethods.length > 0;

  const handleFund = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive number.", variant: "destructive" });
      return;
    }
    const pm = defaultCard || paymentMethods[0];
    if (!pm) {
      toast({ title: "No card on file", description: "Add a card in Settings → Payment Methods first." });
      return;
    }
    setDepositing(true);
    try {
      const result = await fundWallet.mutateAsync({
        amount,
        currency: depositCurrency,
        payment_method_id: pm.source_id,
      });
      toast({ title: "Wallet funded", description: `${formatCurrency(amount, depositCurrency)} added to your wallet.` });
      setDepositAmount("");
    } catch (e) {
      toast({ title: "Funding failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setDepositing(false);
    }
  };

  const runDetection = async () => {
    try {
      const r = await detect();
      toast({ title: "Scan complete", description: r.message ?? `Scanned ${r.scanned} transactions, found ${r.created} new obligations.` });
    } catch (e) {
      toast({ title: "Couldn't scan transactions", description: (e as Error).message, variant: "destructive" });
    }
  };

  const payNow = async (o: Obligation) => {
    if (!window.confirm(`Pay ${fmt(o.amount, o.currency)} for ${o.title} from your wallet?`)) return;
    setPayingId(o.id);
    try {
      const r = await pay(o.id);
      toast({ title: "Payment sent", description: `${fmt(r.amount, r.currency)} paid. New balance ${fmt(r.new_balance, r.currency)}.` });
    } catch (e) {
      toast({ title: "Payment failed", description: (e as Error).message, variant: "destructive" });
    } finally { setPayingId(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Obligations</h1>
          <p className="text-sm text-muted-foreground">Bills, subscriptions and repayments VortexAI found in your transactions and bank statements.</p>
        </div>
        <div className="flex gap-2">
          {hasUnpaidObligations && (
            <div className="flex items-center gap-2">
              {!hasSavedCard ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Fund wallet to pay obligations.{" "}
                  <a href="/dashboard/settings" className="text-primary underline">Add a card</a>
                </span>
              ) : (
                <div className="flex gap-2 items-center bg-muted/50 rounded-lg px-3 py-1.5">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="h-8 w-24 text-sm"
                    min="0"
                    step="0.01"
                  />
                  <select
                    value={depositCurrency}
                    onChange={(e) => setDepositCurrency(e.target.value)}
                    className="h-8 px-2 rounded border text-sm bg-background"
                  >
                    {["USD", "EUR", "GBP", "NGN", "ZAR", "KES"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    className="h-8 gap-1 text-sm"
                    disabled={depositing || !depositAmount || parseFloat(depositAmount) <= 0}
                    onClick={handleFund}
                  >
                    {depositing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    Fund
                  </Button>
                </div>
              )}
            </div>
          )}
          <Button onClick={runDetection} disabled={isDetecting} className="gap-2">
            {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <VortexAIIcon className="h-4 w-4" />}
            {isDetecting ? "Scanning…" : "Detect with VortexAI"}
          </Button>
        </div>
      </div>

      <ObligationsWidget />

      <StatementUpload onImport={importStatement} busy={isDetecting} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" /> Live feed
            <span className="relative ml-1 flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">New transactions and payments will appear here as they happen.</p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto">
              {feed.map((ev) => (
                <li key={ev.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <Badge variant={ev.kind === "paid" || ev.kind === "matched" ? "default" : "secondary"} className="capitalize">{ev.kind}</Badge>
                    {ev.message}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmt(ev.amount, ev.currency)} · {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : obligations.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No obligations yet. Import a bank statement or click "Detect with VortexAI" to scan your transactions.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {obligations.map((o) => {
            const state = stateBadge[classifyObligation(o)];
            return (
              <Card key={o.id}>
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{o.title}</span>
                      <Badge variant={state.variant}>{state.label}</Badge>
                      <Badge variant="outline" className="capitalize">{o.category}</Badge>
                      {o.recurrence !== "none" && <Badge variant="outline" className="capitalize">{o.recurrence}</Badge>}
                      {o.source === "ai" && o.confidence != null && (
                        <span className="text-xs text-muted-foreground">{Math.round(o.confidence * 100)}% confidence</span>
                      )}
                    </div>
                    {o.description && <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>}
                    {lastPayment(o) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last paid {fmt(lastPayment(o)!.amount, o.currency)} on {new Date(lastPayment(o)!.paid_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {o.amount != null && (
                      <div className="font-semibold">
                        {fmt(o.amount, o.currency)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {o.due_date ? `Due ${new Date(o.due_date).toLocaleDateString()}` : "No due date"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {o.status !== "paid" && o.amount != null && o.amount > 0 && (
                      <Button size="sm" className="gap-1" disabled={payingId === o.id} onClick={() => payNow(o)}>
                        {payingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                        Pay
                      </Button>
                    )}
                    {o.status !== "paid" && (
                      <Button size="icon" variant="ghost" aria-label="Mark as paid" onClick={() => markPaid(o.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" aria-label="Delete obligation" onClick={() => remove(o.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Obligations;
