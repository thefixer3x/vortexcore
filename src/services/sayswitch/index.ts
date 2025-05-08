
import { BankListResponse, BillCategoryResponse, BillProviderResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Frontend service for interacting with SaySwitch API via our backend
 */
export const SaySwitchService = {
  /**
   * Initialize a transaction
   */
  initializeTransaction: async (payload: {
    amount: number;
    email: string;
    firstName?: string;
    lastName?: string;
    metadata?: Record<string, any>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/payments/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize transaction');
    }

    return response.json();
  },

  /**
   * Get list of banks
   */
  getBanks: async (): Promise<BankListResponse> => {
    const response = await fetch(`${API_BASE_URL}/transfers/banks`);

    if (!response.ok) {
      throw new Error('Failed to fetch banks');
    }

    return response.json();
  },

  /**
   * Get bill categories
   */
  getBillCategories: async (): Promise<BillCategoryResponse> => {
    const response = await fetch(`${API_BASE_URL}/bills/categories`);

    if (!response.ok) {
      throw new Error('Failed to fetch bill categories');
    }

    return response.json();
  },

  /**
   * Get bill providers for a category
   */
  getBillProviders: async (categoryId: string): Promise<BillProviderResponse> => {
    const response = await fetch(`${API_BASE_URL}/bills/providers/${categoryId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch bill providers');
    }

    return response.json();
  },

  /**
   * Test connection to SaySwitch API
   */
  testConnection: async (apiKey: string, secretKey: string): Promise<boolean> => {
    try {
      // This would be a backend endpoint that validates the credentials
      const response = await fetch(`${API_BASE_URL}/sayswitch/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, secretKey }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === 'success';
    } catch (error) {
      console.error('Error testing SaySwitch connection:', error);
      return false;
    }
  },
};
