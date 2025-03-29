
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
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Notification Preferences</SheetTitle>
          <SheetDescription>
            Choose how and when you want to be notified
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-medium">Email Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive notifications and updates via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
