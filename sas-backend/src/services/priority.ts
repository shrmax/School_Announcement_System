import { logger } from '../utils/logger.js';

export type AnnouncementType = 'live' | 'prerecorded' | 'emergency' | 'bell';

interface ActiveStream {
  announcementId: number;
  type: AnnouncementType;
  priority: number;
  pids: number[];
  startedAt: Date;
}

export class PriorityEngine {
  private static activeStream: ActiveStream | null = null;

  static getActiveStream(): ActiveStream | null {
    return this.activeStream;
  }

  /**
   * Evaluates if a new announcement can interrupt the current one
   * @returns true if allowed to proceed, false if it should be queued/rejected
   */
  static requestStream(
    announcementId: number,
    type: AnnouncementType,
    priority: number
  ): boolean {
    if (!this.activeStream) {
      return true;
    }

    // Emergency always interrupts everything except another emergency of same/higher priority
    if (type === 'emergency' && this.activeStream.type !== 'emergency') {
      this.interruptCurrent();
      return true;
    }

    // Higher priority interrupts lower
    if (priority > this.activeStream.priority) {
      this.interruptCurrent();
      return true;
    }

    logger.info(`Announcement ${announcementId} rejected: lower priority (${priority}) than active (${this.activeStream.priority})`);
    return false;
  }

  static setActiveStream(
    announcementId: number,
    type: AnnouncementType,
    priority: number,
    pids: number[]
  ): void {
    this.activeStream = {
      announcementId,
      type,
      priority,
      pids,
      startedAt: new Date(),
    };
  }

  static clearActiveStream(announcementId: number): void {
    if (this.activeStream?.announcementId === announcementId) {
      this.activeStream = null;
    }
  }

  private static interruptCurrent(): void {
    if (!this.activeStream) return;

    logger.info(`Interrupting announcement ${this.activeStream.announcementId} (PIDs: ${this.activeStream.pids.join(', ')})`);
    
    for (const pid of this.activeStream.pids) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch (err) {
        logger.error(`Failed to kill process: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    this.activeStream = null;
  }
}
