import { logger } from '../../utils/logger';
import { Pool } from 'pg';
import { config } from '../../config';

// Create database connection pool for backend database
// Note: This connects to the same database as backend to access user_whatsapp_mappings
const pool = new Pool({
  connectionString: process.env.BACKEND_DATABASE_URL || process.env.DATABASE_URL,
  max: 5,
});

export interface UserMappingResult {
  userId: string;
  isVerified: boolean;
  phoneNumber: string;
}

/**
 * Service untuk mapping phone number ke user_id
 * Mencegah kebocoran data antar user dengan memastikan setiap pesan
 * hanya diproses untuk user yang terverifikasi
 */
export class UserMappingService {
  /**
   * Format phone number ke format standar (6281234567890)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let formatted = phoneNumber.replace(/\D/g, '');

    // Remove @s.whatsapp.net if present
    formatted = formatted.replace(/@s\.whatsapp\.net$/, '');

    // If starts with 62, keep it
    if (formatted.startsWith('62')) {
      return formatted;
    }

    // If starts with 0, remove it and add 62
    if (formatted.startsWith('0')) {
      formatted = formatted.substring(1);
    }

    // Add country code if not present
    return `62${formatted}`;
  }

  /**
   * Get user_id dari phone number
   * Returns null jika phone number tidak terdaftar atau tidak terverifikasi
   */
  async getUserByPhoneNumber(phoneNumber: string): Promise<UserMappingResult | null> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Query dari database backend (user_whatsapp_mappings table)
      // Note: Ini perlu akses ke database backend yang sama
      const result = await pool.query(
        `SELECT user_id, phone_number, is_verified
         FROM user_whatsapp_mappings
         WHERE phone_number = $1
         LIMIT 1`,
        [formattedPhone]
      );
      
      const mapping = result.rows;

      if (!mapping || mapping.length === 0) {
        logger.warn(`Phone number not found: ${formattedPhone}`);
        return null;
      }

      const result = mapping[0];

      if (!result.is_verified) {
        logger.warn(`Phone number not verified: ${formattedPhone}`);
        return null;
      }

      return {
        userId: result.user_id,
        isVerified: result.is_verified,
        phoneNumber: result.phone_number,
      };
    } catch (error) {
      logger.error('Error getting user by phone number:', error);
      return null;
    }
  }

  /**
   * Verify phone number dengan verification code
   */
  async verifyPhoneNumber(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      const result = await pool.query(
        `UPDATE user_whatsapp_mappings
         SET is_verified = true,
             verified_at = NOW(),
             verification_code = NULL,
             verification_expires_at = NULL,
             updated_at = NOW()
         WHERE phone_number = $1
           AND verification_code = $2
           AND is_verified = false
           AND verification_expires_at > NOW()`,
        [formattedPhone, code]
      );

      return result > 0;
    } catch (error) {
      logger.error('Error verifying phone number:', error);
      return false;
    }
  }

  /**
   * Create mapping (dipanggil dari backend saat user register phone)
   */
  async createMapping(
    userId: string,
    phoneNumber: string,
    verificationCode: string
  ): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

      await pool.query(
        `INSERT INTO user_whatsapp_mappings (user_id, phone_number, verification_code, verification_expires_at)
         VALUES ($1::uuid, $2, $3, $4)
         ON CONFLICT (phone_number) DO UPDATE
         SET verification_code = $3,
             verification_expires_at = $4,
             updated_at = NOW()`,
        [userId, formattedPhone, verificationCode, expiresAt]
      );

      return true;
    } catch (error) {
      logger.error('Error creating mapping:', error);
      return false;
    }
  }
}

export const userMappingService = new UserMappingService();

