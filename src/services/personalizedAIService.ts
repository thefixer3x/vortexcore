import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from './chatSessionService';

export interface UserFinancialContext {
  userId: string;
  wallets: Array<{
    id: string;
    balance: number;
    currency: string;
    wallet_type: string;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    currency: string;
    transaction_type: string;
    description: string;
    created_at: string;
  }>;
  monthlySpending: {
    total: number;
    categories: Record<string, number>;
  };
  savingsGoals?: Array<{
    target_amount: number;
    current_amount: number;
    goal_name: string;
    deadline: string;
  }>;
  creditScore?: number;
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
}

export interface PersonalizedInsight {
  type: 'spending_alert' | 'savings_opportunity' | 'investment_suggestion' | 'budget_recommendation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionable: boolean;
  data?: any;
}

/**
 * Service for providing personalized AI insights based on user's financial data
 * Ensures privacy and security while delivering contextual financial advice
 */
export class PersonalizedAIService {
  /**
   * Get comprehensive financial context for a user
   */
  static async getUserFinancialContext(userId: string): Promise<UserFinancialContext | null> {
    try {
      // Fetch user's wallets
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('id, balance, currency, wallet_type')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (walletsError) {
        console.error('Error fetching wallets:', walletsError);
        return null;
      }

      // Fetch recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, amount, currency, transaction_type, description, created_at')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      }

      // Calculate monthly spending by category
      const monthlySpending = this.calculateMonthlySpending(transactions || []);

      // Fetch user settings and preferences
      const { data: settings } = await supabase
        .from('vortex_settings')
        .select('setting_key, setting_value')
        .eq('user_id', userId);

      const userSettings = settings?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, any>) || {};

      return {
        userId,
        wallets: wallets || [],
        recentTransactions: transactions || [],
        monthlySpending,
        creditScore: userSettings.credit_score,
        riskProfile: userSettings.risk_profile || 'moderate'
      };
    } catch (error) {
      console.error('Error getting user financial context:', error);
      return null;
    }
  }

  /**
   * Generate personalized financial insights for a user
   */
  static async generatePersonalizedInsights(userId: string): Promise<PersonalizedInsight[]> {
    const context = await this.getUserFinancialContext(userId);
    if (!context) return [];

    const insights: PersonalizedInsight[] = [];

    // Spending pattern analysis
    if (context.monthlySpending.total > 0) {
      insights.push(...this.analyzeSpendingPatterns(context));
    }

    // Savings opportunities
    insights.push(...this.identifySavingsOpportunities(context));

    // Investment suggestions based on risk profile
    if (context.wallets.some(w => w.balance > 1000)) {
      insights.push(...this.generateInvestmentSuggestions(context));
    }

    // Budget recommendations
    insights.push(...this.generateBudgetRecommendations(context));

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Create AI prompt with personalized context for better responses
   */
  static async createPersonalizedAIPrompt(
    userId: string,
    userQuery: string
  ): Promise<string> {
    const context = await this.getUserFinancialContext(userId);
    if (!context) return userQuery;

    const contextSummary = this.createContextSummary(context);

    return `
Context: You are VortexAI, a personal financial assistant. The user has the following financial profile:

${contextSummary}

User Query: ${userQuery}

Please provide personalized advice based on their specific financial situation. Be specific and actionable.
    `.trim();
  }

  /**
   * Enhanced message processing for AI with financial context
   */
  static async processMessageWithContext(
    userId: string,
    messages: ChatMessage[]
  ): Promise<ChatMessage[]> {
    // Add system context message for AI
    const context = await this.getUserFinancialContext(userId);
    if (!context) return messages;

    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are VortexAI, a personal financial assistant. The user's current financial context:

Wallets: ${context.wallets.length} accounts with total balance of ${this.calculateTotalBalance(context.wallets)}
Recent Activity: ${context.recentTransactions.length} transactions in the last 30 days
Monthly Spending: ${context.monthlySpending.total} across ${Object.keys(context.monthlySpending.categories).length} categories
Risk Profile: ${context.riskProfile}

Provide personalized, actionable financial advice based on this context.`,
      timestamp: new Date().toISOString()
    };

    return [systemMessage, ...messages];
  }

  // Private helper methods
  private static calculateMonthlySpending(transactions: any[]): UserFinancialContext['monthlySpending'] {
    const total = transactions
      .filter(t => t.transaction_type === 'expense' || t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categories: Record<string, number> = {};
    transactions
      .filter(t => t.transaction_type === 'expense' || t.amount < 0)
      .forEach(t => {
        const category = this.categorizeTransaction(t.description);
        categories[category] = (categories[category] || 0) + Math.abs(t.amount);
      });

    return { total, categories };
  }

  private static categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();

    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('grocery')) return 'Food & Dining';
    if (desc.includes('gas') || desc.includes('fuel') || desc.includes('transport')) return 'Transportation';
    if (desc.includes('shop') || desc.includes('amazon') || desc.includes('store')) return 'Shopping';
    if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('utilities')) return 'Housing';
    if (desc.includes('health') || desc.includes('medical') || desc.includes('pharmacy')) return 'Healthcare';
    if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('game')) return 'Entertainment';

    return 'Other';
  }

  private static analyzeSpendingPatterns(context: UserFinancialContext): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = [];
    const { monthlySpending } = context;

    // Find highest spending category
    const topCategory = Object.entries(monthlySpending.categories)
      .sort(([,a], [,b]) => b - a)[0];

    if (topCategory && topCategory[1] > monthlySpending.total * 0.3) {
      insights.push({
        type: 'spending_alert',
        priority: 'high',
        title: `High ${topCategory[0]} Spending`,
        message: `You've spent $${topCategory[1].toFixed(2)} on ${topCategory[0]} this month (${((topCategory[1] / monthlySpending.total) * 100).toFixed(1)}% of total spending). Consider setting a budget limit.`,
        actionable: true,
        data: { category: topCategory[0], amount: topCategory[1] }
      });
    }

    return insights;
  }

  private static identifySavingsOpportunities(context: UserFinancialContext): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = [];
    const totalBalance = this.calculateTotalBalance(context.wallets);
    const monthlySpending = context.monthlySpending.total;

    if (totalBalance > monthlySpending * 6) {
      insights.push({
        type: 'savings_opportunity',
        priority: 'medium',
        title: 'Emergency Fund Established',
        message: `You have ${(totalBalance / monthlySpending).toFixed(1)} months of expenses saved. Consider investing excess funds for growth.`,
        actionable: true,
        data: { months_saved: totalBalance / monthlySpending }
      });
    } else if (totalBalance < monthlySpending * 3) {
      insights.push({
        type: 'savings_opportunity',
        priority: 'high',
        title: 'Build Emergency Fund',
        message: `Aim for 3-6 months of expenses in savings. You need $${((monthlySpending * 3) - totalBalance).toFixed(2)} more.`,
        actionable: true,
        data: { target_amount: monthlySpending * 3 - totalBalance }
      });
    }

    return insights;
  }

  private static generateInvestmentSuggestions(context: UserFinancialContext): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = [];
    const { riskProfile } = context;

    let suggestion = '';
    switch (riskProfile) {
      case 'conservative':
        suggestion = 'Consider low-risk options like CDs, treasury bonds, or conservative mutual funds.';
        break;
      case 'aggressive':
        suggestion = 'You might explore growth stocks, ETFs, or emerging market investments.';
        break;
      default:
        suggestion = 'Consider a balanced portfolio with index funds and diversified ETFs.';
    }

    insights.push({
      type: 'investment_suggestion',
      priority: 'medium',
      title: `Investment Options for ${riskProfile} Risk Profile`,
      message: suggestion,
      actionable: true,
      data: { risk_profile: riskProfile }
    });

    return insights;
  }

  private static generateBudgetRecommendations(context: UserFinancialContext): PersonalizedInsight[] {
    const insights: PersonalizedInsight[] = [];
    const income = context.recentTransactions
      .filter(t => t.amount > 0 && t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    if (income > 0 && context.monthlySpending.total > income * 0.8) {
      insights.push({
        type: 'budget_recommendation',
        priority: 'high',
        title: 'High Spending to Income Ratio',
        message: `Your monthly expenses (${context.monthlySpending.total}) are ${((context.monthlySpending.total / income) * 100).toFixed(1)}% of income. Consider the 50/30/20 rule.`,
        actionable: true,
        data: { spending_ratio: context.monthlySpending.total / income }
      });
    }

    return insights;
  }

  private static calculateTotalBalance(wallets: UserFinancialContext['wallets']): number {
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  }

  private static createContextSummary(context: UserFinancialContext): string {
    const totalBalance = this.calculateTotalBalance(context.wallets);
    const recentTransactionsCount = context.recentTransactions.length;
    const topSpendingCategory = Object.entries(context.monthlySpending.categories)
      .sort(([,a], [,b]) => b - a)[0];

    return `
- Total Balance: $${totalBalance.toFixed(2)} across ${context.wallets.length} accounts
- Recent Activity: ${recentTransactionsCount} transactions in last 30 days
- Monthly Spending: $${context.monthlySpending.total.toFixed(2)}
- Top Spending Category: ${topSpendingCategory?.[0] || 'N/A'} ($${topSpendingCategory?.[1]?.toFixed(2) || '0'})
- Risk Profile: ${context.riskProfile}
    `.trim();
  }
}

export default PersonalizedAIService;