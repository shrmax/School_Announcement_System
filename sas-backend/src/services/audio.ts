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

      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg transcode failed with code ${code ?? 'unknown'}`));
      });

      ffmpeg.on('error', (err) => reject(err));
    });
  }

  /**
   * Gets metadata for an audio file using ffprobe
   */
  static async getMetadata(filePath: string): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'error',
        '-show_entries', 'format=duration,size',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        filePath
      ];

      const ffprobe = spawn(this.FFPROBE_PATH, args);
      let output = '';

      ffprobe.stdout.on('data', (data: Buffer) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed with code ${code ?? 'unknown'}`));
          return;
        }

        const lines = output.trim().split('\n');
        const duration = parseFloat(lines[0] || '0');
        const size = parseInt(lines[1] || '0', 10);

        resolve({
          durationSec: Math.ceil(duration),
          sizeBytes: size
        });
      });

      ffprobe.on('error', (err) => reject(err));
    });
  }

  /**
   * Streams a file to a list of IP addresses via RTP Unicast
   */
  static streamUnicast(filePath: string, targets: string[]): number[] {
    const pids: number[] = [];
    
    for (const ip of targets) {
      const args = [
        '-re', // Read at native frame rate
        '-i', filePath,
        '-c:a', 'copy', // No transcoding during stream for low latency
        '-f', 'rtp',
        `rtp://${ip}:5004`
      ];

      const ffmpeg = spawn(this.FFMPEG_PATH, args);
      if (ffmpeg.pid) {
        pids.push(ffmpeg.pid);
        logger.info(`Started RTP stream to ${ip} (PID: ${ffmpeg.pid})`);
      }

      ffmpeg.on('error', (err) => {
        logger.error(`Stream to ${ip} failed: ${err.message}`);
      });
    }

    return pids;
  }
}
