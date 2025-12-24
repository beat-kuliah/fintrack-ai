import { config } from '../../config';
import { logger } from '../../utils/logger';
import { TransactionData } from '../ai/cursor-agent.service';

export interface CreateTransactionRequest {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category_id?: string;
  description: string;
  wallet_id?: string; // Optional, will use default wallet if not provided
  date?: string;
}

export interface CreateTransactionResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Service untuk create transaction di backend API
 */
export class TransactionService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = config.backend.apiUrl;
  }

  /**
   * Create transaction di backend menggunakan JWT token
   */
  async createTransaction(
    jwtToken: string,
    transactionData: TransactionData,
    userId: string,
    walletId?: string // Optional: jika sudah dipilih sebelumnya
  ): Promise<CreateTransactionResponse> {
    try {
      // Get wallets untuk user
      const wallets = await this.getUserWallets(jwtToken, userId);

      if (wallets.length === 0) {
        return {
          success: false,
          error: 'No wallet found. Please create a wallet first.',
        };
      }

      // Determine wallet_id
      let selectedWalletId: string | null = null;

      if (walletId) {
        // Wallet sudah dipilih sebelumnya (dari user selection)
        selectedWalletId = walletId;
      } else if (transactionData.walletName) {
        // User specify wallet di pesan (contoh: "dari bank")
        selectedWalletId = this.findWalletByName(wallets, transactionData.walletName);
      }

      // If wallet not found from name and only 1 wallet, use it
      // (Default wallet hanya auto-select jika hanya 1 wallet)
      if (!selectedWalletId && wallets.length === 1) {
        selectedWalletId = wallets[0].id;
      }

      if (!selectedWalletId) {
        return {
          success: false,
          error: 'No wallet selected. Please specify a wallet.',
        };
      }

      // Map category name ke category_id (jika ada)
      let categoryId: string | undefined;
      if (transactionData.category) {
        categoryId = await this.getCategoryId(jwtToken, userId, transactionData.category);
      }

      const requestBody: CreateTransactionRequest = {
        type: transactionData.type,
        amount: transactionData.amount,
        description: transactionData.description,
        wallet_id: selectedWalletId,
        date: transactionData.date,
        category_id: categoryId,
      };

      const response = await fetch(`${this.backendUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Backend API error: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `Failed to create transaction: ${response.status}`,
        };
      }

      const data = await response.json();
      logger.info('Transaction created successfully:', data);

      return {
        success: true,
        transactionId: data.data?.id,
      };
    } catch (error) {
      logger.error('Error creating transaction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all wallets untuk user
   * Public method untuk digunakan oleh wallet-selection service
   */
  public async getUserWallets(jwtToken: string, userId: string): Promise<Array<{ id: string; name: string; wallet_type: string; is_default: boolean }>> {
    try {
      const response = await fetch(`${this.backendUrl}/api/wallets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      logger.error('Error getting user wallets:', error);
      return [];
    }
  }

  /**
   * Get wallet by name (fuzzy match)
   * Public method untuk digunakan oleh wallet-selection service
   */
  public findWalletByName(wallets: Array<{ id: string; name: string; wallet_type: string }>, walletName: string): string | null {
    if (!walletName) return null;

    const normalizedName = walletName.toLowerCase().trim();
    
    // Try exact match first
    let wallet = wallets.find(
      w => w.name.toLowerCase() === normalizedName || 
           w.wallet_type.toLowerCase() === normalizedName
    );
    
    if (wallet) return wallet.id;

    // Try partial match
    wallet = wallets.find(
      w => w.name.toLowerCase().includes(normalizedName) ||
           normalizedName.includes(w.name.toLowerCase()) ||
           normalizedName.includes(w.wallet_type.toLowerCase())
    );

    return wallet?.id || null;
  }

  /**
   * Get default wallet untuk user
   */
  private async getDefaultWallet(jwtToken: string, userId: string): Promise<string | null> {
    try {
      const wallets = await this.getUserWallets(jwtToken, userId);

      // Find default wallet
      const defaultWallet = wallets.find((w: any) => w.is_default === true);
      if (defaultWallet) {
        return defaultWallet.id;
      }

      // If no default, use first wallet
      if (wallets.length > 0) {
        return wallets[0].id;
      }

      return null;
    } catch (error) {
      logger.error('Error getting default wallet:', error);
      return null;
    }
  }

  /**
   * Get category_id dari category name
   */
  private async getCategoryId(
    jwtToken: string,
    userId: string,
    categoryName: string
  ): Promise<string | undefined> {
    try {
      const response = await fetch(`${this.backendUrl}/api/categories`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
      });

      if (!response.ok) {
        return undefined;
      }

      const data = await response.json();
      const categories = data.data || [];

      // Try to find matching category (case insensitive)
      const category = categories.find(
        (c: any) => c.name.toLowerCase() === categoryName.toLowerCase()
      );

      return category?.id;
    } catch (error) {
      logger.error('Error getting category:', error);
      return undefined;
    }
  }
}

export const transactionService = new TransactionService();

