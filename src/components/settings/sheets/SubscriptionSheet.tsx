
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
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="space-y-2 sm:space-y-3">
          <SheetTitle>Subscription Plan</SheetTitle>
          <SheetDescription>
            Upgrade your plan to unlock premium features
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 sm:space-y-6 py-4 sm:py-6">
          <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <CrownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base">Current Plan: Free</h3>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                View Details
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Upgrade to unlock:</p>
            <ul className="text-xs sm:text-sm space-y-2">
              <li className="flex items-center gap-2 sm:gap-3">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1">Detailed VortexAI Insights</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1">Access to instant credit</span>
              </li>
              <li className="flex items-center gap-2 sm:gap-3">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1">Multiple sub-users</span>
              </li>
            </ul>
          </div>
          <Button className="w-full py-3 sm:py-2 text-sm sm:text-base">
            Upgrade Subscription
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
