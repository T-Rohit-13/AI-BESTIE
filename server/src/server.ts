import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import prisma from './config/prisma.js';
import {
  PrismaNotificationRepository,
  createPushProviderFromEnv,
  NotificationService,
  NotificationScheduler,
} from './modules/notifications/index.js';

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`[INARO Backend] Server listening on http://${HOST}:${PORT}`);
  console.log(`[INARO Backend] Dump Mode mounted at /dump and /api/v1/dump`);
  console.log(`[INARO Backend] Notifications mounted at /notifications and /api/v1/notifications`);
});

// Initialize background notification scheduler
let scheduler: NotificationScheduler | null = null;
if (process.env.ENABLE_NOTIFICATION_SCHEDULER !== 'false') {
  const intervalMs = Number(process.env.NOTIFICATION_SCHEDULER_INTERVAL_MS) || 3600000; // 1 hour default
  const notifRepo = new PrismaNotificationRepository();
  const pushProvider = createPushProviderFromEnv();
  const notifService = new NotificationService(notifRepo, pushProvider);
  scheduler = new NotificationScheduler(notifService, intervalMs);
  scheduler.start();
}

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`[INARO Backend] Received ${signal}. Gracefully shutting down...`);
  if (scheduler) {
    scheduler.stop();
  }
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[INARO Backend] Database disconnected. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
