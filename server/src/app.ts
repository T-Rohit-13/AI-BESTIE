import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createDumpRouter } from './modules/dump/dump.routes';
import { DumpController } from './modules/dump/dump.controller';
import { DumpService } from './modules/dump/dump.service';
import { safetyRouter } from './modules/safety/safety.routes';

dotenv.config();

export function createApp(dumpService?: DumpService): Application {
  const app: Application = express();

  // Basic middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json({ limit: '1mb' }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'INARO Backend' });
  });

  // Mount Dump Mode routes at both /dump and /api/v1/dump
  const dumpController = new DumpController(dumpService);
  const dumpRouter = createDumpRouter(dumpController);

  app.use('/dump', dumpRouter);
  app.use('/api/v1/dump', dumpRouter);

  // Mount Safety & Crisis Alert routes
  app.use('/safety', safetyRouter);
  app.use('/api/v1/safety', safetyRouter);

  // 404 handler for unknown routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Central error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    // Never expose stack trace, SQL errors, or encryption details in production
    res.status(status).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}

export const app = createApp();
