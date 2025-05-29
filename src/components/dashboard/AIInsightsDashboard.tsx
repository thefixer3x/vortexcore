import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  PiggyBank,
  Lightbulb,
  ArrowRight,
  BarChart3,
  DollarSign,
  Zap,
  Brain
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PerformanceMonitor } from "./PerformanceMonitor";

const spendingData = [
  { month: 'Jan', amount: 280000 },
  { month: 'Feb', amount: 320000 },
  { month: 'Mar', amount: 290000 },
  { month: 'Apr', amount: 350000 },
  { month: 'May', amount: 310000 },
  { month: 'Jun', amount: 270000 }
];

const categoryData = [
  { name: 'Food', value: 35, color: '#FF6B6B' },
  { name: 'Transport', value: 25, color: '#4ECDC4' },
  { name: 'Entertainment', value: 20, color: '#45B7D1' },
  { name: 'Utilities', value: 15, color: '#96CEB4' },
  { name: 'Others', value: 5, color: '#FFEAA7' }
];

const savingsData = [
  { month: 'Jan', amount: 45000 },
  { month: 'Feb', amount: 52000 },
  { month: 'Mar', amount: 48000 },
  { month: 'Apr', amount: 65000 },
  { month: 'May', amount: 58000 },
  { month: 'Jun', amount: 72000 }
];

export const AIInsightsDashboard = () => {
  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Financial Insights</CardTitle>
                <p className="text-muted-foreground">Powered by advanced analytics and machine learning</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              Live Analysis
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Smart Recommendation */}
            <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <Lightbulb className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Smart Saving Tip</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    You could save ₦2,400/month by optimizing your subscriptions
                  </p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    View Details
                  </Button>
                </div>
              </div>
            </div>

            {/* Spending Alert */}
            <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Budget Alert</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    85% of your monthly food budget used. Consider meal planning.
                  </p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    Set Limits
                  </Button>
                </div>
              </div>
            </div>

            {/* Investment Opportunity */}
            <div className="p-4 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Investment Ready</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on your savings pattern, consider a ₦50k investment.
                  </p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
                    Explore
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trends */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Spending Trends</CardTitle>
              <Badge variant="outline" className="gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                -12% vs last month
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingData}>
                  <defs>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis hide />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#spendingGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Average Monthly</p>
                <p className="text-2xl font-bold">₦303,333</p>
              </div>
              <div>
                <p className="text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-green-600">₦270,000</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm">{category.name}</span>
                  <span className="text-sm font-medium ml-auto">{category.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Savings Progress */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Savings Growth</CardTitle>
              <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
                <PiggyBank className="h-3 w-3" />
                On Track
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={savingsData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly Goal</span>
                <span className="text-sm font-medium">₦75,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current Month</span>
                <span className="text-sm font-medium text-green-600">₦72,000</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Smart Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between h-12">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Create Budget Plan</p>
                  <p className="text-xs text-muted-foreground">AI-powered suggestions</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="w-full justify-between h-12">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Investment Advisor</p>
                  <p className="text-xs text-muted-foreground">Personalized recommendations</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="w-full justify-between h-12">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Financial Health Check</p>
                  <p className="text-xs text-muted-foreground">Complete analysis</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        
        {/* Performance Monitor */}
        <PerformanceMonitor />
      </div>
    </div>
  );
};
