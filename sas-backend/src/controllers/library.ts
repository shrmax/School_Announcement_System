import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { audioFiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

import { AudioService } from '../services/audio.js';

const AUDIO_PATH = path.resolve(process.env['AUDIO_PATH'] || './audio');
const LIBRARY_DIR = path.join(AUDIO_PATH, 'library');

export const getLibrary = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const dbFiles = await db.select().from(audioFiles);
  
  // Define system sounds
  const systemSounds = [
    {
      id: -1, // Special ID for system sounds
      name: 'System Bell',
      description: 'Standard school bell tone',
      filename: 'system/bell.ogg',
      durationSec: 3,
      sizeBytes: 11506,
      status: 'ready',
      createdAt: new Date().toISOString()
    }
  ];

  await reply.send([...systemSounds, ...dbFiles]);
};

export const uploadAudio = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const data = await request.file();
  if (!data) {
    await reply.status(400).send({ error: 'No file uploaded' });
    return;
  }

  // Ensure library directory exists
  await fs.mkdir(LIBRARY_DIR, { recursive: true });

  const filename = `${Date.now()}-${data.filename}`;
  const filePath = path.join(LIBRARY_DIR, filename);

  // 1. Save directly to library
  await pipeline(data.file, createWriteStream(filePath));

  try {
    // 2. Get Metadata immediately
    const meta = await AudioService.getMetadata(filePath);

    // 3. Create database record as 'ready'
    const result = await db.insert(audioFiles).values({
      name: data.filename.split('.')[0] || 'Unknown',
      filename: filename,
      durationSec: meta.durationSec,
      sizeBytes: meta.sizeBytes,
      status: 'ready'
    }).returning();

    await reply.status(201).send(result[0]);
  } catch (err) {
    request.log.error(err, 'Failed to process uploaded audio');
    // Cleanup file if DB/Metadata fails
    await fs.unlink(filePath).catch(() => {});
    await reply.status(500).send({ error: 'Failed to process audio file. Ensure it is a valid audio format.' });
  }
};

export const deleteAudio = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { id } = request.params as { id: string };
  const fileId = parseInt(id, 10);

  const record = await db.select().from(audioFiles).where(eq(audioFiles.id, fileId));
  if (record.length === 0 || !record[0]) {
    await reply.status(404).send({ error: 'File not found' });
    return;
  }

  // Delete from disk
  const filePath = path.join(LIBRARY_DIR, record[0].filename);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    logger_warn(request, `Could not delete file from disk: ${filePath} - ${err instanceof Error ? err.message : 'Unknown'}`);
  }

  // Delete from DB
  await db.delete(audioFiles).where(eq(audioFiles.id, fileId));

  await reply.status(204).send();
};

function logger_warn(request: FastifyRequest, message: string): void {
  request.log.warn(message);
}
