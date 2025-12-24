import makeWASocket, {
  ConnectionState,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import P from 'pino';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as qrcode from 'qrcode-terminal';

export class WhatsAppService {
  private socket: WASocket | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private qrCode: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  /**
   * Initialize WhatsApp connection
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing WhatsApp service with Baileys...');

      // Ensure auth directory exists
      const authDir = join(process.cwd(), 'data', 'auth');
      if (!existsSync(authDir)) {
        mkdirSync(authDir, { recursive: true });
      }

      await this.connect();
    } catch (error) {
      logger.error('Failed to initialize WhatsApp service:', error);
      throw error;
    }
  }

  /**
   * Connect to WhatsApp
   */
  private async connect(): Promise<void> {
    try {
      this.connectionState = 'connecting';
      logger.info('Connecting to WhatsApp...');

      const { version } = await fetchLatestBaileysVersion();
      logger.info(`Using Baileys version: ${version.join('.')}`);

      const { state, saveCreds } = await useMultiFileAuthState(
        join(process.cwd(), 'data', 'auth')
      );

      const socket = makeWASocket({
        version,
        // printQRInTerminal is deprecated, QR code is handled via connection.update event
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })),
        },
        logger: P({ level: 'silent' }),
        browser: ['WhatsApp Service', 'Chrome', '1.0.0'],
        getMessage: async (key) => {
          return {
            conversation: 'Message not found',
          };
        },
      });

      this.socket = socket;

      // Handle connection updates
      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('connection.update', (update) => {
        this.handleConnectionUpdate(update);
      });

      // Handle messages
      socket.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
          for (const msg of m.messages) {
            if (!msg.key.fromMe) {
              logger.info(`Received message from ${msg.key.remoteJid}`);
              // Handle incoming messages
              await this.handleIncomingMessage(msg);
            }
          }
        }
      });

      logger.info('WhatsApp socket created successfully');
    } catch (error) {
      logger.error('Error connecting to WhatsApp:', error);
      this.connectionState = 'disconnected';
      throw error;
    }
  }

  /**
   * Handle connection state updates
   */
  private handleConnectionUpdate(update: Partial<ConnectionState>): void {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.qrCode = qr;
      logger.info('QR Code generated. Please scan with WhatsApp.');
      // Print QR code as ASCII art in terminal
      console.log('\n═══════════════════════════════════════');
      console.log('📱 SCAN QR CODE DENGAN WHATSAPP APP');
      console.log('═══════════════════════════════════════\n');
      try {
        qrcode.generate(qr, { small: true }, (qrCodeString) => {
          console.log(qrCodeString);
        });
        console.log('\n═══════════════════════════════════════\n');
      } catch (error) {
        // Fallback to string if qrcode-terminal fails
        logger.info(`QR Code string: ${qr}`);
      }
    }

    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      logger.warn(
        `Connection closed. Reason: ${lastDisconnect?.error}. Should reconnect: ${shouldReconnect}`
      );

      this.connectionState = 'disconnected';
      this.qrCode = null;

      if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        logger.info(
          `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
        );
        setTimeout(() => {
          this.connect();
        }, this.reconnectDelay);
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Max reconnection attempts reached');
      }
    } else if (connection === 'open') {
      logger.info('✅ WhatsApp connected successfully!');
      this.connectionState = 'connected';
      this.qrCode = null;
      this.reconnectAttempts = 0;
    } else if (connection === 'connecting') {
      this.connectionState = 'connecting';
      logger.info('Connecting to WhatsApp...');
    }
  }

  /**
   * Send text message
   */
  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (!this.socket || this.connectionState !== 'connected') {
        logger.error('WhatsApp is not connected');
        throw new Error('WhatsApp is not connected');
      }

      // Format phone number (remove +, spaces, etc.)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const jid = `${formattedNumber}@s.whatsapp.net`;

      logger.info(`Sending message to ${jid}`);

      await this.socket.sendMessage(jid, { text: message });

      logger.info(`Message sent successfully to ${phoneNumber}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send message to ${phoneNumber}:`, error);
      throw error;
    }
  }

  /**
   * Format phone number to WhatsApp format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let formatted = phoneNumber.replace(/\D/g, '');

    // Remove leading country code if present (assuming Indonesia +62)
    if (formatted.startsWith('62')) {
      formatted = formatted.substring(2);
    }

    // Remove leading 0 if present
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }

    // Add country code
    return `62${formatted}`;
  }

  /**
   * Get connection status
   */
  getStatus(): {
    connected: boolean;
    state: string;
    hasQR: boolean;
  } {
    return {
      connected: this.connectionState === 'connected',
      state: this.connectionState,
      hasQR: this.qrCode !== null,
    };
  }

  /**
   * Get QR code
   */
  getQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    try {
      logger.info('Closing WhatsApp connection...');
      if (this.socket) {
        await this.socket.end();
        this.socket = null;
      }
      this.connectionState = 'disconnected';
      this.qrCode = null;
      logger.info('WhatsApp connection closed');
    } catch (error) {
      logger.error('Error closing WhatsApp connection:', error);
      throw error;
    }
  }

  /**
   * Reconnect manually
   */
  async reconnect(): Promise<void> {
    logger.info('Manual reconnect requested');
    this.reconnectAttempts = 0;
    await this.close();
    await this.connect();
  }

  /**
   * Handle incoming WhatsApp message
   * Extract phone number, map to user, analyze with AI, create transaction
   */
  private async handleIncomingMessage(msg: any): Promise<void> {
    try {
      // Extract phone number from remoteJid (format: 6281234567890@s.whatsapp.net)
      const remoteJid = msg.key.remoteJid;
      if (!remoteJid || remoteJid.includes('@g.us')) {
        // Ignore group messages
        return;
      }

      // Extract message text
      const messageText = msg.message?.conversation || 
                         msg.message?.extendedTextMessage?.text || 
                         '';
      
      if (!messageText.trim()) {
        // Ignore non-text messages for now
        return;
      }

      logger.info(`Processing message from ${remoteJid}: ${messageText}`);

      // Import services (lazy import to avoid circular dependencies)
      const { userMappingService } = await import('../user-mapping/user-mapping.service');
      const { cursorAgentService } = await import('../ai/cursor-agent.service');
      const { transactionService } = await import('../transaction/transaction.service');
      const { jwtService } = await import('../jwt/jwt.service');

      // 1. Map phone number to user_id
      const userMapping = await userMappingService.getUserByPhoneNumber(remoteJid);
      
      if (!userMapping || !userMapping.isVerified) {
        const phoneNumber = remoteJid.split('@')[0];
        await this.sendMessage(
          phoneNumber,
          '❌ Nomor WhatsApp Anda belum terdaftar atau belum terverifikasi.\n\n' +
          'Silakan verifikasi nomor WhatsApp Anda di aplikasi FinTrack terlebih dahulu.'
        );
        return;
      }

      // 2. Check if this is a wallet selection response
      const { walletSelectionService } = await import('../wallet-selection/wallet-selection.service');
      const walletSelection = await walletSelectionService.getPendingSelection(remoteJid);
      
      if (walletSelection) {
        // User sedang memilih wallet
        const selectionResult = await walletSelectionService.processWalletSelection(
          remoteJid,
          messageText
        );

        if (selectionResult.success && selectionResult.walletId) {
          // Create transaction dengan wallet yang dipilih
          const transactionResult = await transactionService.createTransaction(
            walletSelection.jwtToken,
            walletSelection.transactionData,
            walletSelection.userId,
            selectionResult.walletId
          );

          await this.sendTransactionConfirmation(
            remoteJid.split('@')[0],
            transactionResult,
            walletSelection.transactionData
          );
        } else {
          await this.sendMessage(
            remoteJid.split('@')[0],
            `❌ ${selectionResult.error || 'Invalid selection. Please try again.'}`
          );
        }
        return;
      }

      // 3. Analyze message dengan Cursor Cloud Agent API
      const analysisResult = await cursorAgentService.analyzeTransaction(messageText);

      if (!analysisResult.transaction || analysisResult.error) {
        await this.sendMessage(
          remoteJid.split('@')[0],
          '❌ Maaf, saya tidak dapat memahami pesan transaksi Anda.\n\n' +
          'Format contoh:\n' +
          '• "Beli makan siang 50rb"\n' +
          '• "Gaji bulanan 5jt"\n' +
          '• "Bayar listrik 200rb dari bank"\n' +
          '• "Beli makan 50rb pakai cash"'
        );
        return;
      }

      // 4. Get JWT token untuk user (dari cache atau generate)
      const jwtToken = await jwtService.getTokenForUser(userMapping.userId);
      
      if (!jwtToken) {
        await this.sendMessage(
          remoteJid.split('@')[0],
          '❌ Error: Tidak dapat mengautentikasi. Silakan login ulang di aplikasi.'
        );
        return;
      }

      // 5. Check if user needs to select wallet
      const walletCheck = await walletSelectionService.checkWalletSelection(
        jwtToken,
        userMapping.userId,
        analysisResult.transaction,
        remoteJid
      );

      if (walletCheck.needsSelection && walletCheck.wallets) {
        // Store pending selection dan tanya user
        walletSelectionService.storePendingSelection(remoteJid, {
          userId: userMapping.userId,
          phoneNumber: remoteJid,
          transactionData: analysisResult.transaction,
          jwtToken,
          timestamp: Date.now(),
        });

        await this.sendMessage(
          remoteJid.split('@')[0],
          walletSelectionService.formatWalletList(walletCheck.wallets)
        );
        return;
      }

      // 6. Create transaction di backend (wallet sudah dipilih atau auto-selected)
      const transactionResult = await transactionService.createTransaction(
        jwtToken,
        analysisResult.transaction,
        userMapping.userId,
        walletCheck.selectedWalletId
      );

      // 7. Send confirmation message
      await this.sendTransactionConfirmation(
        remoteJid.split('@')[0],
        transactionResult,
        analysisResult.transaction
      );
    } catch (error) {
      logger.error('Error handling incoming message:', error);
      // Don't send error message to user to avoid spam
    }
  }

  /**
   * Send transaction confirmation message
   */
  private async sendTransactionConfirmation(
    phoneNumber: string,
    transactionResult: any,
    transaction: any
  ): Promise<void> {
    if (transactionResult.success) {
      const amountFormatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
      }).format(transaction.amount);

      await this.sendMessage(
        phoneNumber,
        `✅ Transaksi berhasil dibuat!\n\n` +
        `📊 Tipe: ${transaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}\n` +
        `💰 Jumlah: ${amountFormatted}\n` +
        `📝 Deskripsi: ${transaction.description}\n` +
        (transaction.category ? `🏷️ Kategori: ${transaction.category}\n` : '') +
        `📅 Tanggal: ${transaction.date || new Date().toLocaleDateString('id-ID')}`
      );
    } else {
      await this.sendMessage(
        phoneNumber,
        `❌ Gagal membuat transaksi: ${transactionResult.error || 'Unknown error'}`
      );
    }
    } catch (error) {
      logger.error('Error handling incoming message:', error);
      // Don't send error message to user to avoid spam
    }
  }
}

export const whatsappService = new WhatsAppService();

