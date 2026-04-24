import { z } from 'zod';

export const buildingSchema = z.object({
  name: z.string().min(1).max(100),
});

export const floorSchema = z.object({
  buildingId: z.number().int(),
  name: z.string().min(1).max(100),
  multicastAddress: z.string().min(1).max(45),
});

export const classroomSchema = z.object({
  floorId: z.number().int(),
  name: z.string().min(1).max(100),
  ipAddress: z.string().max(45).optional(),
  port: z.number().int().optional(),
});
