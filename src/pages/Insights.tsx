import { InsightsHeader } from "@/components/insights/InsightsHeader";
import { FinancialOverviewTabs } from "@/components/insights/FinancialOverviewTabs";
import { InsightWidget } from "@/components/dashboard/InsightWidget";
import AIRecommendations from "@/components/insights/AIRecommendations";
import { useCurrency } from "@/contexts/CurrencyContext";

const spendingTrend = [
  { month: "Jan", amount: 1200 },
  { month: "Feb", amount: 1800 },
  { month: "Mar", amount: 1600 },
  { month: "Apr", amount: 1400 },
  { month: "May", amount: 2000 },
  { month: "Jun", amount: 1700 },
  { month: "Jul", amount: 1900 },
];

const incomeTrend = [
  { month: "Jan", amount: 3000 },
  { month: "Feb", amount: 3000 },
  { month: "Mar", amount: 3500 },
  { month: "Apr", amount: 3000 },
  { month: "May", amount: 3800 },
  { month: "Jun", amount: 3200 },
  { month: "Jul", amount: 4000 },
];

const savingsRate = [
  { month: "Jan", savings: 1800, target: 2000 },
  { month: "Feb", savings: 1200, target: 2000 },
  { month: "Mar", savings: 1900, target: 2000 },
  { month: "Apr", savings: 1600, target: 2000 },
  { month: "May", savings: 1800, target: 2000 },
  { month: "Jun", savings: 1500, target: 2000 },
  { month: "Jul", savings: 2100, target: 2000 },
];

const budgetStatus = [
  { name: "Food", spent: 450, budget: 500 },
  { name: "Transport", spent: 380, budget: 350 },
  { name: "Shopping", spent: 300, budget: 300 },
  { name: "Entertainment", spent: 250, budget: 200 },
  { name: "Utilities", spent: 220, budget: 250 },
];

const aiSuggestions = [
  { 
    id: 1, 
    title: "Reduce food expenses", 
    description: "You're spending 15% more on food than last month. Consider meal planning to reduce costs.", 
    impact: "Save ~$70/month", 
    type: "saving" 
  },
  { 
    id: 2, 
    title: "Subscription overlap", 
    description: "You have multiple streaming services. Consider consolidating to save money.", 
    impact: "Save ~$25/month", 
    type: "saving" 
  },
  { 
    id: 3, 
    title: "Emergency fund", 
    description: "Your emergency fund covers only 2 months of expenses. Aim for 3-6 months.", 
    impact: "Increase security", 
    type: "warning" 
  },
  { 
    id: 4, 
    title: "Cashback opportunity", 
    description: "Switch your grocery purchases to your cashback card to earn rewards.", 
    impact: "Earn ~$15/month", 
    type: "opportunity" 
  },
];

const Insights = () => {
  const { formatCurrency } = useCurrency();

  return (
    <div className="animate-fade-in">
      <InsightsHeader
        title="AI Insights"
        description="Financial analytics and personalized recommendations"
      />

      <FinancialOverviewTabs
        spendingTrend={spendingTrend}
        formatCurrency={formatCurrency}
      />
      
      <div className="mb-8">
        <InsightWidget />
      </div>
      
      <AIRecommendations suggestions={aiSuggestions} />
    </div>
  );
};

export default Insights;
