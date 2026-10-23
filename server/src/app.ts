import express, { Express } from 'express';
import cors from 'cors';
import { createDumpRouter } from './modules/dump/dump.routes.js';
import { DumpController } from './modules/dump/dump.controller.js';
import { DumpService } from './modules/dump/dump.service.js';
import { IDumpRepository, PrismaDumpRepository, InMemoryDumpRepository } from './modules/dump/dump.repository.js';
import {
  INotificationRepository,
  PrismaNotificationRepository,
  InMemoryNotificationRepository,
  IPushNotificationProvider,
  createPushProviderFromEnv,
  MockPushProvider,
  NotificationService,
  NotificationController,
  createNotificationRouter,
} from './modules/notifications/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export interface AppDependencies {
  dumpRepository?: IDumpRepository;
  notificationRepository?: INotificationRepository;
  pushProvider?: IPushNotificationProvider;
  notificationService?: NotificationService;
}

export function createApp(deps?: AppDependencies | IDumpRepository): Express {
  const app = express();

  // Basic security and parsing
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // Resolve dependencies
  let resolvedDeps: AppDependencies;
  if (!deps) {
    resolvedDeps = {};
  } else if ('createEntry' in deps) {
    resolvedDeps = { dumpRepository: deps as IDumpRepository };
  } else {
    resolvedDeps = deps as AppDependencies;
  }

  // 1. Dump module instantiation
  const dumpRepo =
    resolvedDeps.dumpRepository ||
    (process.env.NODE_ENV === 'test' ? new InMemoryDumpRepository() : new PrismaDumpRepository());
  const dumpService = new DumpService(dumpRepo);
  const dumpController = new DumpController(dumpService);
  const dumpRouter = createDumpRouter(dumpController);

  app.use('/dump', dumpRouter);
  app.use('/api/v1/dump', dumpRouter);

  // 2. Notification module instantiation
  const notifRepo =
    resolvedDeps.notificationRepository ||
    (process.env.NODE_ENV === 'test' ? new InMemoryNotificationRepository() : new PrismaNotificationRepository());
  const pushProvider =
    resolvedDeps.pushProvider ||
    (process.env.NODE_ENV === 'test' ? new MockPushProvider() : createPushProviderFromEnv());

  const notifService =
    resolvedDeps.notificationService ||
    new NotificationService(notifRepo, pushProvider);

  const notifController = new NotificationController(notifService);
  const notifRouter = createNotificationRouter(notifController);

  app.use('/notifications', notifRouter);
  app.use('/api/v1/notifications', notifRouter);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'inaro-core-backend' });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
