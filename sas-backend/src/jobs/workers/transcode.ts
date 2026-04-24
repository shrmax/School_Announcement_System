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

export async function transcodeWorker(jobs: Job<TranscodeJob>[]): Promise<void> {
  for (const job of jobs) {
    const { fileId, inputPath, outputName } = job.data;
    const outputPath = path.join(LIBRARY_DIR, outputName);

    try {
      logger.info(`Starting transcode for file ID ${fileId}`);
      
      // 1. Transcode
      await AudioService.transcode(inputPath, outputPath);

      // 2. Get Metadata
      const meta = await AudioService.getMetadata(outputPath);

      // 3. Update DB
      await db.update(audioFiles)
        .set({
          filename: outputName,
          durationSec: meta.durationSec,
          sizeBytes: meta.sizeBytes,
        })
        .where(eq(audioFiles.id, fileId));

      // 4. Cleanup tmp
      await fs.unlink(inputPath);
      
      logger.info(`Transcode complete for file ID ${fileId}`);
    } catch (error) {
      logger.error(`Transcode failed for file ID ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Rethrow so pg-boss can retry
    }
  }
}
