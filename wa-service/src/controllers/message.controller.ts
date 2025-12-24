import { Request, Response } from 'express';
import { messageQueue } from '../services/queue/queue.service';
import { logger } from '../utils/logger';
import { SendMessageRequest, BulkMessageRequest } from '../types';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';

export class MessageController {
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: SendMessageRequest = req.body;

      // Validate required fields
      if (!data.phoneNumber || !data.message) {
        res.status(400).json({
          error: 'phoneNumber and message are required',
        });
        return;
      }

      // Create message record
      const message = await prisma.message.create({
        data: {
          userId: data.userId || req.userId || 'system',
          phoneNumber: data.phoneNumber,
          message: data.message,
          templateId: data.templateId,
          status: 'PENDING',
        },
      });

      // Add to queue
      await messageQueue.add('send-message', {
        id: message.id,
        userId: message.userId,
        phoneNumber: message.phoneNumber,
        message: message.message,
        templateId: message.templateId || undefined,
        retryCount: 0,
      });

      res.status(202).json({
        success: true,
        message: 'Message queued for sending',
        data: {
          id: message.id,
          status: message.status,
        },
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async sendBulkMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: BulkMessageRequest = req.body;

      if (!data.messages || data.messages.length === 0) {
        res.status(400).json({
          error: 'messages array is required and cannot be empty',
        });
        return;
      }

      const results = [];

      for (const msg of data.messages) {
        try {
          const message = await prisma.message.create({
            data: {
              userId: msg.userId || req.userId || 'system',
              phoneNumber: msg.phoneNumber,
              message: msg.message,
              templateId: msg.templateId,
              status: 'PENDING',
            },
          });

          await messageQueue.add('send-message', {
            id: message.id,
            userId: message.userId,
            phoneNumber: message.phoneNumber,
            message: message.message,
            templateId: message.templateId || undefined,
            retryCount: 0,
          });

          results.push({
            phoneNumber: msg.phoneNumber,
            success: true,
            messageId: message.id,
          });
        } catch (error) {
          results.push({
            phoneNumber: msg.phoneNumber,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.status(202).json({
        success: true,
        message: 'Bulk messages queued',
        data: results,
      });
    } catch (error) {
      logger.error('Error sending bulk messages:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getMessageStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const message = await prisma.message.findUnique({
        where: { id },
        include: {
          logs: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });

      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      logger.error('Error getting message status:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const messageController = new MessageController();

