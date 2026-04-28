
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BadgeCheck } from "lucide-react";

interface ProfileSheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ProfileSheet = ({ open, onClose, onSave }: ProfileSheetProps) => {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.profile.title")}</SheetTitle>
          <SheetDescription>
            {t("settings.profile.description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t("settings.profile.fields.full_name")}</Label>
            <Input id="name" defaultValue="Alex Volkov" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("settings.profile.fields.email")}</Label>
            <Input id="email" defaultValue="alex@vortexcore.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("settings.profile.fields.phone")}</Label>
            <Input id="phone" defaultValue="+1 (555) 123-4567" />
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">{t("settings.profile.about_title")}</h3>
            <div className="space-y-2">
              <Label htmlFor="occupation">{t("settings.profile.fields.occupation")}</Label>
              <Input id="occupation" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-range">{t("settings.profile.fields.income_range")}</Label>
              <Select>
                <SelectTrigger id="income-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="range1">₦100,000 - ₦500,000</SelectItem>
                  <SelectItem value="range2">₦500,001 - ₦1,000,000</SelectItem>
                  <SelectItem value="range3">₦1,000,001 - ₦5,000,000</SelectItem>
                  <SelectItem value="range4">₦5,000,001+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="financial-goals">{t("settings.profile.fields.financial_goals")}</Label>
              <Select>
                <SelectTrigger id="financial-goals">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="investing">Investing</SelectItem>
                  <SelectItem value="retirement">Retirement Planning</SelectItem>
                  <SelectItem value="business">Business Growth</SelectItem>
                  <SelectItem value="debt">Debt Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">{t("settings.profile.identity.title")}</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-medium">{t("settings.profile.identity.verify_button")}</h4>
                  <p className="text-sm text-muted-foreground">{t("settings.profile.identity.description")}</p>
                </div>
              </div>
              <Button>{t("common.actions.start")}</Button>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={onSave} className="w-full">{t("common.actions.save_changes")}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
