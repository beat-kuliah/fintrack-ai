import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token from backend (same JWT_SECRET)
 * Backend JWT structure: { sub: user_id (UUID), email: string, exp: number, iat: number }
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Verify token using same JWT_SECRET as backend
    // Backend JWT has structure: { sub: user_id, email: string, exp: number, iat: number }
    const decoded = jwt.verify(token, config.jwt.secret) as { 
      sub: string;      // user_id (UUID from backend)
      email: string;
      exp: number;
      iat: number;
    };

    // Extract user_id from 'sub' field (standard JWT claim for subject/user_id)
    req.userId = decoded.sub;
    req.userEmail = decoded.email;
    
    logger.debug(`Authenticated user: ${decoded.sub} (${decoded.email})`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

/**
 * API Key Authentication Middleware
 */
export const authenticateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey || apiKey !== config.apiKey.key) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }
};

