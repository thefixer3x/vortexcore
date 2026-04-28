
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

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
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{t("settings.security_section.fields.new_password")}</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t("settings.security_section.fields.confirm_password")}</Label>
            <Input id="confirm-password" type="password" />
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">{t("settings.security_section.two_factor.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.security_section.two_factor.description")}
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">{t("settings.security_section.biometric.title")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("settings.security_section.biometric.description")}
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
          <Button onClick={onSave} className="w-full">{t("settings.security_section.actions.update")}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
