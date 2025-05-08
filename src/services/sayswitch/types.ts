
// Type definitions for SaySwitch API responses
// Common response structure
export interface ApiResponse {
  status: string;
  message: string;
}

// Transaction Initialization Response
export interface TransactionResponse extends ApiResponse {
  data?: {
    reference: string;
    authorizationUrl: string;
    accessCode?: string;
  };
}

// Transaction Verification Response
export interface VerifyResponse extends ApiResponse {
  data?: {
    id: number;
    reference: string;
    amount: number;
    status: 'success' | 'pending' | 'failed';
    gateway_response: string;
    channel: string;
    currency: string;
    customer: {
      id: number;
      email: string;
      first_name?: string;
      last_name?: string;
    };
    metadata?: Record<string, any>;
    paid_at?: string;
    created_at: string;
  };
}

// Bank List Response
export interface Bank {
  id: number;
  code: string;
  name: string;
}

export interface BankListResponse extends ApiResponse {
  data?: Bank[];
}

// Transfer Response
export interface TransferResponse extends ApiResponse {
  data?: {
    id: number;
    reference: string;
    amount: number;
    status: 'success' | 'pending' | 'failed';
    recipient: {
      account_number: string;
      account_name: string;
      bank_code: string;
      bank_name: string;
    };
    created_at: string;
  };
}

// Bill Categories Response
export interface BillCategory {
  id: string;
  name: string;
  description?: string;
}

export interface BillCategoryResponse extends ApiResponse {
  data?: BillCategory[];
}

// Bill Providers Response
export interface BillProvider {
  id: string;
  name: string;
  serviceType: string;
  biller_code: string;
  is_fixed_amount: boolean;
  minimum_amount?: number;
  maximum_amount?: number;
}

export interface BillProviderResponse extends ApiResponse {
  data?: BillProvider[];
}

// Bill Payment Response
export interface BillPaymentResponse extends ApiResponse {
  data?: {
    id: number;
    reference: string;
    amount: number;
    service_id: string;
    customer_id: string;
    receipt_number?: string;
    status: 'success' | 'pending' | 'failed';
    created_at: string;
  };
}

// Card Validation Response
export interface CardValidationResponse extends ApiResponse {
  data?: {
    card_type: string;
    bank: string;
    country: string;
    is_valid: boolean;
    expiry_valid: boolean;
  };
}

// Webhook Event Types
export enum WebhookEventType {
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  TRANSFER_SUCCESS = 'transfer.success',
  TRANSFER_FAILED = 'transfer.failed',
  BILL_PAYMENT_SUCCESS = 'bill.success',
  BILL_PAYMENT_FAILED = 'bill.failed',
  VIRTUAL_ACCOUNT_FUNDING = 'virtual_account.credited'
}

// Webhook Event
export interface WebhookEvent {
  event: WebhookEventType;
  data: Record<string, any>;
}
