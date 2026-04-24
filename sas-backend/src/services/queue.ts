import PgBoss from 'pg-boss';
import dotenv from 'dotenv';
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

export async function initQueue(): Promise<void> {
  await boss.start();
  // We explicitly type the work call and set batchSize to 1
  await boss.work('announcement.transcode', { batchSize: 1 }, transcodeWorker);
  logger.info('pg-boss queue started with workers');
}
