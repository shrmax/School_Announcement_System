import { spawn } from 'child_process';
import { logger } from '../utils/logger.js';

interface AudioMetadata {
  durationSec: number;
  sizeBytes: number;
}

export class AudioService {
  private static readonly FFMPEG_PATH = 'ffmpeg';
  private static readonly FFPROBE_PATH = 'ffprobe';

  /**
   * Transcodes an uploaded file to Opus .ogg
   */
  static async transcode(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', inputPath,
        '-c:a', 'libopus',
        '-b:a', '64k',
        '-vbr', 'on',
        '-compression_level', '10',
        '-y', // Overwrite
        outputPath
      ];

      const ffmpeg = spawn(this.FFMPEG_PATH, args);
      let errorMsg = '';

      // Kill if it takes too long (30 seconds)
      const timeout = setTimeout(() => {
        ffmpeg.kill();
        reject(new Error('ffmpeg transcode timed out after 30s'));
      }, 30000);

      ffmpeg.stderr.on('data', (data) => {
        errorMsg += data.toString();
      });

      ffmpeg.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else {
          logger.error(`FFmpeg Transcode Error Output: ${errorMsg}`);
          reject(new Error(`ffmpeg transcode failed with code ${code ?? 'unknown'}`));
        }
      });

      ffmpeg.on('error', (err) => reject(err));
    });
  }

  /**
   * Gets metadata for an audio file using ffprobe
   */
  static async getMetadata(filePath: string): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      logger.info(`Running ffprobe on ${filePath}`);
      const args = [
        '-v', 'error',
        '-show_entries', 'format=duration,size',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
      ];

      const ffprobe = spawn(this.FFPROBE_PATH, args);
      let output = '';
      let errorMsg = '';

      ffprobe.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data: Buffer) => {
        errorMsg += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          logger.error(`ffprobe failed for ${filePath}. Error: ${errorMsg}`);
          reject(new Error(`ffprobe failed with code ${code ?? 'unknown'}`));
          return;
        }

        const lines = output.trim().split('\n');
        const duration = parseFloat(lines[0] || '0');
        const size = parseInt(lines[1] || '0', 10);

        logger.info(`ffprobe success: duration=${duration}s, size=${size} bytes`);
        resolve({
          durationSec: Math.ceil(duration),
          sizeBytes: size
        });
      });

      ffprobe.on('error', (err) => {
        logger.error(`ffprobe process error: ${err.message}`);
        reject(err);
      });
    });
  }

  /**
   * Streams a file to a list of IP addresses via RTP Unicast
   */
  /**
   * Streams a file to multiple IP addresses using a single FFmpeg process with tee muxer
   */
  static streamToTargets(
    filePath: string, 
    targets: string[], 
    onComplete?: (code: number | null) => void
  ): number | null {
    if (targets.length === 0) return null;

    const rtpOutputs = targets.map(addr => {
      const finalTarget = addr.includes(':') ? addr : `${addr}:5004`;
      return `[f=rtp]rtp://${finalTarget}?ttl=16&pkt_size=1316&payload_type=10&rtcp=0&buffer_size=65536`;
    }).join('|');

    const args = [
      '-re',                     // Read at native frame rate
      '-i', filePath,            // Input file
      '-map', '0:a',             // Explicitly map audio stream
      '-acodec', 'pcm_s16be',    // Transcode for hardware compatibility
      '-ar', '44100',
      '-ac', '1',
      '-f', 'tee',               // Use tee pseudo-muxer
      rtpOutputs                 // Multiple destinations
    ];

    const ffmpeg = spawn(this.FFMPEG_PATH, args);
    let errorMsg = '';

    if (ffmpeg.pid) {
      logger.info(`Started multi-target RTP stream (PID: ${ffmpeg.pid}) to ${targets.length} targets. Command: ${this.FFMPEG_PATH} ${args.join(' ')}`);
      
      ffmpeg.stderr.on('data', (data) => {
        errorMsg += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          logger.error(`RTP stream (PID: ${ffmpeg.pid}) failed with code ${code}. Error: ${errorMsg}`);
        } else {
          logger.info(`RTP stream (PID: ${ffmpeg.pid}) finished successfully`);
        }
        if (onComplete) onComplete(code);
      });

      ffmpeg.on('error', (err) => {
        logger.error(`RTP stream (PID: ${ffmpeg.pid}) process error: ${err.message}`);
      });

      return ffmpeg.pid;
    }

    return null;
  }
}
