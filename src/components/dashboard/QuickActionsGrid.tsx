import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  ArrowDownRight, 
  CreditCard, 
  Smartphone,
  Zap,
  BarChart3,
  Users,
  Settings,
  PiggyBank,
  TrendingUp,
  Shield,
  Sparkles
} from "lucide-react";

export const QuickActionsGrid = () => {
  const quickActions = [
    {
      icon: Send,
      label: "Send Money",
      description: "Transfer to any account",
      color: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: ArrowDownRight,
      label: "Request Money",
      description: "Generate payment link",
      color: "from-green-500 to-green-600", 
      iconBg: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: CreditCard,
      label: "Pay Bills",
      description: "Utilities & subscriptions",
      color: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: Smartphone,
      label: "Mobile Top-up",
      description: "Airtime & data bundles",
      color: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: PiggyBank,
      label: "Save & Invest",
      description: "Automated savings",
      color: "from-pink-500 to-pink-600",
      iconBg: "bg-pink-100 dark:bg-pink-900/20",
      iconColor: "text-pink-600 dark:text-pink-400"
    },
    {
      icon: BarChart3,
      label: "Analytics",
      description: "Financial insights",
      color: "from-indigo-500 to-indigo-600",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/20",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    }
  ];

  const premiumFeatures = [
    {
      icon: Sparkles,
      label: "AI Financial Advisor",
      description: "Personalized recommendations",
      isPremium: true
    },
    {
      icon: TrendingUp,
      label: "Advanced Analytics",
      description: "Deep financial insights",
      isPremium: true
    },
    {
      icon: Shield,
      label: "Fraud Protection",
      description: "Enhanced security monitoring",
      isPremium: true
    },
    {
      icon: Users,
      label: "Family Banking",
      description: "Multi-user account management",
      isPremium: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 hover:shadow-md transition-all duration-300 group border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:scale-105 btn-modern"
              >
                <div className={`p-2 sm:p-3 rounded-full ${action.iconBg} group-hover:scale-110 transition-transform`}>
                  <action.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.iconColor}`} />
                </div>
                <div className="text-center">
                  <p className="font-medium text-xs sm:text-sm leading-tight">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Premium Features */}
      <Card className="border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Premium Features</h3>
            <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              Upgrade to Pro
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {premiumFeatures.map((feature, index) => (
              <div
                key={index}
                className="p-3 sm:p-4 rounded-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm border hover:shadow-md transition-all duration-300 group cursor-pointer hover-lift"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{feature.label}</p>
                      <div className="px-1.5 py-0.5 rounded text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium flex-shrink-0">
                        PRO
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shortcuts */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Smart Shortcuts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start gap-4 hover:shadow-md transition-all duration-300 group border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
            >
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-medium">Split Bill</p>
                <p className="text-sm text-muted-foreground">Divide expenses with friends</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 justify-start gap-4 hover:shadow-md transition-all duration-300 group border-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
            >
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 group-hover:scale-110 transition-transform">
                <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="font-medium">Auto-Save</p>
                <p className="text-sm text-muted-foreground">Smart savings automation</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
