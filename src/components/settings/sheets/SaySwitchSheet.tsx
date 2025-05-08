
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { SaySwitchService } from "@/services/sayswitch";

interface SaySwitchSheetProps {
  open: boolean;
  onClose: () => void;
}

export const SaySwitchSheet = ({ open, onClose }: SaySwitchSheetProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [testMode, setTestMode] = useState<boolean>(true);

  const handleSave = async () => {
    if (!apiKey || !secretKey) {
      toast({
        title: "Missing Information",
        description: "API Key and Secret Key are required.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Test connection before saving
      const success = await SaySwitchService.testConnection(apiKey, secretKey);
      
      if (success) {
        toast({
          title: "Settings Saved",
          description: "SaySwitch integration configured successfully.",
        });
        onClose();
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect with the provided credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>SaySwitch Integration</SheetTitle>
          <SheetDescription>
            Configure your SaySwitch payment gateway integration.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enable SaySwitch</h3>
              <p className="text-sm text-muted-foreground">
                Activate SaySwitch payment processing
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your SaySwitch API Key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secret-key">Secret Key</Label>
              <Input
                id="secret-key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                type="password"
                placeholder="Enter your SaySwitch Secret Key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/api/webhooks/sayswitch"
              />
              <p className="text-xs text-muted-foreground">
                Configure this URL in your SaySwitch dashboard to receive payment notifications
              </p>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="test-mode" checked={testMode} onCheckedChange={setTestMode} />
              <Label htmlFor="test-mode">Use Test Mode</Label>
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
