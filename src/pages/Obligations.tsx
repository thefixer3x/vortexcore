import { Check, Loader2, Trash2 } from "lucide-react";
import { VortexAIIcon } from "@/components/ai/VortexAIIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useObligations, classifyObligation } from "@/hooks/use-obligations";
import { ObligationsWidget } from "@/components/dashboard/ObligationsWidget";

const stateBadge = {
  overdue: { label: "Overdue", variant: "destructive" as const },
  soon: { label: "Due soon", variant: "default" as const },
  upcoming: { label: "Upcoming", variant: "secondary" as const },
  paid: { label: "Paid", variant: "outline" as const },
};

const Obligations = () => {
  const { obligations, isLoading, isDetecting, error, detect, markPaid, remove } = useObligations();
  const { toast } = useToast();

  const runDetection = async () => {
    try {
      const r = await detect();
      toast({ title: "Scan complete", description: r.message ?? `Scanned ${r.scanned} transactions, found ${r.created} new obligations.` });
    } catch (e) {
      toast({ title: "Couldn't scan transactions", description: (e as Error).message, variant: "destructive" });
    }
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
                  <div className="flex gap-1">
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
