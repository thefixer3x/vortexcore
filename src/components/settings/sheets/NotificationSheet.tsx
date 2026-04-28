
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface NotificationSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const NotificationSheet = ({ open, onClose, onSave }: NotificationSheetProps) => {
  const { t } = useTranslation();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.notifications_preferences.title")}</SheetTitle>
          <SheetDescription>
            {t("settings.notifications_preferences.description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-medium">{t("settings.notifications_preferences.email.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifications_preferences.email.description")}
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

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
        </div>
      </SheetContent>
    </Sheet>
  );
};
