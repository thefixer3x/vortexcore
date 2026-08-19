import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  PersonalizedAIService,
  type PersonalizedInsight,
  type UserFinancialContext,
} from "@/services/personalizedAIService";

interface UseFinancialInsightsResult {
  context: UserFinancialContext | null;
  insights: PersonalizedInsight[];
  isLoading: boolean;
  hasData: boolean;
  refresh: () => Promise<void>;
}

export function useFinancialInsights(): UseFinancialInsightsResult {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [context, setContext] = useState<UserFinancialContext | null>(null);
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setContext(null);
      setInsights([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const financialContext = await PersonalizedAIService.getUserFinancialContext(user.id);
      setContext(financialContext);
      setInsights(
        financialContext
          ? PersonalizedAIService.generatePersonalizedInsights(financialContext, formatCurrency)
          : []
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, formatCurrency]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasData = Boolean(context && context.recentTransactions.length > 0);

  return { context, insights, isLoading, hasData, refresh };
}
