import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { loggerOptions } from './utils/logger.js';

import hierarchyRoutes from './routes/hierarchy.js';
import libraryRoutes from './routes/library.js';
import announcementRoutes from './routes/announcements.js';
import { initQueue } from './services/queue.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Fastify({
  logger: loggerOptions,
});

// Register Plugins
await server.register(cors);
await server.register(websocket);
await server.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Register Routes
await server.register(hierarchyRoutes, { prefix: '/api/v1' });
await server.register(libraryRoutes, { prefix: '/api/v1' });
await server.register(announcementRoutes, { prefix: '/api/v1' });

// Serve Static Frontend (when built)
const staticPath = path.join(__dirname, '../public');
await server.register(fastifyStatic, {
  root: staticPath,
  prefix: '/',
});

// Health Check
server.get('/health', async (_request, _reply) => {
  return { status: 'ok', version: '1.0.0' };
});

const start = async (): Promise<void> => {
  try {
    const port = parseInt(process.env['PORT'] || '3000', 10);
    await initQueue();
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

void start();
