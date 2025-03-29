
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CrownIcon, FileText, CreditCard, User } from "lucide-react";

interface SubscriptionSheetProps {
  open: boolean;
  onClose: () => void;
}

export const SubscriptionSheet = ({ open, onClose }: SubscriptionSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Subscription Plan</SheetTitle>
          <SheetDescription>
            Upgrade your plan to unlock premium features
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CrownIcon className="h-5 w-5 text-yellow-500" />
                <h3 className="font-semibold">Current Plan: Free</h3>
              </div>
              <Button variant="outline" size="sm">View Details</Button>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Upgrade to unlock:</p>
            <ul className="text-sm space-y-1">
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Detailed VortexAI Insights</span>
              </li>
              <li className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Access to instant credit</span>
              </li>
              <li className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Multiple sub-users</span>
              </li>
            </ul>
          </div>
          <Button className="w-full">Upgrade Subscription</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
