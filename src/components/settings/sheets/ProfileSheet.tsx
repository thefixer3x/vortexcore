
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
  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Profile Information</SheetTitle>
          <SheetDescription>
            Update your personal details and profile information
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue="Alex Volkov" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" defaultValue="alex@vortexcore.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" defaultValue="+1 (555) 123-4567" />
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Tell Us About You</h3>
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input id="occupation" placeholder="What do you do?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income-range">Income Range</Label>
              <Select>
                <SelectTrigger id="income-range">
                  <SelectValue placeholder="Select your income range" />
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
              <Label htmlFor="financial-goals">Primary Financial Goals</Label>
              <Select>
                <SelectTrigger id="financial-goals">
                  <SelectValue placeholder="Select your primary goal" />
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
            <h3 className="text-lg font-medium">Identity Verification</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-medium">Verify Your Identity</h4>
                  <p className="text-sm text-muted-foreground">Complete KYC to access higher transaction limits</p>
                </div>
              </div>
              <Button>Start</Button>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={onSave} className="w-full">Save Changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
