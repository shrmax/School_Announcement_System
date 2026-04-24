import { db } from '../db/index.js';
import { schedules, scheduleTargets } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { AnnouncementService } from './announcements.js';
import { AnnouncementType } from './priority.js';
import { logger } from '../utils/logger.js';

export class SchedulerService {
  private static ticker: NodeJS.Timeout | null = null;
  private static lastCheck: number = 0;

  static async start() {
    if (this.ticker) return;

    logger.info('Starting Automated Scheduler Service...');
    
    // Check every 30 seconds
    this.ticker = setInterval(() => this.checkSchedules(), 30000);
    this.checkSchedules(); // Run once immediately
  }

  private static async checkSchedules() {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // "HH:mm"
    const currentDay = now.getDay().toString(); // "0" (Sun) to "6" (Sat)
    
    try {
      // 1. Fetch enabled schedules for today
      const allSchedules = await db.select().from(schedules).where(eq(schedules.enabled, true));
      
      for (const schedule of allSchedules) {
        // Check if today is an active day
        if (!schedule.daysOfWeek.split(',').includes(currentDay)) continue;

        const startTime = schedule.startTime.substring(0, 5);
        
        // Scenario A: Exact Start Time match (to the minute)
        if (startTime === currentTime) {
          // Avoid triggering multiple times in the same minute
          if (this.lastCheck === now.getMinutes()) continue;
          
          logger.info(`Triggering scheduled announcement: ${schedule.name}`);
          await this.triggerSchedule(schedule);
        }
        
        // Scenario B: Interval repeating
        if (schedule.intervalMinutes && schedule.endTime) {
          const endTime = schedule.endTime.substring(0, 5);
          
          if (currentTime > startTime && currentTime <= endTime) {
            // Calculate if we should run now based on interval
            const [startH = 0, startM = 0] = startTime.split(':').map(Number);
            const [nowH = 0, nowM = 0] = currentTime.split(':').map(Number);
            
            const minutesSinceStart = (nowH * 60 + nowM) - (startH * 60 + startM);
            
            if (minutesSinceStart > 0 && minutesSinceStart % schedule.intervalMinutes === 0) {
              if (this.lastCheck === now.getMinutes()) continue;

              logger.info(`Triggering interval announcement: ${schedule.name} (${minutesSinceStart}m since start)`);
              await this.triggerSchedule(schedule);
            }
          }
        }
      }
      
      this.lastCheck = now.getMinutes();
    } catch (error) {
      logger.error(`Scheduler Check Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async triggerSchedule(schedule: any) {
    // 1. Get Audio Filename
    const audio = await db.query.audioFiles.findFirst({
      where: (table, { eq }) => eq(table.id, schedule.audioFileId)
    });

    if (!audio) {
      logger.warn(`Schedule ${schedule.id} skipped: Audio file not found`);
      return;
    }

    // 2. We need to create an announcement record to track this run
    const [newAnnouncement] = await db.insert((await import('../db/schema.js')).announcements).values({
      title: `Scheduled: ${schedule.name}`,
      type: 'bell',
      priority: 3, // Bells are usually priority 3
      audioFileId: schedule.audioFileId,
      status: 'pending',
    }).returning();

    if (!newAnnouncement) {
      logger.error(`Failed to create announcement record for schedule ${schedule.id}`);
      return;
    }

    // 3. Link targets from schedule to announcement
    const targets = await db.select().from(scheduleTargets).where(eq(scheduleTargets.scheduleId, schedule.id));
    if (targets.length > 0) {
      await db.insert((await import('../db/schema.js')).announcementTargets).values(
        targets.map(t => ({
          announcementId: newAnnouncement.id,
          targetType: t.targetType,
          targetId: t.targetId
        }))
      );
    }

    // 4. Fire it off!
    AnnouncementService.startAnnouncement(
      newAnnouncement.id,
      'bell' as AnnouncementType,
      3,
      audio.filename
    ).catch(err => logger.error(`Failed to trigger schedule ${schedule.id}: ${err.message}`));
  }
}
