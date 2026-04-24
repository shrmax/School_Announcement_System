import { db } from '../db/index.js';
import { classrooms, floors, announcementTargets, announcements } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { AudioService } from './audio.js';
import { PriorityEngine, AnnouncementType } from './priority.js';
import path from 'path';
import { logger } from '../utils/logger.js';
import fs from 'fs/promises';

const AUDIO_PATH = path.resolve(process.env['AUDIO_PATH'] || './audio');
const LIBRARY_DIR = path.join(AUDIO_PATH, 'library');

export class AnnouncementService {
  /**
   * Resolves a set of targets to a flat list of IP addresses
   */
  private static async resolveTargetIps(announcementId: number): Promise<string[]> {
    const targets = await db.select().from(announcementTargets).where(eq(announcementTargets.announcementId, announcementId));
    const ipSet = new Set<string>();

    for (const target of targets) {
      if (target.targetType === 'school') {
        // Get all enabled classrooms
        const all = await db.select().from(classrooms).where(eq(classrooms.enabled, true));
        for (const c of all) {
          if (c.ipAddress) ipSet.add(c.ipAddress);
        }
      } else if (target.targetType === 'building' && target.targetId) {
        const buildingFloors = await db.select().from(floors).where(eq(floors.buildingId, target.targetId));
        for (const f of buildingFloors) {
          if (f.multicastAddress) {
            ipSet.add(f.multicastAddress);
          } else {
            const floorClassrooms = await db.select().from(classrooms).where(eq(classrooms.floorId, f.id));
            for (const c of floorClassrooms) {
              if (c.ipAddress && c.enabled) ipSet.add(c.ipAddress);
            }
          }
        }
      } else if (target.targetType === 'floor' && target.targetId) {
        const floor = await db.select().from(floors).where(eq(floors.id, target.targetId));
        const f = floor[0];
        if (f?.multicastAddress) {
          ipSet.add(f.multicastAddress);
        } else {
          const floorClassrooms = await db.select().from(classrooms).where(eq(classrooms.floorId, target.targetId));
          for (const c of floorClassrooms) {
            if (c.ipAddress && c.enabled) ipSet.add(c.ipAddress);
          }
        }
      } else if (target.targetType === 'classroom' && target.targetId) {
        const classroom = await db.select().from(classrooms).where(eq(classrooms.id, target.targetId));
        const c = classroom[0];
        if (c?.ipAddress && c.enabled) {
          ipSet.add(c.ipAddress);
        }
      }
    }

    return Array.from(ipSet);
  }

  /**
   * Starts an announcement if priority allows
   */
  static async startAnnouncement(
    announcementId: number,
    type: AnnouncementType,
    priority: number,
    audioFilename: string
  ): Promise<void> {
    const canProceed = PriorityEngine.requestStream(announcementId, type, priority);
    if (!canProceed) {
      return;
    }

    const ips = await this.resolveTargetIps(announcementId);
    if (ips.length === 0) {
      logger.warn(`No targets resolved for announcement ${announcementId}`);
      return;
    }

    let filePath: string;
    if (audioFilename.startsWith('system/')) {
      const pureFilename = audioFilename.replace('system/', '');
      filePath = path.join(AUDIO_PATH, 'system', pureFilename);
    } else {
      filePath = path.join(LIBRARY_DIR, audioFilename);
    }
    
    try {
      // 1. Update DB Status
      await db.update(announcements)
        .set({ status: 'active', startedAt: new Date() })
        .where(eq(announcements.id, announcementId));

      // 2. Start Streaming with completion handler
      const pid = AudioService.streamToTargets(filePath, ips, async (code) => {
        // Cleanup when finished
        PriorityEngine.clearActiveStream(announcementId);
        
        const finalStatus = code === 0 ? 'completed' : 'failed';
        await db.update(announcements)
          .set({ status: finalStatus, endedAt: new Date() })
          .where(eq(announcements.id, announcementId));
          
        logger.info(`Announcement ${announcementId} finished with status: ${finalStatus}`);
      });
      
      if (pid) {
        // 3. Register in Priority Engine
        PriorityEngine.setActiveStream(announcementId, type, priority, [pid]);
        logger.info(`Announcement ${announcementId} is now LIVE on ${ips.length} targets`);
      } else {
        throw new Error('Failed to start FFmpeg process');
      }
    } catch (error) {
      logger.error(`Failed to start announcement ${announcementId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      await db.update(announcements).set({ status: 'failed' }).where(eq(announcements.id, announcementId));
    }
  }
}
