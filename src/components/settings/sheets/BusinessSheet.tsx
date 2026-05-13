
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Building2, Loader2, User } from "lucide-react";
import { useVortexSetting } from "@/hooks/useVortexSettings";
import { useToast } from "@/hooks/use-toast";

interface BusinessSheetProps {
  open: boolean;
  onClose: () => void;
}

export const BusinessSheet = ({ open, onClose }: BusinessSheetProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { value, save, loading, saving } = useVortexSetting("business", {
    company_name: "",
    registration_number: "",
    tax_id: "",
    invite_email: "",
  });
  const [companyName, setCompanyName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => {
    setCompanyName(value.company_name || "");
    setRegNumber(value.registration_number || "");
    setTaxId(value.tax_id || "");
  }, [value]);

  const handleRegister = async () => {
    try {
      await save({
        company_name: companyName,
        registration_number: regNumber,
        tax_id: taxId,
        invite_email: value.invite_email || "",
      });
      toast({ title: "Business profile saved" });
    } catch (e: any) {
      toast({ title: "Failed to save", description: e?.message, variant: "destructive" });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await save({
        company_name: companyName,
        registration_number: regNumber,
        tax_id: taxId,
        invite_email: inviteEmail,
      });
      toast({ title: `Invitation queued for ${inviteEmail}` });
      setInviteEmail("");
    } catch (e: any) {
      toast({ title: "Failed to invite", description: e?.message, variant: "destructive" });
    }
  };

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
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <h4 className="font-medium">{t("settings.business.register.title")}</h4>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name">Business name</Label>
              <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-number">Registration number</Label>
              <Input id="reg-number" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-id">Tax ID</Label>
              <Input id="tax-id" value={taxId} onChange={(e) => setTaxId(e.target.value)} disabled={loading} />
            </div>
            <Button onClick={handleRegister} disabled={saving || loading} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.actions.register")}
            </Button>
          </div>

          <div className="pt-4">
            <h3 className="font-medium mb-2">{t("settings.business.user_management.title")}</h3>
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-muted-foreground" />
                <h4 className="font-medium">{t("settings.business.invite.title")}</h4>
              </div>
              <Input
                placeholder="teammate@company.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button onClick={handleInvite} variant="outline" disabled={saving || !inviteEmail} className="w-full">
                {t("common.actions.invite")}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
