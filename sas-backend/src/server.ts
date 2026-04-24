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
import liveRoutes from './routes/live.js';
import scheduleRoutes from './routes/schedules.js';
import { initQueue } from './services/queue.js';
import * as statsController from './controllers/stats.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Fastify({
  logger: loggerOptions,
});

// Register Plugins
await server.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
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
await server.register(liveRoutes, { prefix: '/api/v1' });
await server.register(scheduleRoutes, { prefix: '/api/v1/schedules' });

// Serve Static Frontend (when built)
const staticPath = path.join(__dirname, '../public');
await server.register(fastifyStatic, {
  root: staticPath,
  prefix: '/',
});

// Serve Audio Files
const audioPath = path.resolve(process.env['AUDIO_PATH'] || './audio');
await server.register(fastifyStatic, {
  root: audioPath,
  prefix: '/audio/',
  decorateReply: false,
});

// Health Check
server.get('/health', async (_request, _reply) => {
  return { status: 'ok', version: '1.0.0' };
});

// Global Error Handler
server.setErrorHandler((error, _request, reply) => {
  server.log.error(error);
  
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = undefined;

  if (error instanceof Error) {
    message = error.message;
    if ('statusCode' in error) {
      statusCode = (error as { statusCode: number }).statusCode;
    }
    
    if (error.name === 'ZodError') {
      statusCode = 400;
      message = 'Validation Error';
      details = (error as unknown as { errors: unknown }).errors;
    }
  }

  reply.status(statusCode).send({
    error: message,
    details,
  });
});

server.get('/api/v1/stats', statsController.getSystemStats);

const start = async (): Promise<void> => {
  try {
    const port = parseInt(process.env['PORT'] || '3000', 10);
    await initQueue();
    
    // Start Automated Scheduler
    const { SchedulerService } = await import('./services/scheduler.js');
    SchedulerService.start();

    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

void start();
