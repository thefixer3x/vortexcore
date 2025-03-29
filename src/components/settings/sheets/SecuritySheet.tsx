
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface SecuritySheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SecuritySheet = ({ open, onClose, onSave }: SecuritySheetProps) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Login and Security</SheetTitle>
          <SheetDescription>
            Update your password and security settings
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          
          <div className="pt-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">Two-factor authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Enable two-factor authentication for added security
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">Biometric login</h3>
                <p className="text-sm text-muted-foreground">
                  Use fingerprint or facial recognition to login
                </p>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={setBiometricEnabled}
              />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={onSave} className="w-full">Update Security Settings</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
