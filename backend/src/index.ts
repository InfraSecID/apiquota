import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { PollerService } from './services/poller.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 APIQuota backend server started on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`🔒 AES-256-GCM Hardware/Software Cryptographic Engine initialized`);
  logger.info(`🛡️  Helmet CSP & Rate Limiting protection active`);

  // Initialize automated cron poller
  PollerService.initCron();
});

// Graceful Shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connections closed.');
    process.exit(0);
  });

  // Force exit after 10s if dangling connections persist
  setTimeout(() => {
    logger.error('Forceful shutdown triggered after 10s timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
