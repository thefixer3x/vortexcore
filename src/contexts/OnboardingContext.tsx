import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface OnboardingState {
  isActive: boolean;
  step: number;
  totalSteps: number;
  currentStep: "welcome" | "currency" | "connect_bank" | "complete";
  isComplete: boolean;
  startedAt: number | null;
  completedAt: number | null;
}

interface OnboardingContextType {
  state: OnboardingState;
  startOnboarding: () => Promise<void>;
  completeStep: (stepNumber: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  shouldShowOnboarding: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_KEY = "vortex_onboarding";
const TOTAL_STEPS = 3;

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    isActive: false,
    step: 1,
    totalSteps: TOTAL_STEPS,
    currentStep: "welcome",
    isComplete: false,
    startedAt: null,
    completedAt: null,
  });

  const determineOnboardingState = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setState({
        isActive: false,
        step: 1,
        totalSteps: TOTAL_STEPS,
        currentStep: "welcome",
        isComplete: false,
        startedAt: null,
        completedAt: null,
      });
      return;
    }

    try {
      // Check if onboarding was already completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        setState({
          isActive: false,
          step: 1,
          totalSteps: TOTAL_STEPS,
          currentStep: "welcome",
          isComplete: true,
          startedAt: null,
          completedAt: null,
        });
        return;
      }

      // Check if user has any transactions (if they do, they're active users)
      const { count: transactionCount } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .limit(1);

      if (transactionCount && transactionCount > 0) {
        setState({
          isActive: false,
          step: 1,
          totalSteps: TOTAL_STEPS,
          currentStep: "welcome",
          isComplete: true,
          startedAt: null,
          completedAt: null,
        });
        return;
      }

      // User is new — start onboarding
      setState({
        isActive: true,
        step: 1,
        totalSteps: TOTAL_STEPS,
        currentStep: "welcome",
        isComplete: false,
        startedAt: Date.now(),
        completedAt: null,
      });
    } catch (error) {
      console.error("Error determining onboarding state:", error);
    }
  }, [isAuthenticated, user?.id]);

  // Check onboarding state on auth change
  useEffect(() => {
    determineOnboardingState();
  }, [determineOnboardingState]);

  const startOnboarding = async () => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      startedAt: prev.startedAt || Date.now(),
    }));
  };

  const completeStep = async (stepNumber: number) => {
    setState((prev) => {
      const nextStep = stepNumber + 1;
      if (nextStep > TOTAL_STEPS) {
        return {
          ...prev,
          step: TOTAL_STEPS,
          isComplete: true,
          completedAt: Date.now(),
        };
      }

      return {
        ...prev,
        step: nextStep,
        currentStep:
          nextStep === 1
            ? "welcome"
            : nextStep === 2
              ? "currency"
              : nextStep === 3
                ? "connect_bank"
                : prev.currentStep,
      };
    });
  };

  const completeOnboarding = async () => {
    if (!user?.id) return;

    try {
      // Mark onboarding as completed in the database
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      setState((prev) => ({
        ...prev,
        isActive: false,
        step: TOTAL_STEPS,
        isComplete: true,
        completedAt: Date.now(),
      }));
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  };

  const resetOnboarding = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: false })
        .eq("id", user.id);

      setState({
        isActive: true,
        step: 1,
        totalSteps: TOTAL_STEPS,
        currentStep: "welcome",
        isComplete: false,
        startedAt: Date.now(),
        completedAt: null,
      });
    } catch (error) {
      console.error("Error resetting onboarding:", error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        startOnboarding,
        completeStep,
        completeOnboarding,
        resetOnboarding,
        shouldShowOnboarding: state.isActive,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}