
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVortexSetting } from "@/hooks/useVortexSettings";
import { Loader2 } from "lucide-react";

interface SecuritySheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SecuritySheet = ({ open, onClose, onSave }: SecuritySheetProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { value, save, loading, saving } = useVortexSetting("security", {
    two_factor_enabled: false,
    biometric_enabled: true,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTwoFactorEnabled(!!value.two_factor_enabled);
    setBiometricEnabled(!!value.biometric_enabled);
  }, [value]);

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      if (newPassword || confirmPassword) {
        if (newPassword.length < 8) {
          toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
          return;
        }
        if (newPassword !== confirmPassword) {
          toast({ title: "Passwords don't match", variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      await save({ two_factor_enabled: twoFactorEnabled, biometric_enabled: biometricEnabled });
      toast({ title: "Security updated" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      onSave?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.security_section.title")}</SheetTitle>
          <SheetDescription>
            {t("settings.security_section.description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">{t("settings.security_section.fields.current_password")}</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("settings.security_section.fields.new_password")}</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("settings.security_section.fields.confirm_password")}</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">{t("settings.security_section.two_factor.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.security_section.two_factor.description")}
                </p>
              </div>
              <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} disabled={loading} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">{t("settings.security_section.biometric.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.security_section.biometric.description")}
                </p>
              </div>
              <Switch checked={biometricEnabled} onCheckedChange={setBiometricEnabled} disabled={loading} />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleUpdate} className="w-full" disabled={submitting || saving || loading}>
            {(submitting || saving) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("settings.security_section.actions.update")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
