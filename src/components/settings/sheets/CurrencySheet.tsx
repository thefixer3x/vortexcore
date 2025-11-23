import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCurrency, Currency, Language } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";

interface CurrencySheetProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const CurrencySheet = ({ open, onClose, onSave }: CurrencySheetProps) => {
  const { currency, language, setCurrency, setLanguage, isLoading } = useCurrency();
  const { toast } = useToast();
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when context values change
  useEffect(() => {
    setSelectedCurrency(currency);
    setSelectedLanguage(language);
  }, [currency, language]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save currency if changed
      if (selectedCurrency !== currency) {
        await setCurrency(selectedCurrency);
      }

      // Save language if changed
      if (selectedLanguage !== language) {
        await setLanguage(selectedLanguage);
      }

      toast({
        title: "Preferences saved",
        description: "Your currency and language preferences have been updated.",
      });

      // Call optional onSave callback
      onSave?.();

      // Close the sheet
      onClose();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Currency & Language</SheetTitle>
          <SheetDescription>
            Customize your global preferences
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="default-currency">Default Currency</Label>
            <Select
              value={selectedCurrency.toLowerCase()}
              onValueChange={(value) => setSelectedCurrency(value.toUpperCase() as Currency)}
              disabled={isLoading}
            >
              <SelectTrigger id="default-currency">
                <SelectValue placeholder="Select default currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ngn">Nigerian Naira (₦ NGN)</SelectItem>
                <SelectItem value="usd">US Dollar ($ USD)</SelectItem>
                <SelectItem value="eur">Euro (€ EUR)</SelectItem>
                <SelectItem value="gbp">British Pound (£ GBP)</SelectItem>
                <SelectItem value="zar">South African Rand (R ZAR)</SelectItem>
                <SelectItem value="kes">Kenyan Shilling (KSh KES)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              This will be used as your default currency across the platform
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={selectedLanguage}
              onValueChange={(value) => setSelectedLanguage(value as Language)}
              disabled={isLoading}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} className="w-full" disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
