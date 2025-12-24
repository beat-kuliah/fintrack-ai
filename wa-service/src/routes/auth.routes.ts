import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Generate JWT Token
 * For development/testing purposes - generates a JWT token with userId
 */
router.post('/token', (req: Request, res: Response): void => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'userId is required',
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      message: 'Token generated successfully',
      data: {
        token,
        expiresIn: config.jwt.expiresIn,
        userId,
      },
    });
  } catch (error) {
    logger.error('Error generating token:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Verify JWT Token
 * Check if a token is valid
 */
router.post('/verify', (req: Request, res: Response): void => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'token is required',
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          userId: decoded.userId,
          valid: true,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token is invalid or expired',
        data: {
          valid: false,
        },
      });
    }
  } catch (error) {
    logger.error('Error verifying token:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;







