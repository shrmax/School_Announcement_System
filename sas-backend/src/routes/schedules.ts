import { FastifyInstance } from 'fastify';
import { getSchedules, createSchedule, deleteSchedule, toggleSchedule } from '../controllers/schedules.js';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', getSchedules);
  fastify.post('/', createSchedule);
  fastify.delete('/:id', deleteSchedule);
  fastify.patch('/:id/toggle', toggleSchedule);
}
