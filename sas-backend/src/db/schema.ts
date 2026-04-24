import { pgTable, serial, varchar, integer, timestamp, boolean, text, date, pgEnum } from 'drizzle-orm/pg-core';

export const announcementTypeEnum = pgEnum('announcement_type', ['live', 'prerecorded', 'emergency', 'bell']);
export const announcementStatusEnum = pgEnum('announcement_status', ['pending', 'active', 'completed', 'failed', 'interrupted', 'cancelled', 'skipped']);
export const targetTypeEnum = pgEnum('target_type', ['classroom', 'floor', 'building', 'school']);

export const buildings = pgTable('buildings', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const floors = pgTable('floors', {
  id: serial('id').primaryKey(),
  buildingId: integer('building_id').references(() => buildings.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  multicastAddress: varchar('multicast_address', { length: 45 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const classrooms = pgTable('classrooms', {
  id: serial('id').primaryKey(),
  floorId: integer('floor_id').references(() => floors.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  port: integer('port').default(5004),
  enabled: boolean('enabled').default(true),
  lastSeen: timestamp('last_seen'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const audioFiles = pgTable('audio_files', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  filename: varchar('filename', { length: 200 }).notNull(),
  durationSec: integer('duration_sec'),
  sizeBytes: integer('size_bytes'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }),
  type: announcementTypeEnum('type').notNull(),
  priority: integer('priority').notNull(),
  status: announcementStatusEnum('status').default('pending').notNull(),
  audioFileId: integer('audio_file_id').references(() => audioFiles.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const announcementTargets = pgTable('announcement_targets', {
  id: serial('id').primaryKey(),
  announcementId: integer('announcement_id').references(() => announcements.id, { onDelete: 'cascade' }),
  targetType: targetTypeEnum('target_type').notNull(),
  targetId: integer('target_id'),
});

export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  audioFileId: integer('audio_file_id').references(() => audioFiles.id, { onDelete: 'cascade' }),
  daysOfWeek: varchar('days_of_week', { length: 50 }).default('1,2,3,4,5').notNull(), // 0=Sun, 1=Mon, etc.
  startTime: varchar('start_time', { length: 8 }).notNull(), // HH:mm:ss
  endTime: varchar('end_time', { length: 8 }),
  intervalMinutes: integer('interval_minutes'), // For repeating bells
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const scheduleTargets = pgTable('schedule_targets', {
  id: serial('id').primaryKey(),
  scheduleId: integer('schedule_id').references(() => schedules.id, { onDelete: 'cascade' }),
  targetType: targetTypeEnum('target_type').notNull(),
  targetId: integer('target_id'),
});

export const exceptionDates = pgTable('exception_dates', {
  id: serial('id').primaryKey(),
  date: date('date').notNull().unique(),
  reason: varchar('reason', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const announcementLogs = pgTable('announcement_logs', {
  id: serial('id').primaryKey(),
  announcementId: integer('announcement_id').references(() => announcements.id, { onDelete: 'set null' }),
  classroomId: integer('classroom_id').references(() => classrooms.id, { onDelete: 'set null' }),
  event: varchar('event', { length: 50 }).notNull(),
  detail: text('detail'),
  loggedAt: timestamp('logged_at').defaultNow(),
});
