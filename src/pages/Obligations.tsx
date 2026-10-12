import { useState } from "react";
import { Activity, Check, Loader2, Trash2, Wallet } from "lucide-react";
import { VortexAIIcon } from "@/components/ai/VortexAIIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useObligations, classifyObligation, type Obligation } from "@/hooks/use-obligations";
import { ObligationsWidget } from "@/components/dashboard/ObligationsWidget";

const stateBadge = {
  overdue: { label: "Overdue", variant: "destructive" as const },
  soon: { label: "Due soon", variant: "default" as const },
  upcoming: { label: "Upcoming", variant: "secondary" as const },
  paid: { label: "Paid", variant: "outline" as const },
};

const fmt = (n: number | null, c?: string | null) =>
  n == null ? "" : new Intl.NumberFormat(undefined, { style: "currency", currency: c || "NGN" }).format(n);
const lastPayment = (o: Obligation) => o.metadata?.payments?.at(-1);

const Obligations = () => {
  const { obligations, feed, isLoading, isDetecting, error, detect, pay, markPaid, remove } = useObligations({ live: true });
  const { toast } = useToast();
  const [payingId, setPayingId] = useState<string | null>(null);

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
          <p className="text-sm text-muted-foreground">Bills, subscriptions and repayments VortexAI found in your transactions.</p>
        </div>
        <Button onClick={runDetection} disabled={isDetecting} className="gap-2">
          {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <VortexAIIcon className="h-4 w-4" />}
          {isDetecting ? "Scanning…" : "Detect with VortexAI"}
        </Button>
      </div>

      <ObligationsWidget />

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
          No obligations yet. Click "Detect with VortexAI" to scan your transactions.
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
                        {new Intl.NumberFormat(undefined, { style: "currency", currency: o.currency || "NGN" }).format(o.amount)}
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
