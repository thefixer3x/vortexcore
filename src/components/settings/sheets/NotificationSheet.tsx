import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface NotificationSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const NotificationSheet = ({ open, onClose, onSave }: NotificationSheetProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState(true);
  const [success, setSuccess] = useState(true);
  const [warning, setWarning] = useState(true);
  const [errorOn, setErrorOn] = useState(true);

  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("info_enabled,success_enabled,warning_enabled,error_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast({ title: "Couldn't load preferences", description: error.message, variant: "destructive" });
      } else if (data) {
        setInfo(!!data.info_enabled);
        setSuccess(!!data.success_enabled);
        setWarning(!!data.warning_enabled);
        setErrorOn(!!data.error_enabled);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, user?.id]);

  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("notification_settings")
      .upsert({
        user_id: user.id,
        info_enabled: info,
        success_enabled: success,
        warning_enabled: warning,
        error_enabled: errorOn,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    onSave();
  };

  const Row = ({ title, desc, value, onChange }: { title: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-0.5 pr-4">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.notifications_preferences.title", "Notification preferences")}</SheetTitle>
          <SheetDescription>{t("settings.notifications_preferences.description", "Choose which notifications you want to receive")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-2 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <>
              <Row title="Info updates" desc="Product news and informational messages" value={info} onChange={setInfo} />
              <Row title="Success alerts" desc="Confirmations for completed actions" value={success} onChange={setSuccess} />
              <Row title="Warnings" desc="Things that need your attention" value={warning} onChange={setWarning} />
              <Row title="Error alerts" desc="Failed operations and security issues" value={errorOn} onChange={setErrorOn} />
            </>
          )}
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} className="w-full" disabled={saving || loading}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</> : t("settings.notifications_preferences.actions.save", "Save preferences")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
