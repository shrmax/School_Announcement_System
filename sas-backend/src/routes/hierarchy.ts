import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import * as hierarchyController from '../controllers/hierarchy.js';

export default async function hierarchyRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get('/buildings', hierarchyController.getBuildings);
  fastify.post('/buildings', hierarchyController.createBuilding);
  fastify.put('/buildings/:id', hierarchyController.updateBuilding);
  fastify.delete('/buildings/:id', hierarchyController.deleteBuilding);
  
  fastify.get('/buildings/:id/floors', hierarchyController.getFloorsByBuilding);
  fastify.post('/floors', hierarchyController.createFloor);
  fastify.put('/floors/:id', hierarchyController.updateFloor);
  fastify.delete('/floors/:id', hierarchyController.deleteFloor);

  fastify.get('/floors/:id/classrooms', hierarchyController.getClassroomsByFloor);
  fastify.post('/classrooms', hierarchyController.createClassroom);
  fastify.put('/classrooms/:id', hierarchyController.updateClassroom);
  fastify.delete('/classrooms/:id', hierarchyController.deleteClassroom);
  
  fastify.patch('/classrooms/:id/toggle', hierarchyController.toggleClassroom);

  await Promise.resolve();
}
