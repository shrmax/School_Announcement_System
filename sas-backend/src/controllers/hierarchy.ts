import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { buildings, floors, classrooms } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { buildingSchema, floorSchema, classroomSchema } from '../schemas/hierarchy.js';

export const getBuildings = async (_request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const result = await db.select().from(buildings);
  await reply.send(result);
};

export const createBuilding = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const data = buildingSchema.parse(request.body);
  const result = await db.insert(buildings).values(data).returning();
  await reply.status(201).send(result[0]);
};

export const getFloorsByBuilding = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { id } = request.params as { id: string };
  const result = await db.select().from(floors).where(eq(floors.buildingId, parseInt(id, 10)));
  await reply.send(result);
};

export const createFloor = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const data = floorSchema.parse(request.body);
  const result = await db.insert(floors).values(data).returning();
  await reply.status(201).send(result[0]);
};

export const getClassroomsByFloor = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { id } = request.params as { id: string };
  const result = await db.select().from(classrooms).where(eq(classrooms.floorId, parseInt(id, 10)));
  await reply.send(result);
};

export const createClassroom = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const data = classroomSchema.parse(request.body);
  const result = await db.insert(classrooms).values(data).returning();
  await reply.status(201).send(result[0]);
};

export const toggleClassroom = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { id } = request.params as { id: string };
  const targetId = parseInt(id, 10);
  const current = await db.select().from(classrooms).where(eq(classrooms.id, targetId));
  
  if (current.length === 0 || !current[0]) {
    await reply.status(404).send({ error: 'Classroom not found' });
    return;
  }

  const result = await db.update(classrooms)
    .set({ enabled: !current[0].enabled })
    .where(eq(classrooms.id, targetId))
    .returning();
    
  await reply.send(result[0]);
};
