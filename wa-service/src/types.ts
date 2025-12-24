export type MessageStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'FAILED';

export interface SendMessageRequest {
  phoneNumber: string;
  message: string;
  userId?: string;
  templateId?: string;
}

export interface BulkMessageRequest {
  messages: Array<{
    phoneNumber: string;
    message: string;
    userId?: string;
    templateId?: string;
  }>;
}

export interface CreateTemplateRequest {
  name: string;
  content: string;
  variables: string[];
  description?: string;
}

export interface MessageJob {
  id: string;
  userId: string;
  phoneNumber: string;
  message: string;
  templateId?: string;
  retryCount: number;
}

export type EventType =
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_UPDATED'
  | 'WALLET_CREATED'
  | 'BUDGET_EXCEEDED'
  | 'REMINDER';

export interface TriggerCondition {
  walletId?: string;
  categoryId?: string;
  amountThreshold?: number;
  transactionType?: 'INCOME' | 'EXPENSE';
}

