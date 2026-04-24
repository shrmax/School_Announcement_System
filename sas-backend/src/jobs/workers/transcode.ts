import { Job } from 'pg-boss';
import { AudioService } from '../../services/audio.js';
import { db } from '../../db/index.js';
import { audioFiles } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../../utils/logger.js';

const AUDIO_PATH = process.env['AUDIO_PATH'] || './audio';
const LIBRARY_DIR = path.join(AUDIO_PATH, 'library');

export interface TranscodeJob {
  fileId: number;
  inputPath: string;
  outputName: string;
}

export async function transcodeWorker(payload: Job<TranscodeJob> | Job<TranscodeJob>[]): Promise<void> {
  console.log('🚀 TRANSCODE WORKER TRIGGERED!');
  const jobs = Array.isArray(payload) ? payload : [payload];
  for (const job of jobs) {
    const { fileId, inputPath, outputName } = job.data;
    const outputPath = path.join(LIBRARY_DIR, outputName);

    try {
      logger.info(`Processing file ID ${fileId}. Input: ${inputPath}`);
      
      // Update status to processing
      await db.update(audioFiles).set({ status: 'processing' }).where(eq(audioFiles.id, fileId));

      // Check if input exists
      try {
        await fs.access(inputPath);
      } catch (err) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      // 1. Transcode (or just move if already ogg)
      if (path.extname(inputPath).toLowerCase() === '.ogg') {
        logger.info(`File is already .ogg, moving to library...`);
        await fs.rename(inputPath, outputPath);
      } else {
        logger.info(`Transcoding to .ogg...`);
        await AudioService.transcode(inputPath, outputPath);
        // Cleanup tmp after transcode (rename handles it for .ogg)
        await fs.unlink(inputPath).catch(() => {});
      }

      // 2. Get Metadata
      const meta = await AudioService.getMetadata(outputPath);

      // 3. Update DB
      await db.update(audioFiles)
        .set({
          filename: outputName,
          durationSec: meta.durationSec,
          sizeBytes: meta.sizeBytes,
          status: 'ready'
        })
        .where(eq(audioFiles.id, fileId));
      
      logger.info(`File ID ${fileId} is now READY`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Processing failed for file ID ${fileId}: ${msg}`);
      
      // Update DB with failure
      await db.update(audioFiles).set({ status: 'failed' }).where(eq(audioFiles.id, fileId));
      throw error;
    }
  }
}
