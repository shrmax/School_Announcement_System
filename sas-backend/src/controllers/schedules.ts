import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { schedules, scheduleTargets } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const scheduleSchema = z.object({
  name: z.string().min(1),
  audioFileId: z.number(),
  daysOfWeek: z.string(),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  intervalMinutes: z.number().optional().nullable(),
  enabled: z.boolean().default(true),
  targets: z.array(z.object({
    type: z.enum(['classroom', 'floor', 'building', 'school']),
    id: z.number().optional().nullable()
  }))
});

export const getSchedules = async (_request: FastifyRequest, reply: FastifyReply) => {
  // Since we haven't defined relations yet, let's fetch targets separately if needed 
  // or just return the basic info.
  const result = await db.select().from(schedules);
  return reply.send(result);
};

export const createSchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = scheduleSchema.parse(request.body);

  const [newSchedule] = await db.insert(schedules).values({
    name: data.name,
    audioFileId: data.audioFileId,
    daysOfWeek: data.daysOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    intervalMinutes: data.intervalMinutes,
    enabled: data.enabled,
  }).returning();

  if (!newSchedule) {
    throw new Error('Failed to create schedule record');
  }

  if (data.targets.length > 0) {
    await db.insert(scheduleTargets).values(
      data.targets.map(t => ({
        scheduleId: newSchedule.id,
        targetType: t.type,
        targetId: t.id
      }))
    );
  }

  return reply.status(201).send(newSchedule);
};

export const deleteSchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  await db.delete(schedules).where(eq(schedules.id, parseInt(id)));
  return reply.status(204).send();
};

export const toggleSchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { enabled } = request.body as { enabled: boolean };
  
  await db.update(schedules)
    .set({ enabled })
    .where(eq(schedules.id, parseInt(id)));
    
  return reply.send({ success: true });
};
