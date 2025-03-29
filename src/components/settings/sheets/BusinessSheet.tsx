
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Building2, User } from "lucide-react";

interface BusinessSheetProps {
  open: boolean;
  onClose: () => void;
}

export const BusinessSheet = ({ open, onClose }: BusinessSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full md:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Business Registration</SheetTitle>
          <SheetDescription>
            Register and manage your business
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium">Register Your Business</h4>
                <p className="text-sm text-muted-foreground">Set up your business profile for advanced features</p>
              </div>
            </div>
            <Button>Register</Button>
          </div>
          
          <div className="pt-4">
            <h3 className="font-medium mb-2">User Management</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Invite Team Members</h4>
                  <p className="text-sm text-muted-foreground">Collaborate and manage access levels</p>
                </div>
              </div>
              <Button variant="outline">Invite</Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
