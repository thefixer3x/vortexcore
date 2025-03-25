
import { useState } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { SideNav } from "@/components/layout/SideNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Key, 
  Bell, 
  Shield, 
  Users, 
  CreditCard, 
  Smartphone, 
  ChevronRight,
  Lock,
  Fingerprint,
  EyeOff,
  LogOut,
  Plus,
  Trash
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <SideNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1">
        <NavBar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="pt-16 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-8 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences and banking settings</p>
            </div>
          </div>
          
          <Card className="rounded-xl overflow-hidden mb-8 animate-fade-in">
            <Tabs defaultValue="profile" className="w-full">
              <div className="border-b">
                <div className="px-6 pt-6 flex overflow-x-auto pb-2">
                  <TabsList>
                    <TabsTrigger value="profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Security</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span>Notifications</span>
                    </TabsTrigger>
                    <TabsTrigger value="access" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Access & Roles</span>
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment Methods</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <TabsContent value="profile" className="p-6 space-y-8 m-0">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 flex flex-col items-center">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage src="" alt="Profile" />
                      <AvatarFallback className="text-3xl">AV</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="mb-2">Upload Photo</Button>
                    <p className="text-sm text-muted-foreground">JPG or PNG. 1MB max size.</p>
                  </div>
                  
                  <div className="md:w-2/3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="Alex" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Volkov" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue="alex@vortexcore.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" defaultValue="+1 (555) 123-4567" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input id="timezone" defaultValue="(UTC-05:00) Eastern Time (US & Canada)" />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button>Save Changes</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="p-6 space-y-8 m-0">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Authentication Methods</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Key className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Password</h4>
                          <p className="text-sm text-muted-foreground">
                            Last updated 2 months ago
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Change Password</Button>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Two-Factor Authentication</h4>
                          <p className="text-sm text-muted-foreground">
                            Enable 2FA for additional security
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Fingerprint className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Biometric Authentication</h4>
                          <p className="text-sm text-muted-foreground">
                            Use fingerprint or face recognition
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-8">Privacy Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <EyeOff className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Confidential Mode</h4>
                          <p className="text-sm text-muted-foreground">
                            Hide transaction details and balances
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Session Timeout</h4>
                          <p className="text-sm text-muted-foreground">
                            Automatically log out after inactivity
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="destructive" className="gap-2">
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out from All Devices</span>
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notifications" className="p-6 space-y-8 m-0">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b py-3">
                      <div className="col-span-2">
                        <h4 className="font-medium">Transaction Alerts</h4>
                        <p className="text-sm text-muted-foreground">
                          Get notified about account transactions
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-4">
                        <Badge variant="outline">Email</Badge>
                        <Badge variant="outline">Push</Badge>
                        <Badge variant="outline">SMS</Badge>
                        <Switch />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b py-3">
                      <div className="col-span-2">
                        <h4 className="font-medium">Account Activity</h4>
                        <p className="text-sm text-muted-foreground">
                          Logins, password changes, and security alerts
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-4">
                        <Badge variant="outline">Email</Badge>
                        <Badge variant="outline">Push</Badge>
                        <Badge variant="outline">SMS</Badge>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b py-3">
                      <div className="col-span-2">
                        <h4 className="font-medium">Balance Updates</h4>
                        <p className="text-sm text-muted-foreground">
                          Low balance alerts and weekly summaries
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-4">
                        <Badge variant="outline">Email</Badge>
                        <Badge variant="outline">Push</Badge>
                        <Badge variant="outline">SMS</Badge>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b py-3">
                      <div className="col-span-2">
                        <h4 className="font-medium">Bill Reminders</h4>
                        <p className="text-sm text-muted-foreground">
                          Get reminded before bills are due
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-4">
                        <Badge variant="outline">Email</Badge>
                        <Badge variant="outline">Push</Badge>
                        <Badge variant="outline">SMS</Badge>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b py-3">
                      <div className="col-span-2">
                        <h4 className="font-medium">AI Insights</h4>
                        <p className="text-sm text-muted-foreground">
                          Financial insights and personalized recommendations
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-4">
                        <Badge variant="outline">Email</Badge>
                        <Badge variant="outline">Push</Badge>
                        <Badge variant="outline">SMS</Badge>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="access" className="p-6 space-y-8 m-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">User Access & Permissions</h3>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add User</span>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>AV</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">Alex Volkov</h4>
                        <p className="text-sm text-muted-foreground">
                          alex@vortexcore.com
                        </p>
                      </div>
                    </div>
                    <Badge>Owner</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>SM</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">Sarah Miller</h4>
                        <p className="text-sm text-muted-foreground">
                          sarah@example.com
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Editor</Badge>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>JC</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">James Chen</h4>
                        <p className="text-sm text-muted-foreground">
                          james@example.com
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Viewer</Badge>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mt-8">API Access</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">API Key Management</h4>
                      <p className="text-sm text-muted-foreground">
                        Manage API keys for third-party integrations
                      </p>
                    </div>
                    <Button variant="outline">Manage Keys</Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Developer Portal</h4>
                      <p className="text-sm text-muted-foreground">
                        Access documentation and development tools
                      </p>
                    </div>
                    <Button variant="outline">Open Portal</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="payment" className="p-6 space-y-8 m-0">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Payment Methods</h3>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Payment Method</span>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Visa ending in 4532</h4>
                        <p className="text-sm text-muted-foreground">
                          Expires 05/2025
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Default</Badge>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">Mastercard ending in 8761</h4>
                        <p className="text-sm text-muted-foreground">
                          Expires 11/2024
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mt-8">Saved Beneficiaries</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">James Smith</h4>
                      <p className="text-sm text-muted-foreground">
                        Account ending in 7654
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">City Utilities</h4>
                      <p className="text-sm text-muted-foreground">
                        Bill Payment
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h4 className="font-medium">Rent Payment</h4>
                      <p className="text-sm text-muted-foreground">
                        Scheduled Monthly
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Settings;
