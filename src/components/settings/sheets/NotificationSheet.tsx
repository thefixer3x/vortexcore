
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Mail, Smartphone, AlertTriangle, Shield, Sparkles } from "lucide-react";

interface NotificationSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  transaction_alerts: boolean;
  security_alerts: boolean;
  marketing_emails: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  email_notifications: true,
  push_notifications: false,
  transaction_alerts: true,
  security_alerts: true,
  marketing_emails: false,
};

const SETTINGS_KEY = "notification_preferences";

export const NotificationSheet = ({ open, onClose, onSave }: NotificationSheetProps) => {
<<<<<<< HEAD
  const { t } = useTranslation();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
||||||| parent of 701e59b (Improve empty-state UX and wire NotificationSheet persistence)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
=======
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Load notification settings from vortex_settings table
  useEffect(() => {
    if (!open || !isAuthenticated || !user?.id) return;

    const fetchSettings = async () => {
      setIsFetching(true);
      try {
        const { data, error } = await supabase
          .from("vortex_settings")
          .select("setting_value")
          .eq("user_id", user.id)
          .eq("setting_key", SETTINGS_KEY)
          .maybeSingle();

        if (error) {
          console.error("Error fetching notification settings:", error);
          return;
        }

        if (data?.setting_value) {
          const parsed = data.setting_value as Partial<NotificationSettings>;
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, [open, isAuthenticated, user?.id]);

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!isAuthenticated || !user?.id) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to save notification settings.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Upsert into vortex_settings
      const { error } = await supabase
        .from("vortex_settings")
        .upsert({
          user_id: user.id,
          setting_key: SETTINGS_KEY,
          setting_value: settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,setting_key",
        });

      if (error) {
        console.error("Error saving notification settings:", error);
        toast({
          title: "Save failed",
          description: error.message || "Failed to save notification settings.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Save failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
>>>>>>> 701e59b (Improve empty-state UX and wire NotificationSheet persistence)

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.notifications_preferences.title")}</SheetTitle>
          <SheetDescription>
<<<<<<< HEAD
            {t("settings.notifications_preferences.description")}
||||||| parent of 701e59b (Improve empty-state UX and wire NotificationSheet persistence)
            Choose how and when you want to be notified
=======
            Choose how and when you want to be notified about your account activity
>>>>>>> 701e59b (Improve empty-state UX and wire NotificationSheet persistence)
          </SheetDescription>
        </SheetHeader>
<<<<<<< HEAD
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-medium">{t("settings.notifications_preferences.email.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifications_preferences.email.description")}
||||||| parent of 701e59b (Improve empty-state UX and wire NotificationSheet persistence)
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-medium">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive notifications and updates via email
=======

        {isFetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Channel Toggles */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Channels
              </h3>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Email Notifications</h4>
                    <p className="text-xs text-muted-foreground">
                      Receive account updates and alerts via email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={() => toggleSetting("email_notifications")}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Push Notifications</h4>
                    <p className="text-xs text-muted-foreground">
                      Real-time alerts on your device
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.push_notifications}
                  onCheckedChange={() => toggleSetting("push_notifications")}
                />
              </div>
            </div>

            {/* Alert Types */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Alert Types
              </h3>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Transaction Alerts</h4>
                    <p className="text-xs text-muted-foreground">
                      Notified for every send, receive, and payment
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.transaction_alerts}
                  onCheckedChange={() => toggleSetting("transaction_alerts")}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Security Alerts</h4>
                    <p className="text-xs text-muted-foreground">
                      Login attempts, password changes, and suspicious activity
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.security_alerts}
                  onCheckedChange={() => toggleSetting("security_alerts")}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Marketing & Promotions</h4>
                    <p className="text-xs text-muted-foreground">
                      New features, tips, and exclusive offers
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.marketing_emails}
                  onCheckedChange={() => toggleSetting("marketing_emails")}
                />
              </div>
            </div>

            {/* Help text */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs text-muted-foreground space-y-1">
              <p className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Security alerts are always enabled and cannot be disabled. You can turn off marketing emails at any time.
                </span>
>>>>>>> 701e59b (Improve empty-state UX and wire NotificationSheet persistence)
              </p>
            </div>
          </div>
<<<<<<< HEAD

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-medium">{t("settings.notifications_preferences.push.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifications_preferences.push.description")}
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>

          <div className="pt-4">
            <h3 className="font-medium mb-2">{t("settings.notifications_preferences.alert_types.title")}</h3>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="font-medium">{t("settings.notifications_preferences.alerts.transaction.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.notifications_preferences.alerts.transaction.description")}
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="font-medium">{t("settings.notifications_preferences.alerts.security.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.notifications_preferences.alerts.security.description")}
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="font-medium">{t("settings.notifications_preferences.alerts.marketing.title")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.notifications_preferences.alerts.marketing.description")}
                </p>
              </div>
              <Switch defaultChecked={false} />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={onSave} className="w-full">{t("settings.notifications_preferences.actions.save")}</Button>
||||||| parent of 701e59b (Improve empty-state UX and wire NotificationSheet persistence)
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-medium">Push Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive notifications on your devices
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
          
          <div className="pt-4">
            <h3 className="font-medium mb-2">Alert Types</h3>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="font-medium">Transaction Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about all transactions
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="font-medium">Security Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about security events
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="font-medium">Marketing & Promotions</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and promotions
                </p>
              </div>
              <Switch defaultChecked={false} />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={onSave} className="w-full">Save Notification Settings</Button>
=======
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={isLoading || isFetching}
            onClick={handleSave}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
>>>>>>> 701e59b (Improve empty-state UX and wire NotificationSheet persistence)
        </div>
      </SheetContent>
    </Sheet>
  );
};
