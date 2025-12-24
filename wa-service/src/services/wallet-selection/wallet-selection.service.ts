import { logger } from '../utils/logger';
import { transactionService } from '../transaction/transaction.service';
import { TransactionData } from '../ai/cursor-agent.service';

export interface WalletOption {
  id: string;
  name: string;
  wallet_type: string;
  is_default: boolean;
}

export interface WalletSelectionState {
  userId: string;
  phoneNumber: string;
  transactionData: TransactionData;
  jwtToken: string;
  timestamp: number;
}

/**
 * Service untuk handle wallet selection flow
 * Menyimpan state sementara saat user memilih wallet
 */
export class WalletSelectionService {
  private pendingSelections: Map<string, WalletSelectionState> = new Map();
  private selectionTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if user perlu memilih wallet
   * Returns: null jika tidak perlu, atau array of wallets jika perlu
   */
  async checkWalletSelection(
    jwtToken: string,
    userId: string,
    transactionData: TransactionData,
    phoneNumber: string
  ): Promise<{ needsSelection: boolean; wallets?: WalletOption[]; selectedWalletId?: string }> {
    try {
      const wallets = await transactionService.getUserWallets(jwtToken, userId);

      if (wallets.length === 0) {
        return { needsSelection: false };
      }

      // Jika hanya 1 wallet, langsung pakai (ini satu-satunya case auto-select)
      if (wallets.length === 1) {
        return { needsSelection: false, selectedWalletId: wallets[0].id };
      }

      // Jika user specify wallet di pesan, coba match
      if (transactionData.walletName) {
        const matchedWalletId = transactionService.findWalletByName(wallets, transactionData.walletName);
        if (matchedWalletId) {
          return { needsSelection: false, selectedWalletId: matchedWalletId };
        }
      }

      // Jika lebih dari 1 wallet, selalu tanya user untuk pilih
      // (meskipun ada default wallet, tetap tanya untuk konfirmasi)
      return {
        needsSelection: true,
        wallets: wallets.map(w => ({
          id: w.id,
          name: w.name,
          wallet_type: w.wallet_type,
          is_default: w.is_default,
        })),
      };
    } catch (error) {
      logger.error('Error checking wallet selection:', error);
      return { needsSelection: false };
    }
  }

  /**
   * Store pending selection state
   */
  storePendingSelection(
    phoneNumber: string,
    state: WalletSelectionState
  ): void {
    this.pendingSelections.set(phoneNumber, state);
    
    // Auto cleanup after timeout
    setTimeout(() => {
      this.pendingSelections.delete(phoneNumber);
    }, this.selectionTimeout);
  }

  /**
   * Get pending selection state
   */
  getPendingSelection(phoneNumber: string): WalletSelectionState | null {
    const state = this.pendingSelections.get(phoneNumber);
    if (!state) return null;

    // Check if expired
    if (Date.now() - state.timestamp > this.selectionTimeout) {
      this.pendingSelections.delete(phoneNumber);
      return null;
    }

    return state;
  }

  /**
   * Process wallet selection dari user
   * User bisa reply dengan nomor (1, 2, 3) atau nama wallet
   */
  async processWalletSelection(
    phoneNumber: string,
    userResponse: string
  ): Promise<{ success: boolean; walletId?: string; error?: string }> {
    const state = this.getPendingSelection(phoneNumber);
    
    if (!state) {
      return {
        success: false,
        error: 'No pending transaction. Please send a new transaction message.',
      };
    }

    const wallets = await transactionService.getUserWallets(state.jwtToken, state.userId);
    
    // Try to parse as number (1, 2, 3, etc.)
    const selectionNumber = parseInt(userResponse.trim());
    if (!isNaN(selectionNumber) && selectionNumber > 0 && selectionNumber <= wallets.length) {
      const selectedWallet = wallets[selectionNumber - 1];
      this.pendingSelections.delete(phoneNumber);
      
      return {
        success: true,
        walletId: selectedWallet.id,
      };
    }

    // Try to match by name
    const matchedWalletId = transactionService.findWalletByName(wallets, userResponse);
    if (matchedWalletId) {
      this.pendingSelections.delete(phoneNumber);
      
      return {
        success: true,
        walletId: matchedWalletId,
      };
    }

    return {
      success: false,
      error: 'Invalid wallet selection. Please choose a number or wallet name.',
    };
  }

  /**
   * Clear pending selection
   */
  clearPendingSelection(phoneNumber: string): void {
    this.pendingSelections.delete(phoneNumber);
  }

  /**
   * Format wallet list untuk ditampilkan ke user
   */
  formatWalletList(wallets: WalletOption[]): string {
    let message = '💰 Pilih wallet untuk transaksi ini:\n\n';
    
    wallets.forEach((wallet, index) => {
      const defaultBadge = wallet.is_default ? ' (Default)' : '';
      message += `${index + 1}. ${wallet.name}${defaultBadge}\n`;
    });

    message += '\nBalas dengan nomor (1, 2, 3...) atau nama wallet.';
    
    return message;
  }
}

export const walletSelectionService = new WalletSelectionService();

