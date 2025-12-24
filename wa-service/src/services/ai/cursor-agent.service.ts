import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface TransactionData {
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category?: string;
  description: string;
  date?: string; // ISO date string
  confidence?: number; // 0-1, confidence score dari AI
  walletName?: string; // Nama wallet jika disebutkan di pesan (contoh: "dari bank", "dari cash")
}

export interface CursorAgentResponse {
  transaction: TransactionData | null;
  error?: string;
  rawResponse?: any;
}

/**
 * Service untuk integrasi dengan Cursor Cloud Agent API
 * Menganalisis pesan WhatsApp dan extract transaction data
 */
export class CursorAgentService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = config.cursor.apiKey;
    this.apiUrl = config.cursor.apiUrl;

    if (!this.apiKey) {
      logger.warn('CURSOR_API_KEY not set. AI analysis will not work.');
    }
  }

  /**
   * Analisis pesan dan extract transaction data
   */
  async analyzeTransaction(message: string): Promise<CursorAgentResponse> {
    if (!this.apiKey) {
      return {
        transaction: null,
        error: 'Cursor API key not configured',
      };
    }

    try {
      const systemPrompt = `You are a financial transaction parser for a personal finance app. 
Extract transaction details from user messages in Indonesian or English.

Rules:
1. Identify transaction type: INCOME or EXPENSE
2. Extract amount (in Indonesian Rupiah, convert to number)
3. Extract category if mentioned (Food, Transport, Shopping, etc.)
4. Extract description
5. Extract date if mentioned, otherwise use today's date
6. Extract wallet name if mentioned (e.g., "dari bank", "dari cash", "dari e-wallet", "pakai bank", etc.)

Return JSON format:
{
  "type": "EXPENSE" | "INCOME",
  "amount": number,
  "category": "string (optional)",
  "description": "string",
  "date": "YYYY-MM-DD (optional, default to today)",
  "walletName": "string (optional, e.g., 'bank', 'cash', 'e-wallet')",
  "confidence": 0.0-1.0
}`;

      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Cursor API error: ${response.status} - ${errorText}`);
        return {
          transaction: null,
          error: `API error: ${response.status}`,
        };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return {
          transaction: null,
          error: 'No content in API response',
          rawResponse: data,
        };
      }

      // Parse JSON dari response
      let transactionData: TransactionData;
      try {
        // Extract JSON dari response (bisa ada markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          transactionData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        logger.error('Failed to parse AI response:', parseError);
        logger.error('Response content:', content);
        return {
          transaction: null,
          error: 'Failed to parse AI response',
          rawResponse: content,
        };
      }

      // Validate transaction data
      if (!transactionData.type || !transactionData.amount || !transactionData.description) {
        return {
          transaction: null,
          error: 'Invalid transaction data from AI',
          rawResponse: transactionData,
        };
      }

      // Set default date jika tidak ada
      if (!transactionData.date) {
        transactionData.date = new Date().toISOString().split('T')[0];
      }

      logger.info('Transaction extracted:', transactionData);

      return {
        transaction: transactionData,
      };
    } catch (error) {
      logger.error('Error calling Cursor API:', error);
      return {
        transaction: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const cursorAgentService = new CursorAgentService();

