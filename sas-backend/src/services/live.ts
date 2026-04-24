import { spawn, ChildProcess } from 'child_process';
import { logger } from '../utils/logger.js';

export class LiveStreamService {
  private ffmpegProcess: ChildProcess | null = null;

  start(addresses: string[], port: number = 5004): void {
    if (this.ffmpegProcess) {
      this.stop();
    }

    if (addresses.length === 0) return;

    // Use FFmpeg 'tee' pseudo-muxer to send to multiple targets
    // Added rtcp=0 to avoid local port conflicts on the server
    // Handles addresses that might already include a port (e.g., "239.1.1.1:5004")
    const targets = addresses
      .map(addr => {
        const finalTarget = addr.includes(':') ? addr : `${addr}:${port}`;
        return `[f=rtp]rtp://${finalTarget}?ttl=16&pkt_size=1316&payload_type=10&rtcp=0&buffer_size=65536`;
      })
      .join('|');
    
    logger.info(`Starting live broadcast to ${addresses.length} targets. Full targets string: ${targets}`);

    const args = [
      '-f', 'webm',               // Input format
      '-i', 'pipe:0',             // Input from stdin
      '-map', '0:a',              // Explicitly map audio stream
      '-acodec', 'pcm_s16be',     // Convert to 16-bit PCM
      '-ar', '44100',             // 44.1kHz
      '-ac', '1',                 // Mono
      '-f', 'tee',                // Output format TEE
      targets                     // Pass the targets string as a single argument
    ];

    logger.info(`FFmpeg Command: ffmpeg ${args.join(' ')}`);

    this.ffmpegProcess = spawn('ffmpeg', args);

    this.ffmpegProcess.stderr?.on('data', (data) => {
      logger.error(`FFmpeg Error: ${data.toString()}`);
    });

    this.ffmpegProcess.on('close', (code) => {
      logger.info(`FFmpeg process closed with code ${code}`);
      this.ffmpegProcess = null;
    });

    this.ffmpegProcess.on('error', (err) => {
      logger.error(`FFmpeg error: ${err.message}`);
    });
  }

  push(chunk: Buffer): void {
    if (this.ffmpegProcess && this.ffmpegProcess.stdin) {
      this.ffmpegProcess.stdin.write(chunk);
    }
  }

  stop(): void {
    if (this.ffmpegProcess) {
      logger.info('Stopping live broadcast');
      this.ffmpegProcess.stdin?.end();
      this.ffmpegProcess.kill('SIGTERM');
      this.ffmpegProcess = null;
    }
  }
}

export const liveStreamService = new LiveStreamService();
