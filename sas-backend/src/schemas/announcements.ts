import { z } from 'zod';

export const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['prerecorded', 'emergency', 'bell'] as const),
  priority: z.number().int().min(1).max(5),
  audioFileId: z.number().int(),
  targets: z.array(z.object({
    type: z.enum(['classroom', 'floor', 'building', 'school'] as const),
    id: z.number().int().optional(),
  })).min(1),
  scheduledAt: z.string().optional(), // ISO date string for one-off
});
