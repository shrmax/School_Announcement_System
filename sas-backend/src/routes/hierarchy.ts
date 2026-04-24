import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as hierarchyController from '../controllers/hierarchy.js';

export default async function hierarchyRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get('/buildings', hierarchyController.getBuildings);
  fastify.post('/buildings', hierarchyController.createBuilding);
  
  fastify.get('/buildings/:id/floors', hierarchyController.getFloorsByBuilding);
  fastify.post('/floors', hierarchyController.createFloor);

  fastify.get('/floors/:id/classrooms', hierarchyController.getClassroomsByFloor);
  fastify.post('/classrooms', hierarchyController.createClassroom);
  
  fastify.patch('/classrooms/:id/toggle', hierarchyController.toggleClassroom);

  await Promise.resolve();
}
