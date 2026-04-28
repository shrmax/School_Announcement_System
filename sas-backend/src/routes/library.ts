import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as libraryController from '../controllers/library.js';

export default async function libraryRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get('/library', libraryController.getLibrary);
  fastify.post('/library/upload', libraryController.uploadAudio);
  fastify.delete('/library/:id', libraryController.deleteAudio);

  await Promise.resolve();
}
