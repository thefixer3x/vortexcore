
import { useState } from "react";
import { NavBar } from "@/components/layout/NavBar";
import { SideNav } from "@/components/layout/SideNav";
import { AccountCard } from "@/components/dashboard/AccountCard";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { InsightWidget } from "@/components/dashboard/InsightWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Wallet, ArrowRight, LineChart } from "lucide-react";

const mockAccounts = [
  {
    id: "acc1",
    name: "Primary Checking",
    number: "4532",
    balance: 3245.65,
    currency: "USD",
    type: "Checking",
    color: "bg-gradient-to-br from-blue-500 to-blue-700"
  },
  {
    id: "acc2",
    name: "Savings Account",
    number: "7891",
    balance: 12500.00,
    currency: "USD",
    type: "Savings",
    color: "bg-gradient-to-br from-green-500 to-green-700"
  },
  {
    id: "acc3",
    name: "Credit Card",
    number: "2349",
    balance: 620.85,
    currency: "USD",
    type: "Credit",
    color: "bg-gradient-to-br from-purple-500 to-purple-700"
  }
];

const Dashboard = () => {
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
              <h1 className="text-2xl font-bold tracking-tight">Good afternoon, Alex</h1>
              <p className="text-muted-foreground">Here's what's happening with your accounts today</p>
            </div>
            
            <div className="flex gap-3">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Account
              </Button>
              <Button variant="outline" className="gap-2">
                <CreditCard className="h-4 w-4" />
                New Payment
              </Button>
            </div>
          </div>
          
          {/* Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {mockAccounts.map((account) => (
              <AccountCard key={account.id} account={account} className="animate-scale-in" />
            ))}
            
            <Card className="rounded-xl border border-dashed flex items-center justify-center animate-scale-in">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">Connect a New Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add external accounts to see all your finances in one place
                </p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="col-span-1 rounded-xl animate-fade-in">
              <CardContent className="p-6">
                <h3 className="font-medium mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto py-3 justify-start">
                    <div className="flex flex-col items-start text-left">
                      <div className="flex items-center mb-1">
                        <Wallet className="h-4 w-4 mr-2" />
                        <span className="font-medium">Transfer</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Between accounts
                      </span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 justify-start">
                    <div className="flex flex-col items-start text-left">
                      <div className="flex items-center mb-1">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span className="font-medium">Pay Bill</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Schedule payment
                      </span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 justify-start">
                    <div className="flex flex-col items-start text-left">
                      <div className="flex items-center mb-1">
                        <LineChart className="h-4 w-4 mr-2" />
                        <span className="font-medium">Insights</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        View analytics
                      </span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 justify-start">
                    <div className="flex flex-col items-start text-left">
                      <div className="flex items-center mb-1">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        <span className="font-medium">More</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        See all options
                      </span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1 md:col-span-2 rounded-xl animate-fade-in">
              <CardContent className="p-6">
                <TransactionList />
              </CardContent>
            </Card>
          </div>
          
          {/* Insights */}
          <div className="mb-8">
            <InsightWidget />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
