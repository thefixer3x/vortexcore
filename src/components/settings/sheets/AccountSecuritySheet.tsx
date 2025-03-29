
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

interface AccountSecuritySheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const AccountSecuritySheet = ({ open, onClose, onSave }: AccountSecuritySheetProps) => {
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
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <h3 className="font-medium">Suspicious Activity Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Get alerts for unusual account activity
              </p>
            </div>
            <Switch defaultChecked />
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
          <Button onClick={onSave} className="w-full">Save Security Settings</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
