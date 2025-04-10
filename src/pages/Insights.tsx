import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightWidget } from "@/components/dashboard/InsightWidget";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { Calendar, Download, Filter, BellRing, TrendingUp, TrendingDown, Check, AlertTriangle } from "lucide-react";

// Sample data for charts
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
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border p-2 rounded-md shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };
  
  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "saving":
        return <TrendingDown className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "opportunity":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <Check className="h-5 w-5" />;
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 my-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-muted-foreground">Financial analytics and personalized recommendations</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Time Period
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Financial Overview */}
      <Card className="rounded-xl overflow-hidden mb-8 animate-fade-in">
        <Tabs defaultValue="overview" className="w-full">
          <div className="px-6 pt-6 border-b">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Financial Overview</h2>
                <p className="text-muted-foreground">Track your financial health and trends</p>
              </div>
              <Badge variant="outline" className="bg-primary/5 px-3 py-1 flex items-center gap-1">
                <BellRing className="h-3 w-3" />
                <span>AI-Powered Insights</span>
              </Badge>
            </div>
            <TabsList className="mb-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="overview" className="p-6 space-y-8 m-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Monthly Income</p>
                    <p className="text-2xl font-semibold">{formatCurrency(4000)}</p>
                    <div className="flex items-center text-green-500 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+5% from last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                    <p className="text-2xl font-semibold">{formatCurrency(1900)}</p>
                    <div className="flex items-center text-red-500 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+12% from last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Savings Rate</p>
                    <p className="text-2xl font-semibold">52.5%</p>
                    <div className="flex items-center text-green-500 text-sm">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      <span>-3% from last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-muted/30 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Cash Flow Trend (Last 6 Months)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={spendingTrend}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="income" className="m-0">
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Income analytics will be displayed here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="expenses" className="m-0">
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Expense analytics will be displayed here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="savings" className="m-0">
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Savings analytics will be displayed here</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
      
      {/* Spending Breakdown */}
      <div className="mb-8">
        <InsightWidget />
      </div>
      
      {/* AI Recommendations */}
      <Card className="rounded-xl overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">AI Recommendations</h2>
            <Badge variant="secondary">4 new suggestions</Badge>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiSuggestions.map((suggestion) => (
              <Card key={suggestion.id} className="border shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <Badge variant="outline" className="ml-2">
                          {suggestion.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {suggestion.description}
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">Dismiss</Button>
                        <Button size="sm">Take Action</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Insights;
