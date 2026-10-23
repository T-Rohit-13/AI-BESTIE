import express, { Express } from 'express';
import cors from 'cors';
import { createDumpRouter } from './modules/dump/dump.routes.js';
import { DumpController } from './modules/dump/dump.controller.js';
import { DumpService } from './modules/dump/dump.service.js';
import { IDumpRepository, PrismaDumpRepository } from './modules/dump/dump.repository.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(repository?: IDumpRepository): Express {
  const app = express();

  // Basic security and parsing
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // Dump module instantiation
  const dumpRepo = repository || new PrismaDumpRepository();
  const dumpService = new DumpService(dumpRepo);
  const dumpController = new DumpController(dumpService);
  const dumpRouter = createDumpRouter(dumpController);

  // Mount at both root /dump and standard API prefix /api/v1/dump
  app.use('/dump', dumpRouter);
  app.use('/api/v1/dump', dumpRouter);

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
