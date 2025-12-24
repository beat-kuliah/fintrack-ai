import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { MessageJob } from '../../types';
import { prisma } from '../../utils/prisma';

// Redis connection
// BullMQ requires maxRetriesPerRequest to be null
const redisOptions: any = {
  host: config.redis.host,
  port: config.redis.port,
  db: config.redis.db,
  maxRetriesPerRequest: null, // Required by BullMQ
};

// Only add password if it's provided and not empty
if (config.redis.password && config.redis.password.trim() !== '') {
  redisOptions.password = config.redis.password;
}

const redisConnection = new Redis(redisOptions);

// Message queue
export const messageQueue = new Queue<MessageJob>('message-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000,
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

// Worker to process messages
export const messageWorker = new Worker<MessageJob>(
  'message-queue',
  async (job: Job<MessageJob>) => {
    const { phoneNumber, message, id } = job.data;

    logger.info(`Processing message job ${job.id} for ${phoneNumber}`);

    try {
      // Update message status to QUEUED
      await prisma.message.update({
        where: { id },
        data: { status: 'QUEUED' },
      });

      // Send message via WhatsApp
      const success = await whatsappService.sendMessage(phoneNumber, message);

      if (success) {
        // Update message status to SENT
        await prisma.message.update({
          where: { id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        // Log success
        await prisma.messageLog.create({
          data: {
            messageId: id,
            status: 'SENT',
            metadata: {
              jobId: job.id,
              processedAt: new Date().toISOString(),
            },
          },
        });

        logger.info(`Message ${id} sent successfully`);
        return { success: true };
      }

      throw new Error('Failed to send message');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error(`Failed to process message job ${job.id}:`, error);

      // Update message status to FAILED
      await prisma.message.update({
        where: { id },
        data: {
          status: 'FAILED',
          errorMessage,
          retryCount: job.attemptsMade,
        },
      });

      // Log failure
      await prisma.messageLog.create({
        data: {
          messageId: id,
          status: 'FAILED',
          errorMessage,
          retryCount: job.attemptsMade,
          metadata: {
            jobId: job.id,
            error: errorMessage,
            processedAt: new Date().toISOString(),
          },
        },
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process 5 messages concurrently
    limiter: {
      max: config.rateLimit.perMinute,
      duration: 60000, // Per minute
    },
  }
);

// Event handlers
messageWorker.on('completed', (job) => {
  logger.info(`Message job ${job.id} completed`);
});

messageWorker.on('failed', (job, err) => {
  logger.error(`Message job ${job?.id} failed:`, err);
});

let lastErrorLogged = '';
let errorLogCount = 0;
const ERROR_LOG_INTERVAL = 10; // Log every 10th occurrence to prevent spam

messageWorker.on('error', (err) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  
  // Prevent spam - only log unique errors or every Nth occurrence
  if (errorMessage !== lastErrorLogged || errorLogCount % ERROR_LOG_INTERVAL === 0) {
    if (errorMessage.includes('NOAUTH')) {
      logger.error('Redis authentication error. Please check REDIS_PASSWORD in .env file.');
      logger.error('If Redis requires password, set REDIS_PASSWORD in .env file.');
      logger.error('If Redis does not require password, make sure Redis is configured without password requirement.');
    } else if (errorMessage.includes('MISCONF') || errorMessage.includes('save')) {
      logger.error('Redis disk error detected. Redis cannot save to disk.');
      logger.error('Solution: Run "redis-cli CONFIG SET stop-writes-on-bgsave-error no"');
      logger.error('Or fix the disk permission issue for Redis data directory.');
    } else {
      logger.error('Message worker error:', {
        message: errorMessage,
        name: err instanceof Error ? err.name : 'Unknown',
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
    lastErrorLogged = errorMessage;
    if (errorLogCount % ERROR_LOG_INTERVAL === 0) {
      errorLogCount = 0;
    }
  }
  errorLogCount++;
});

// Handle Redis connection errors
let redisErrorLogged = false;
redisConnection.on('error', (err) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  
  // Only log Redis errors once to prevent spam
  if (!redisErrorLogged || errorMessage.includes('NOAUTH')) {
    if (errorMessage.includes('NOAUTH')) {
      logger.error('Redis authentication failed. Please check REDIS_PASSWORD in .env file.');
      logger.error('Current REDIS_PASSWORD setting:', config.redis.password ? 'SET (but may be incorrect)' : 'NOT SET');
    } else {
      logger.error('Redis connection error:', {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
    redisErrorLogged = true;
  }
});

// Graceful shutdown
export async function closeQueue(): Promise<void> {
  await messageWorker.close();
  await messageQueue.close();
  await redisConnection.quit();
}

