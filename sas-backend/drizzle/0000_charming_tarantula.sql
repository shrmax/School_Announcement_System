CREATE TYPE "public"."announcement_status" AS ENUM('pending', 'active', 'completed', 'failed', 'interrupted', 'cancelled', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."announcement_type" AS ENUM('live', 'prerecorded', 'emergency', 'bell');--> statement-breakpoint
CREATE TYPE "public"."target_type" AS ENUM('classroom', 'floor', 'building', 'school');--> statement-breakpoint
CREATE TABLE "announcement_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"announcement_id" integer,
	"classroom_id" integer,
	"event" varchar(50) NOT NULL,
	"detail" text,
	"logged_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "announcement_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"announcement_id" integer,
	"target_type" "target_type" NOT NULL,
	"target_id" integer
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200),
	"type" "announcement_type" NOT NULL,
	"priority" integer NOT NULL,
	"status" "announcement_status" DEFAULT 'pending' NOT NULL,
	"audio_file_id" integer,
	"started_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audio_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"filename" varchar(200) NOT NULL,
	"duration_sec" integer,
	"size_bytes" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "buildings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classrooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"floor_id" integer,
	"name" varchar(100) NOT NULL,
	"ip_address" varchar(45),
	"port" integer DEFAULT 5004,
	"enabled" boolean DEFAULT true,
	"last_seen" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "exception_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"reason" varchar(200),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "exception_dates_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "floors" (
	"id" serial PRIMARY KEY NOT NULL,
	"building_id" integer,
	"name" varchar(100) NOT NULL,
	"multicast_address" varchar(45) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" integer,
	"target_type" "target_type" NOT NULL,
	"target_id" integer
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"audio_file_id" integer,
	"days_of_week" varchar(50) DEFAULT '1,2,3,4,5' NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8),
	"interval_minutes" integer,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "announcement_logs" ADD CONSTRAINT "announcement_logs_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_logs" ADD CONSTRAINT "announcement_logs_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_targets" ADD CONSTRAINT "announcement_targets_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_audio_file_id_audio_files_id_fk" FOREIGN KEY ("audio_file_id") REFERENCES "public"."audio_files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_floor_id_floors_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_building_id_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_targets" ADD CONSTRAINT "schedule_targets_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_audio_file_id_audio_files_id_fk" FOREIGN KEY ("audio_file_id") REFERENCES "public"."audio_files"("id") ON DELETE cascade ON UPDATE no action;