import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { liveStreamService } from '../services/live.js';
import { logger } from '../utils/logger.js';

export default async function liveRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get('/live', { websocket: true }, (socket, req) => {
    logger.info('New live stream connection established');

    socket.on('message', (message) => {
      try {
        // Handle control messages (JSON) or raw binary data
        if (typeof message === 'string' || Buffer.isBuffer(message)) {
          const data = message.toString();
          if (data.startsWith('{')) {
            const msg = JSON.parse(data);
            if (msg.type === 'start') {
              const { addresses, port } = msg;
              liveStreamService.start(addresses, port);
              socket.send(JSON.stringify({ status: 'started' }));
            } else if (msg.type === 'stop') {
              liveStreamService.stop();
              socket.send(JSON.stringify({ status: 'stopped' }));
            }
          } else {
            // Raw binary audio data
            if (Buffer.isBuffer(message)) {
              liveStreamService.push(message);
            }
          }
        }
      } catch (err) {
        logger.error('Error handling socket message:', err);
      }
    });

    socket.on('close', () => {
      logger.info('Live stream connection closed');
      liveStreamService.stop();
    });

    socket.on('error', (err) => {
      logger.error('Socket error:', err);
      liveStreamService.stop();
    });
  });
}
