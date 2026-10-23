import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import prisma from './config/prisma.js';

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`[INARO Backend] Server listening on http://${HOST}:${PORT}`);
  console.log(`[INARO Backend] Dump Mode mounted at /dump and /api/v1/dump`);
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`[INARO Backend] Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[INARO Backend] Database disconnected. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
