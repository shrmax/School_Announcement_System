import PgBoss from 'pg-boss';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger.js';
import { transcodeWorker } from '../jobs/workers/transcode.js';

dotenv.config();

if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL is required for pg-boss');
}

export const boss = new PgBoss({
  connectionString: process.env['DATABASE_URL'],
  retryLimit: 3,
  retryDelay: 30,
  expireInHours: 12,
});

boss.on('error', (error: Error) => logger.error(error));
boss.on('monitor-states', (states) => {
  if (states.queues['announcement.transcode']) {
    const q = states.queues['announcement.transcode'];
    logger.info(`Queue Status: Created: ${q.created}, Active: ${q.active}, Failed: ${q.failed}, Completed: ${q.completed}`);
  }
});

export async function initQueue(): Promise<void> {
  // Ensure audio directories exist
  const AUDIO_PATH = process.env['AUDIO_PATH'] || './audio';
  const dirs = [
    path.join(AUDIO_PATH, 'library'),
    path.join(AUDIO_PATH, 'tmp')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      logger.error(`Failed to create directory ${dir}: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  await boss.start();
  // We explicitly type the work call and set batchSize to 1
  await boss.work('announcement.transcode', { batchSize: 1 }, transcodeWorker);
  logger.info('pg-boss queue started with workers');
}
