import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { whatsappService } from './services/whatsapp/whatsapp.service';
import { closeQueue, messageWorker } from './services/queue/queue.service';

// Create Express app
const app = createApp();

// Start server
async function start() {
  try {
    // Initialize WhatsApp service
    logger.info('Initializing WhatsApp service...');
    await whatsappService.initialize();

    // Message worker is automatically initialized when queue.service is imported
    logger.info('Message queue worker initialized');

    // Start HTTP server
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info(
        `🚀 WhatsApp Service running on http://${config.server.host}:${config.server.port}`
      );
      logger.info(`Environment: ${config.server.nodeEnv}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await whatsappService.close();
          await closeQueue();
          logger.info('All services closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

