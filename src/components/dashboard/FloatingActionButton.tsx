import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  DASHBOARD_ACTIONS,
  DASHBOARD_ACTION_ORDER,
  type DashboardActionType
} from "./action-config";

interface FloatingActionButtonProps {
  onActionSelect?: (action: DashboardActionType) => void;
  disabled?: boolean;
}

const ACTION_COLORS: Record<DashboardActionType, string> = {
  send: "bg-blue-500 hover:bg-blue-600",
  request: "bg-green-500 hover:bg-green-600",
  pay_bills: "bg-purple-500 hover:bg-purple-600",
  top_up: "bg-orange-500 hover:bg-orange-600"
};

export const FloatingActionButton = ({
  onActionSelect,
  disabled = false
}: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (disabled) {
      toast({
        title: "Connect an account",
        description: "Add a wallet to enable quick actions"
      });
      return;
    }

    setIsOpen((previous) => !previous);
  };

  const handleActionClick = (actionKey: DashboardActionType) => {
    setIsOpen(false);
    onActionSelect?.(actionKey);
  };

  const quickActions = DASHBOARD_ACTION_ORDER.map((key, index) => ({
    ...DASHBOARD_ACTIONS[key],
    color: ACTION_COLORS[key],
    delayClass: `animation-delay-${index * 50}`
  }));

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick Action Buttons */}
      <div className={cn(
        "absolute bottom-16 right-0 space-y-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {quickActions.map((action) => (
          <div
            key={action.key}
            className={cn(
              "flex items-center gap-3 animate-slide-up",
              isOpen ? action.delayClass : "animation-delay-0"
            )}
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
              onClick={() => handleActionClick(action.key)}
            >
              <action.icon className="h-5 w-5 text-white" />
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="icon"
        onClick={handleToggle}
        className={cn(
          "w-14 h-14 rounded-full shadow-xl border-0 transition-all duration-300 hover:scale-110 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700",
          isOpen && "rotate-45"
        )}
        disabled={disabled}
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
