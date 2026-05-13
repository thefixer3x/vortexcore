import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, CheckCircle2 } from "lucide-react";

interface IntegrationsSheetProps {
  open: boolean;
  onClose: () => void;
}

type Status = {
  connected: boolean;
  label?: string | null;
  key_hint?: string | null;
  status?: string | null;
  last_verified_at?: string | null;
};

/**
 * Settings → Integrations → ChatGPT (BYOK)
 * Lets a user paste their personal OpenAI API key. Premium AI surfaces will
 * route through their key via the `vortex-ai-byok` edge function. Falls back
 * to the Lovable AI Gateway when no key is connected.
 */
export function IntegrationsSheet({ open, onClose }: IntegrationsSheetProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("Personal OpenAI key");

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("vortex_get_ai_credential_status" as any, {
      _provider: "openai",
    });
    setLoading(false);
    if (error) return;
    const row = Array.isArray(data) ? data[0] : data;
    setStatus(row ?? { connected: false });
  };

  useEffect(() => { if (open) refresh(); }, [open]);

  const connect = async () => {
    if (!apiKey.startsWith("sk-")) {
      toast({ title: "Invalid key", description: "OpenAI keys start with sk-", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("connect-openai-key", {
      body: { apiKey: apiKey.trim(), label },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast({
        title: "Could not connect",
        description: (data as any)?.error ?? error?.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }
    setApiKey("");
    toast({ title: "ChatGPT connected", description: "Premium AI surfaces will use your key." });
    refresh();
  };

  const disconnect = async () => {
    const { error } = await supabase.rpc("vortex_delete_ai_credential" as any, { _provider: "openai" });
    if (error) {
      toast({ title: "Failed to disconnect", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Disconnected" });
    refresh();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Connect ChatGPT</SheetTitle>
          <SheetDescription>
            Use your own OpenAI account for Premium AI surfaces. Your key is encrypted at rest
            and never exposed to the browser.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
            </div>
          ) : status.connected ? (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{status.label ?? "OpenAI"}</span>
                </div>
                <Badge variant={status.status === "active" ? "default" : "destructive"}>
                  {status.status ?? "active"}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Key: {status.key_hint}</div>
                {status.last_verified_at && (
                  <div>Last verified: {new Date(status.last_verified_at).toLocaleString()}</div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={disconnect}>Disconnect</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Create an API key on OpenAI <ExternalLink className="h-3 w-3" />
                </a>
                , then paste it below.
              </div>
              <div className="space-y-2">
                <Label htmlFor="byok-label">Label</Label>
                <Input id="byok-label" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="byok-key">API key</Label>
                <Input
                  id="byok-key"
                  type="password"
                  placeholder="sk-…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <Button onClick={connect} disabled={saving || !apiKey} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect ChatGPT
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}