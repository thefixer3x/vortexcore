import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useCurrency, Currency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Wallet,
  Globe,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  TrendingUp,
  Coins,
} from "lucide-react";

const currencyOptions: { value: Currency; label: string; flag: string }[] = [
  { value: "NGN", label: "Nigerian Naira", flag: "🇳🇬" },
  { value: "USD", label: "US Dollar", flag: "🇺🇸" },
  { value: "EUR", label: "Euro", flag: "🇪🇺" },
  { value: "GBP", label: "British Pound", flag: "🇬🇧" },
  { value: "ZAR", label: "South African Rand", flag: "🇿🇦" },
  { value: "KES", label: "Kenyan Shilling", flag: "🇰🇪" },
];

export function OnboardingFlow() {
  const { state, completeStep, completeOnboarding } = useOnboarding();
  const { currency, setCurrency } = useCurrency();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!state.isActive) return null;

  const currentStepIndex = state.step - 1;
  const progressPercent = (state.step / state.totalSteps) * 100;

  // Step 1: Welcome & Currency
  if (currentStepIndex === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-8 animate-fade-in space-y-8">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step 1 of 3</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Welcome Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Welcome to VortexCore!</h2>
            <p className="text-muted-foreground">
              Your personal finance hub — let's get you set up in just a few steps.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Choose your default currency
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {currencyOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={currency === option.value ? "default" : "outline"}
                  className={`h-16 justify-start gap-3 text-sm ${
                    currency === option.value
                      ? "border-2 border-blue-500 shadow-sm"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setCurrency(option.value)}
                >
                  <span className="text-lg">{option.flag}</span>
                  <span className="font-medium">{option.value}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Skip to next step without setting currency
                completeStep(1);
              }}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={() => completeStep(2)}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Connect Bank
  if (currentStepIndex === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-8 animate-fade-in space-y-8">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step 2 of 3</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Connect Your Banks</h2>
            <p className="text-muted-foreground">
              Link your bank accounts to see all your finances in one place. Your data is encrypted and secure.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Plaid Integration</p>
                  <p className="text-xs text-muted-foreground">Connect any US bank securely</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Direct Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">Manual account setup for African banks</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => completeStep(3)}
            >
              Skip for now
            </Button>
            <Button
              className="flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={async () => {
                setIsLoading(true);
                // TODO: Open Plaid link / manual bank form
                toast({
                  title: "Bank linking coming soon",
                  description: "We're adding bank integration this week!",
                });
                await completeStep(3);
                setIsLoading(false);
              }}
            >
              {isLoading ? "Connecting..." : "Connect Now"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Complete
  if (currentStepIndex === 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-8 animate-fade-in space-y-8">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step 3 of 3</span>
              <span>100%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `100%` }}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold">You're All Set!</h2>
            <p className="text-muted-foreground">
              Your VortexCore account is ready. Here's what you can do now:
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm">Set up notifications in Settings</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-sm">Add your first transaction manually</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm">Explore virtual cards feature</p>
            </div>
          </div>

          <Button
            className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={async () => {
              await completeOnboarding();
              toast({
                title: "Welcome aboard! 🎉",
                description: "Your VortexCore account is ready to use.",
              });
            }}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
}