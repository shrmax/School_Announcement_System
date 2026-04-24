import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as announcementController from '../controllers/announcements.js';

export default async function announcementRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.post('/announcements', announcementController.createAnnouncement);
  fastify.get('/announcements/:id', announcementController.getAnnouncementStatus);

  await Promise.resolve();
}
