import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Send, 
  ArrowDownRight, 
  CreditCard, 
  X,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

export const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  // Handle action button clicks
  const handleActionClick = (actionType: string) => {
    setIsOpen(false); // Close the menu
    
    // Execute the appropriate action based on type
    switch(actionType) {
      case "Send Money":
        navigate("/dashboard/payments/send");
        break;
      case "Request":
        navigate("/dashboard/payments/request");
        break;
      case "Pay Bills":
        navigate("/dashboard/payments/bills");
        break;
      case "Top Up":
        navigate("/dashboard/accounts/topup");
        break;
      default:
        toast({
          title: "Coming Soon",
          description: `${actionType} functionality will be available soon.`,
        });
    }
  };

  const quickActions = [
    {
      icon: Send,
      label: "Send Money",
      color: "bg-blue-500 hover:bg-blue-600",
      delay: "0ms"
    },
    {
      icon: ArrowDownRight,
      label: "Request",
      color: "bg-green-500 hover:bg-green-600", 
      delay: "50ms"
    },
    {
      icon: CreditCard,
      label: "Pay Bills",
      color: "bg-purple-500 hover:bg-purple-600",
      delay: "100ms"
    },
    {
      icon: Zap,
      label: "Top Up",
      color: "bg-orange-500 hover:bg-orange-600",
      delay: "150ms"
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick Action Buttons */}
      <div className={cn(
        "absolute bottom-16 right-0 space-y-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {quickActions.map((action, index) => (
          <div
            key={action.label}
            className="flex items-center gap-3 animate-slide-up"
            style={{ animationDelay: isOpen ? action.delay : '0ms' }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-full px-3 py-2 shadow-lg text-sm font-medium whitespace-nowrap">
              {action.label}
            </div>
            <Button
              size="icon"
              className={cn(
                "w-12 h-12 rounded-full shadow-lg border-0 transition-all duration-300 hover:scale-110",
                action.color
              )}
              onClick={() => handleActionClick(action.label)}
            >
              <action.icon className="h-5 w-5 text-white" />
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl border-0 transition-all duration-300 hover:scale-110 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Plus className="h-6 w-6 text-white" />
        )}
      </Button>
    </div>
  );
};
