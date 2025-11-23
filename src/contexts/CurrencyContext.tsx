import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Currency = "USD" | "EUR" | "GBP" | "NGN" | "ZAR" | "KES";
export type Language = "en" | "fr" | "es";

interface CurrencyContextType {
  currency: Currency;
  language: Language;
  setCurrency: (currency: Currency) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  formatCurrency: (value: number, currencyOverride?: Currency) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user's currency preference from database
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("default_currency, language")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user preferences:", error);
        } else if (data) {
          setCurrencyState((data.default_currency as Currency) || "USD");
          setLanguageState((data.language as Language) || "en");
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPreferences();
  }, [user?.id, isAuthenticated]);

  // Update currency in database and state
  const setCurrency = useCallback(async (newCurrency: Currency) => {
    if (!isAuthenticated || !user?.id) {
      console.warn("User must be authenticated to save currency preference");
      setCurrencyState(newCurrency); // Still update locally
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ default_currency: newCurrency })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating currency preference:", error);
        throw error;
      }

      setCurrencyState(newCurrency);
    } catch (error) {
      console.error("Failed to update currency:", error);
      throw error;
    }
  }, [user?.id, isAuthenticated]);

  // Update language in database and state
  const setLanguage = useCallback(async (newLanguage: Language) => {
    if (!isAuthenticated || !user?.id) {
      console.warn("User must be authenticated to save language preference");
      setLanguageState(newLanguage); // Still update locally
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ language: newLanguage })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating language preference:", error);
        throw error;
      }

      setLanguageState(newLanguage);
    } catch (error) {
      console.error("Failed to update language:", error);
      throw error;
    }
  }, [user?.id, isAuthenticated]);

  // Format currency with user's preference or override
  const formatCurrency = useCallback((value: number, currencyOverride?: Currency): string => {
    const currencyToUse = currencyOverride || currency;

    // Map language to locale
    const localeMap: Record<Language, string> = {
      en: "en-US",
      fr: "fr-FR",
      es: "es-ES",
    };

    try {
      return new Intl.NumberFormat(localeMap[language], {
        style: "currency",
        currency: currencyToUse,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    } catch (error) {
      console.error("Error formatting currency:", error);
      // Fallback formatting
      return `${currencyToUse} ${value.toFixed(2)}`;
    }
  }, [currency, language]);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        language,
        setCurrency,
        setLanguage,
        formatCurrency,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
