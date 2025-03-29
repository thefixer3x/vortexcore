
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  ChevronRight,
  User,
  Lock,
  CreditCard,
  Bell,
  Globe,
  Building2,
  CrownIcon,
  BadgeCheck,
  FileText,
  Smartphone,
  ShieldCheck,
  Inbox,
  Cookie,
  Landmark,
  MapPin,
  Banknote,
  Receipt,
  Home
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const { toast } = useToast();
  
  const showToast = () => {
    toast({
      title: "Settings Updated",
      description: "Your changes have been saved successfully.",
    });
  };

  const renderSettingItem = (icon: React.ReactNode, label: string, action?: () => void) => (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg cursor-pointer" onClick={action}>
      <div className="flex items-center gap-4">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );

  // Modals for each setting category
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const openSheet = (id: string) => setActiveSheet(id);
  const closeSheet = () => setActiveSheet(null);

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
            <Home className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>
      
      {/* Personal Settings Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Personal</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {renderSettingItem(
                <Inbox className="h-6 w-6 text-primary" />, 
                "Profile Information",
                () => openSheet("profile")
              )}
              {renderSettingItem(
                <Lock className="h-6 w-6 text-primary" />, 
                "Login and Security", 
                () => openSheet("security")
              )}
              {renderSettingItem(
                <ShieldCheck className="h-6 w-6 text-primary" />, 
                "Account Security",
                () => openSheet("account-security")
              )}
              {renderSettingItem(
                <Cookie className="h-6 w-6 text-primary" />, 
                "Cookies Preferences",
                () => openSheet("cookies")
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Settings Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Business Settings</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {renderSettingItem(
                <Landmark className="h-6 w-6 text-primary" />, 
                "Business Registration", 
                () => openSheet("business")
              )}
              {renderSettingItem(
                <MapPin className="h-6 w-6 text-primary" />, 
                "Public Profile", 
                () => openSheet("public-profile")
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Payment Methods</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {renderSettingItem(
                <Smartphone className="h-6 w-6 text-primary" />, 
                "Mobile Payments", 
                () => openSheet("mobile-payments")
              )}
              {renderSettingItem(
                <CreditCard className="h-6 w-6 text-primary" />, 
                "Cards & Bank Accounts", 
                () => openSheet("cards")
              )}
              {renderSettingItem(
                <Banknote className="h-6 w-6 text-primary" />, 
                "Cash Payments", 
                () => openSheet("cash")
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing & Taxes Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Billing & Taxes</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {renderSettingItem(
                <CrownIcon className="h-6 w-6 text-primary" />, 
                "Subscription Plan", 
                () => openSheet("subscription")
              )}
              {renderSettingItem(
                <Receipt className="h-6 w-6 text-primary" />, 
                "Tax Information", 
                () => openSheet("taxes")
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Notifications</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {renderSettingItem(
                <Bell className="h-6 w-6 text-primary" />, 
                "Notification Preferences", 
                () => openSheet("notifications")
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Settings Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Global Settings</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {renderSettingItem(
                <Globe className="h-6 w-6 text-primary" />, 
                "Currency & Language", 
                () => openSheet("currency")
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sheets for extended settings */}
      <Sheet open={activeSheet === "profile"} onOpenChange={() => closeSheet()}>
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
            <Button onClick={() => {
              closeSheet();
              showToast();
            }} className="w-full">Save Changes</Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activeSheet === "security"} onOpenChange={() => closeSheet()}>
        <SheetContent className="w-full md:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Login and Security</SheetTitle>
            <SheetDescription>
              Update your password and security settings
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            
            <div className="pt-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <h3 className="font-medium">Two-factor authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable two-factor authentication for added security
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={setTwoFactorEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <h3 className="font-medium">Biometric login</h3>
                  <p className="text-sm text-muted-foreground">
                    Use fingerprint or facial recognition to login
                  </p>
                </div>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={setBiometricEnabled}
                />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={() => {
              closeSheet();
              showToast();
            }} className="w-full">Update Security Settings</Button>
          </div>
        </SheetContent>
      </Sheet>
      
      <Sheet open={activeSheet === "currency"} onOpenChange={() => closeSheet()}>
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
            <Button onClick={() => {
              closeSheet();
              showToast();
            }} className="w-full">Save Preferences</Button>
          </div>
        </SheetContent>
      </Sheet>
      
      <Sheet open={activeSheet === "business"} onOpenChange={() => closeSheet()}>
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
      
      <Sheet open={activeSheet === "subscription"} onOpenChange={() => closeSheet()}>
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
      
      <Sheet open={activeSheet === "notifications"} onOpenChange={() => closeSheet()}>
        <SheetContent className="w-full md:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Notification Preferences</SheetTitle>
            <SheetDescription>
              Choose how and when you want to be notified
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 py-6">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications and updates via email
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Receive notifications on your devices
                </p>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
            
            <div className="pt-4">
              <h3 className="font-medium mb-2">Alert Types</h3>
              
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="font-medium">Transaction Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about all transactions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="font-medium">Security Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified about security events
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <p className="font-medium">Marketing & Promotions</p>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and promotions
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={() => {
              closeSheet();
              showToast();
            }} className="w-full">Save Notification Settings</Button>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Additional sheets for other settings */}
      <Sheet open={activeSheet === "account-security"} onOpenChange={() => closeSheet()}>
        <SheetContent className="w-full md:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Account Security</SheetTitle>
            <SheetDescription>
              Manage advanced security settings for your account
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 py-6">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">Login Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone logs into your account
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <h3 className="font-medium">Suspicious Activity Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Get alerts for unusual account activity
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="pt-4">
              <Button variant="outline" className="w-full">
                View Login History
              </Button>
            </div>
            
            <div className="pt-2">
              <Button variant="outline" className="w-full">
                Manage Connected Devices
              </Button>
            </div>
          </div>
          <div className="mt-6">
            <Button onClick={() => {
              closeSheet();
              showToast();
            }} className="w-full">Save Security Settings</Button>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Continue adding sheets for other settings */}
    </div>
  );
}
