
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface VirtualAccountSheetProps {
  open: boolean;
  onClose: () => void;
}

// Mock data - would come from API in real implementation
const mockAccounts = [
  {
    id: "va1",
    accountName: "VortexCore Business",
    accountNumber: "0123456789",
    bankName: "SaySwitch Bank",
    status: "active",
  },
  {
    id: "va2",
    accountName: "VortexCore Collections",
    accountNumber: "9876543210",
    bankName: "SaySwitch Bank",
    status: "active",
  }
];

export const VirtualAccountSheet = ({ open, onClose }: VirtualAccountSheetProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoCreateEnabled, setAutoCreateEnabled] = useState<boolean>(true);
  const [accounts] = useState(mockAccounts);

  const handleSave = async () => {
    setIsLoading(true);

    // Simulate API request
    setTimeout(() => {
      toast({
        title: "Settings Saved",
        description: "Virtual account settings updated successfully.",
      });
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const handleCreateAccount = () => {
    toast({
      title: "Creating Account",
      description: "Virtual account creation initiated.",
    });
    // In a real app, this would open a form or call an API
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Virtual Account Configuration</SheetTitle>
          <SheetDescription>
            Manage virtual accounts for receiving payments
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Auto-Create for Customers</h3>
              <p className="text-sm text-muted-foreground">
                Automatically create a virtual account for new customers
              </p>
            </div>
            <Switch checked={autoCreateEnabled} onCheckedChange={setAutoCreateEnabled} />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Business Virtual Accounts</h3>
              <Button size="sm" onClick={handleCreateAccount}>Create New</Button>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map(account => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.accountName}</TableCell>
                      <TableCell>{account.accountNumber}</TableCell>
                      <TableCell>{account.bankName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {account.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
