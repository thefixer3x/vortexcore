import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ProfileSheet = ({ open, onClose, onSave }: ProfileSheetProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name,last_name,email,company_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast({ title: "Couldn't load profile", description: error.message, variant: "destructive" });
      } else if (data) {
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setEmail(data.email ?? user.email ?? "");
        setCompanyName(data.company_name ?? "");
      } else {
        setEmail(user.email ?? "");
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, user?.id]);

  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: "Sign in required", description: "Please sign in to update your profile.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        first_name: firstName || null,
        last_name: lastName || null,
        email: email || null,
        company_name: companyName || null,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    onSave();
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.profile.title", "Profile")}</SheetTitle>
          <SheetDescription>{t("settings.profile.description", "Manage your personal information")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} className="w-full" disabled={saving || loading}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</> : t("common.actions.save_changes", "Save changes")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
