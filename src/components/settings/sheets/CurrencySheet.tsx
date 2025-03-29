
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CurrencySheetProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const CurrencySheet = ({ open, onClose, onSave }: CurrencySheetProps) => {
  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Currency & Language</SheetTitle>
          <SheetDescription>
            Customize your global preferences
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="default-currency">Default Currency</Label>
            <Select defaultValue="ngn">
              <SelectTrigger id="default-currency">
                <SelectValue placeholder="Select default currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ngn">Nigerian Naira (₦ NGN)</SelectItem>
                <SelectItem value="usd">US Dollar ($ USD)</SelectItem>
                <SelectItem value="eur">Euro (€ EUR)</SelectItem>
                <SelectItem value="gbp">British Pound (£ GBP)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Live exchange rates and conversions will be applied automatically
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select defaultValue="en">
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={onSave} className="w-full">Save Preferences</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
