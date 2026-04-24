import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { buildings, floors, classrooms, audioFiles, announcements } from '../db/schema.js';
import { count, desc } from 'drizzle-orm';

export const getSystemStats = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const [bCount] = await db.select({ value: count() }).from(buildings);
  const [fCount] = await db.select({ value: count() }).from(floors);
  const [cCount] = await db.select({ value: count() }).from(classrooms);
  const [aFileCount] = await db.select({ value: count() }).from(audioFiles);
  
  const recent = await db.select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .limit(5);

  const stats = {
    buildings: bCount?.value || 0,
    floors: fCount?.value || 0,
    classrooms: {
      total: cCount?.value || 0,
      online: Math.floor((cCount?.value || 0) * 0.95), // Mocking online for now
      enabled: cCount?.value || 0,
    },
    audioFiles: aFileCount?.value || 0,
    recentAnnouncements: recent,
  };

  await reply.send(stats);
};
