import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { audioFiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { boss } from '../services/queue.js';

const AUDIO_PATH = process.env['AUDIO_PATH'] || './audio';
const LIBRARY_DIR = path.join(AUDIO_PATH, 'library');
const TMP_DIR = path.join(AUDIO_PATH, 'tmp');

export const getLibrary = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const result = await db.select().from(audioFiles);
  await reply.send(result);
};

export const uploadAudio = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const data = await request.file();
  if (!data) {
    await reply.status(400).send({ error: 'No file uploaded' });
    return;
  }

  const filename = `${Date.now()}-${data.filename}`;
  const tmpPath = path.join(TMP_DIR, filename);

  // Save to tmp first
  await pipeline(data.file, createWriteStream(tmpPath));

  // Create database record
  const result = await db.insert(audioFiles).values({
    name: data.filename.split('.')[0] || 'Unknown',
    filename: filename,
  }).returning();

  const record = result[0];
  if (!record) throw new Error('Failed to create audio record');

  // Queue transcode job
  await boss.send('announcement.transcode', {
    fileId: record.id,
    inputPath: tmpPath,
    outputName: filename.replace(path.extname(filename), '.ogg')
  });

  await reply.status(202).send(record);
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
