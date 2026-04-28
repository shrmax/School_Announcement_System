import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { announcements, announcementTargets, audioFiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { announcementSchema } from '../schemas/announcements.js';
import { AnnouncementService } from '../services/announcements.js';
import { AnnouncementType } from '../services/priority.js';

export const createAnnouncement = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const data = announcementSchema.parse(request.body);

  // 1. Verify audio file exists
  const audio = await db.select().from(audioFiles).where(eq(audioFiles.id, data.audioFileId));
  if (audio.length === 0 || !audio[0]) {
    await reply.status(400).send({ error: 'Audio file not found' });
    return;
  }

  // 2. Create announcement record
  const result = await db.insert(announcements).values({
    title: data.title,
    type: data.type as AnnouncementType,
    priority: data.priority,
    audioFileId: data.audioFileId,
    status: data.scheduledAt ? 'pending' : 'active',
  }).returning();

  const announcement = result[0];
  if (!announcement) throw new Error('Failed to create announcement');

  // 3. Create target records
  const targetValues = data.targets.map(t => ({
    announcementId: announcement.id,
    targetType: t.type,
    targetId: t.id,
  }));
  await db.insert(announcementTargets).values(targetValues);

  // 4. Handle immediate vs scheduled
  if (!data.scheduledAt) {
    // Start immediately in the background
    void AnnouncementService.startAnnouncement(
      announcement.id,
      announcement.type,
      announcement.priority,
      audio[0].filename
    );
  } else {
    // TODO: Implement one-off scheduling in pg-boss
  }

  await reply.status(201).send(announcement);
};

export const getAnnouncementStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { id } = request.params as { id: string };
  const result = await db.select().from(announcements).where(eq(announcements.id, parseInt(id, 10)));
  
  if (result.length === 0 || !result[0]) {
    await reply.status(404).send({ error: 'Announcement not found' });
    return;
  }

  await reply.send(result[0]);
};
