
import { useEffect, useState } from "react";
import { ModernDashboardHeader } from "@/components/dashboard/ModernDashboardHeader";
import { ModernAccountCard } from "@/components/dashboard/ModernAccountCard";
import { ModernTransactionList } from "@/components/dashboard/ModernTransactionList";
import { AIInsightsDashboard } from "@/components/dashboard/AIInsightsDashboard";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { FloatingActionButton } from "@/components/dashboard/FloatingActionButton";
import { DashboardSkeleton } from "@/components/ui/skeleton";
// import LogRocket from "logrocket"; // Temporarily disabled
import { usePageViewDuration } from "@/hooks/use-analytics";

const mockAccounts = [
  {
    id: "acc1",
    name: "Primary Checking",
    number: "4532",
    balance: 3245.65,
    currency: "NGN",
    type: "Checking" as const,
    color: "bg-gradient-to-br from-blue-500 to-blue-700"
  },
  {
    id: "acc2",
    name: "Savings Account",
    number: "7891",
    balance: 12500.00,
    currency: "NGN",
    type: "Savings" as const,
    color: "bg-gradient-to-br from-green-500 to-green-700"
  },
  {
    id: "acc3",
    name: "Credit Card",
    number: "2349",
    balance: 620.85,
    currency: "NGN",
    type: "Credit" as const,
    color: "bg-gradient-to-br from-purple-500 to-purple-700"
  }
];

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Track time spent on dashboard page
  usePageViewDuration('dashboard');
  
  useEffect(() => {
    // Simulate loading time for demo purposes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    // Track dashboard page load - temporarily disabled
    // LogRocket.track('dashboard_loaded', {
    //   timestamp: new Date().toISOString()
    // });

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className="animate-fade-in space-y-8">
      {/* Modern Header with AI Features */}
      <div className="animate-slide-up">
        <ModernDashboardHeader />
      </div>

      {/* Account Cards with Modern Design and Staggered Animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {mockAccounts.map((account, index) => (
          <div 
            key={account.id} 
            className={`animate-stagger-in card-hover hover-lift ${
              index === 1 ? '[animation-delay:0.1s]' : 
              index === 2 ? '[animation-delay:0.2s]' : ''
            }`}
          >
            <ModernAccountCard account={account} />
          </div>
        ))}
      </div>

      {/* Quick Actions Grid with Enhanced Animations */}
      <div className="animate-scale-in">
        <QuickActionsGrid />
      </div>

      {/* Main Content Grid with Responsive Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Transactions List - Takes more space on larger screens */}
        <div className="xl:col-span-8 animate-fade-in [animation-delay:0.2s]">
          <ModernTransactionList />
        </div>
        
        {/* AI Insights - Stacks below on mobile, sidebar on desktop */}
        <div className="xl:col-span-4 animate-fade-in [animation-delay:0.3s]">
          <AIInsightsDashboard />
        </div>
      </div>

      {/* Floating Action Button for Quick Access */}
      <FloatingActionButton />
    </div>
  );
};

export default Dashboard;
