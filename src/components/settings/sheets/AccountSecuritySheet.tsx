
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useVortexSetting } from "@/hooks/useVortexSettings";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AccountSecuritySheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const AccountSecuritySheet = ({ open, onClose, onSave }: AccountSecuritySheetProps) => {
  const { toast } = useToast();
  const { value, save, loading, saving } = useVortexSetting("account_security", {
    login_notifications: true,
    suspicious_activity_alerts: true,
  });
  const [loginNotif, setLoginNotif] = useState(true);
  const [suspicious, setSuspicious] = useState(true);

  useEffect(() => {
    setLoginNotif(!!value.login_notifications);
    setSuspicious(!!value.suspicious_activity_alerts);
  }, [value]);

  const handleSave = async () => {
    try {
      await save({ login_notifications: loginNotif, suspicious_activity_alerts: suspicious });
      toast({ title: "Security preferences saved" });
      onSave?.();
      onClose();
    } catch (e: any) {
      toast({ title: "Failed to save", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Account Security</SheetTitle>
          <SheetDescription>
            Manage advanced security settings for your account
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-medium">Login Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Get notified when someone logs into your account
              </p>
            </div>
            <Switch checked={loginNotif} onCheckedChange={setLoginNotif} disabled={loading} />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-medium">Suspicious Activity Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Get alerts for unusual account activity
              </p>
            </div>
            <Switch checked={suspicious} onCheckedChange={setSuspicious} disabled={loading} />
          </div>
          
          <div className="pt-4">
            <Button variant="outline" className="w-full">
              View Login History
            </Button>
          </div>
          
          <div className="pt-2">
            <Button variant="outline" className="w-full">
              Manage Connected Devices
            </Button>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} className="w-full" disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Security Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
