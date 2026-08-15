
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Building2, User } from "lucide-react";

interface BusinessSheetProps {
  open: boolean;
  onClose: () => void;
}

export const BusinessSheet = ({ open, onClose }: BusinessSheetProps) => {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("settings.business.title")}</SheetTitle>
          <SheetDescription>
            {t("settings.business.description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium">{t("settings.business.register.title")}</h4>
                <p className="text-sm text-muted-foreground">{t("settings.business.register.description")}</p>
              </div>
            </div>
            <Button>{t("common.actions.register")}</Button>
          </div>

          <div className="pt-4">
            <h3 className="font-medium mb-2">{t("settings.business.user_management.title")}</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{t("settings.business.invite.title")}</h4>
                  <p className="text-sm text-muted-foreground">{t("settings.business.invite.description")}</p>
                </div>
              </div>
              <Button variant="outline">{t("common.actions.invite")}</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
