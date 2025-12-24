import { config } from '../../config';
import { logger } from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Service untuk manage JWT tokens
 * Cache tokens per user untuk menghindari multiple requests ke backend
 */
export class JWTService {
  private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();
  private cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours

  /**
   * Get JWT token untuk user
   * Jika token ada di cache dan masih valid, return dari cache
   * Jika tidak, perlu generate service token atau request dari backend
   * 
   * Note: Untuk production, mungkin perlu service account atau
   * cara lain untuk generate token tanpa user login
   */
  async getTokenForUser(userId: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.tokenCache.get(userId);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.token;
      }

      // For now, we need a way to generate tokens
      // Option 1: Use service account (if implemented)
      // Option 2: Store user tokens when they login (via webhook from backend)
      // Option 3: Generate token with same secret (not recommended for production)

      // TODO: Implement proper token generation
      // For development, we can generate a token with long expiry
      // In production, this should be handled differently
      
      logger.warn(`Token not found in cache for user ${userId}. Need to implement token generation.`);
      
      // For now, return null - this needs to be implemented based on your architecture
      // You might want to:
      // 1. Store tokens when users login (webhook from backend)
      // 2. Use service account to generate tokens
      // 3. Request token from backend using service-to-service auth
      
      return null;
    } catch (error) {
      logger.error('Error getting token for user:', error);
      return null;
    }
  }

  /**
   * Store token in cache
   */
  storeToken(userId: string, token: string): void {
    try {
      // Decode token to get expiry
      const decoded = jwt.decode(token) as { exp?: number };
      const expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + this.cacheExpiry;

      this.tokenCache.set(userId, {
        token,
        expiresAt,
      });
    } catch (error) {
      logger.error('Error storing token:', error);
    }
  }

  /**
   * Clear token cache for user
   */
  clearToken(userId: string): void {
    this.tokenCache.delete(userId);
  }

  /**
   * Clear all cached tokens
   */
  clearAllTokens(): void {
    this.tokenCache.clear();
  }
}

export const jwtService = new JWTService();

