import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2, ShieldOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { callAdmin } from "@/lib/admin-api";
import type { PricingTier } from "@/hooks/use-pricing-tiers";

type Tier = PricingTier & { previous_price_ids: string[] };

function TierEditor({ tier, onSaved, isAdmin }: { tier: Tier; onSaved: () => void; isAdmin: boolean }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...tier, price: String(tier.price), card_limit: tier.card_limit == null ? "" : String(tier.card_limit) });
  const [busy, setBusy] = useState(false);
  const isFree = tier.tier_key === "free";
  const priceChanged = Number(form.price) !== Number(tier.price) || form.currency !== tier.currency || form.billing_interval !== tier.billing_interval;

  const save = async () => {
    if (priceChanged && !isFree && !window.confirm(
      `This creates a new Stripe price for ${form.name}. New customers pay the new price; existing subscribers keep their current one. Continue?`,
    )) return;
    setBusy(true);
    try {
      await callAdmin({
        action: "save_tier", tier_key: tier.tier_key, name: form.name, price: Number(form.price), currency: form.currency,
        billing_interval: form.billing_interval, features: form.features, is_active: form.is_active,
        card_limit: form.card_limit === "" ? null : Number(form.card_limit),
      });
      toast({ title: `${form.name} plan saved` });
      onSaved();
    } catch (e) {
      toast({ title: "Couldn't save plan", description: (e as Error).message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const setFeature = (i: number, patch: Partial<{ label: string; comingSoon?: boolean }>) =>
    setForm({ ...form, features: form.features.map((f, j) => (j === i ? { ...f, ...patch } : f)) });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base capitalize">{tier.tier_key}
          {!form.is_active && <Badge variant="secondary">Hidden</Badge>}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm">
          <Label htmlFor={`active-${tier.tier_key}`} className="text-muted-foreground">Shown to customers</Label>
          <Switch id={`active-${tier.tier_key}`} checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} disabled={isFree} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_120px_90px_110px]">
          <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label className="text-xs">Price</Label><Input type="number" min={0} step="0.01" value={form.price} disabled={isFree} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div><Label className="text-xs">Currency</Label><Input value={form.currency} maxLength={3} disabled={isFree} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
          <div><Label className="text-xs">Billed</Label>
            <select aria-label="Billing interval" className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.billing_interval} disabled={isFree}
              onChange={(e) => setForm({ ...form, billing_interval: e.target.value as "month" | "year" })}>
              <option value="month">Monthly</option><option value="year">Yearly</option>
            </select>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
          <div><Label className="text-xs">Virtual card limit</Label><Input type="number" min={0} placeholder="Unlimited" value={form.card_limit} onChange={(e) => setForm({ ...form, card_limit: e.target.value })} /></div>
          <div className="text-xs text-muted-foreground sm:self-end">
            Stripe price: <code className="rounded bg-muted px-1">{tier.stripe_price_id ?? "none (free)"}</code>
            {tier.previous_price_ids.length > 0 && <> · {tier.previous_price_ids.length} earlier price{tier.previous_price_ids.length > 1 ? "s" : ""} still honoured</>}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Features</Label>
          {form.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={f.label} onChange={(e) => setFeature(i, { label: e.target.value })} aria-label={`Feature ${i + 1}`} />
              <label className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <input type="checkbox" checked={!!f.comingSoon} onChange={(e) => setFeature(i, { comingSoon: e.target.checked })} /> Coming soon
              </label>
              <Button size="icon" variant="ghost" aria-label="Remove feature" onClick={() => setForm({ ...form, features: form.features.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {form.features.length < 12 && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setForm({ ...form, features: [...form.features, { label: "" }] })}><Plus className="h-4 w-4" /> Add feature</Button>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          {priceChanged && !isFree && <span className="text-xs text-muted-foreground">A new Stripe price will be created.</span>}
          <Button onClick={save} disabled={busy || !form.name.trim() || !isAdmin} className="gap-1">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminPricing() {
  const isAdmin = useIsAdmin();
  const [tiers, setTiers] = useState<Tier[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => callAdmin<{ tiers: Tier[] }>({ action: "list_tiers" })
    .then((r) => setTiers(r.tiers.map((t) => ({ ...t, price: Number(t.price) })))).catch((e) => setError((e as Error).message));
  useEffect(() => { void load(); }, []);

  if (error) return <Card><CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent></Card>;
  if (!tiers) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <ShieldOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-700 dark:text-amber-300">Admin access required to manage pricing tiers.</span>
        </div>
      )}
      <p className="text-sm text-muted-foreground">These plans appear in Settings → Subscription. Changing a paid plan's price creates a new VortexCore price in Stripe.</p>
      {tiers.map((t) => <TierEditor key={`${t.tier_key}-${t.stripe_price_id}-${t.price}`} tier={t} onSaved={load} isAdmin={isAdmin} />)}
    </div>
  );
}
