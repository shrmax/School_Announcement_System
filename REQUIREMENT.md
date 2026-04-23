# School Announcement System (SAS)
## Software Requirements Specification (SRS)

**Version:** 1.2  
**Status:** Draft  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Scope](#2-scope)
3. [Stakeholders](#3-stakeholders)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Constraints](#6-system-constraints)
7. [Announcement Types](#7-announcement-types)
8. [Target Resolution Rules](#8-target-resolution-rules)
9. [Priority System](#9-priority-system)
10. [Scheduling System](#10-scheduling-system)
11. [Audio Pipeline](#11-audio-pipeline)
12. [Tech Stack](#12-tech-stack)
13. [Out of Scope](#13-out-of-scope)

---

## 1. Project Overview

The School Announcement System (SAS) is a centralized audio announcement
platform for a single school campus. It allows the admin to broadcast
live, prerecorded, emergency, and bell announcements to any combination
of classrooms, floors, buildings, or the entire school over a local
network using the RTP protocol. The system runs entirely on-premises
with no authentication — it is designed for use on a closed, trusted
internal network only.

---

## 2. Scope

- Single school deployment on a closed local network
- Audio-only announcements (no video)
- Single interface used by the Admin for all operations
- Targets: individual classrooms, selected classrooms, floors,
  groups of floors, buildings, entire school
- Delivery: RTP unicast (single/selected classrooms) and
  RTP multicast (floors, buildings, school-wide)
- Scheduling: one-off and recurring (bell system)
- Priority-based interruption and queuing

---

## 3. Stakeholders

| Role | Description |
|------|-------------|
| Admin | Single user who manages school hierarchy, devices, bell schedules, audio library, and sends all announcement types |
| Student / Staff | Passive receivers of announcements via classroom speakers |
| IT Operator | Manages network config, endpoint devices, RTP multicast group setup |

---

## 4. Functional Requirements

### 4.1 School Hierarchy Management

- FR-01: Admin can create and manage the school structure:
  buildings → floors → classrooms
- FR-02: Each classroom must have a registered RTP endpoint
  (IP address + port)
- FR-03: Admin can assign multicast group addresses to floors
  and buildings
- FR-04: Admin can enable or disable individual endpoints
  without deleting them

### 4.2 Interface

- FR-05: The system exposes a single web UI used by the Admin
- FR-06: No login or authentication is required
- FR-07: The UI provides access to all features: announcement
  creation, live broadcast, prerecorded library, school
  hierarchy management, endpoint registration, bell schedule
  management, job monitor, and logs

### 4.3 Announcement Management

- FR-08: Admin can create an announcement with the following
  attributes:
  - Type (live, prerecorded, emergency, bell)
  - Priority level (1–5)
  - Target (classrooms, floor, group of floors, building, school)
  - Schedule (immediate or future date/time or recurring)
  - Audio source (microphone for live, file from library
    for prerecorded)
- FR-09: Admin can upload audio files (MP3, WAV, OGG accepted)
- FR-10: System transcodes all uploaded audio to Opus .ogg
  format using ffmpeg as a background pg-boss job
- FR-11: Admin can preview a prerecorded announcement
  before sending
- FR-12: Admin can cancel a scheduled announcement
  before it fires
- FR-13: Admin can view the full history of sent announcements
  with per-endpoint delivery status

### 4.4 Live Announcement

- FR-14: Admin can start a live broadcast directly from the
  browser using the device microphone
- FR-15: Browser captures audio via WebRTC (getUserMedia) and
  streams over WebSocket to the server
- FR-16: Server relays incoming audio as an RTP Opus stream
  to all target endpoints in real time
- FR-17: Admin can end the live broadcast at any time
- FR-18: Live announcement latency must not exceed 500ms
  end-to-end on the local network
- FR-19: A second live announcement is rejected by the system
  if one is already active; the UI shows a clear message
  to end the current broadcast first

### 4.5 Prerecorded Announcement

- FR-20: Uploaded and transcoded .ogg files are streamed via
  ffmpeg as RTP to target endpoints at send time
- FR-21: Prerecorded announcements are saved to a
  reusable library
- FR-22: Admin can assign a name and description to each
  saved recording

### 4.6 Emergency Announcement

- FR-23: Emergency announcement has the highest fixed
  priority (5) and immediately interrupts any ongoing
  stream including live announcements — it bypasses
  the queue entirely and fires instantly
- FR-24: A configurable alert tone (.ogg) is prepended
  before the emergency audio automatically
- FR-25: Emergency announcement targets the entire school
  by default; the admin may narrow the target zone but
  cannot send it to less than one full floor
- FR-26: Dashboard displays a real-time alert banner
  when an emergency announcement is active
- FR-27: If a scheduled emergency and a manual emergency
  trigger simultaneously, the manually triggered one
  takes precedence and the scheduled one is discarded
- FR-28: If two manual emergencies are triggered at the
  same time, the first received plays and the second
  queues immediately behind it

### 4.7 Bell System

- FR-29: Admin can configure recurring bell schedules
  using cron expressions (e.g., every weekday at 09:00)
- FR-30: Bell uses a prerecorded .ogg tone file
  selected by the admin
- FR-31: Multiple bell schedules can be active
  simultaneously (e.g., different bells for
  different floors)
- FR-32: Bell schedules can be paused and resumed
  without deletion
- FR-33: Admin can add exception dates (holidays) to
  suppress bells on specific days

### 4.8 Target Selection

- FR-34: Admin can select any combination of:
  - One or more individual classrooms → unicast
  - An entire floor → multicast
  - A group of floors → multicast per floor
  - An entire building → multicast
  - The entire school → single multicast broadcast
- FR-35: Selecting a floor in the UI auto-selects all
  classrooms under it visually, but resolves to one
  multicast stream — not individual unicast streams
- FR-36: Mixed targets (e.g., 3 individual classrooms
  + 1 floor) result in unicast streams for the
  classrooms and a multicast stream for the floor,
  running simultaneously

### 4.9 Scheduling

- FR-37: Admin can schedule any announcement type except
  live for a future date and time
- FR-38: Recurring schedules are supported via cron
  expressions stored and managed by pg-boss
- FR-39: Scheduled jobs persist across server restarts
  since pg-boss stores state in PostgreSQL
- FR-40: Failed jobs are retried up to 3 times with
  exponential backoff before being marked as failed
- FR-41: Admin UI shows all pending, active, completed,
  and failed jobs in a schedule/job monitor view

### 4.10 Priority and Interruption

- FR-42: Each announcement carries a priority level
  (1 = lowest, 5 = highest, see Priority System section)
- FR-43: Emergency (priority 5) bypasses the queue
  entirely — it fires instantly and interrupts
  everything with no exception
- FR-44: A higher-priority non-emergency announcement
  interrupts a lower-priority one currently playing;
  the interrupted announcement is paused and resumed
  after the higher-priority one finishes
- FR-45: Announcements interrupted by an emergency
  (priority 5) are discarded, not resumed
- FR-46: Announcements of equal priority that are both
  scheduled follow FIFO order
- FR-47: If two equal-priority announcements arrive
  simultaneously, the manually triggered one takes
  precedence over a scheduled one; if both are manual,
  the first received plays and the second queues

### 4.11 Logging and Monitoring

- FR-48: Every announcement attempt is logged with:
  timestamp, type, targets, priority, and status
  (delivered / failed / interrupted / skipped)
- FR-49: Delivery status is recorded per endpoint
- FR-50: Admin can export logs as CSV
- FR-51: Dashboard shows the currently active stream
  with target list, announcement type, and elapsed time

---

## 5. Non-Functional Requirements

### 5.1 Performance

- NFR-01: Live announcement end-to-end latency ≤ 500ms
  on the local network
- NFR-02: System must handle at least 50 simultaneous
  unicast RTP streams
- NFR-03: API response time for non-streaming endpoints
  must be under 200ms at p95
- NFR-04: Prerecorded stream must begin playing within
  1 second of job execution

### 5.2 Reliability

- NFR-05: Scheduled jobs must survive server restarts
- NFR-06: Failed RTP streams must be logged and not
  silently dropped
- NFR-07: Emergency announcements must fire within
  2 seconds of being triggered

### 5.3 Security

- NFR-08: System is deployed on a closed internal school
  network only — no public internet exposure
- NFR-09: Audio files are stored in a server-local
  directory not directly accessible via the browser
- NFR-10: No authentication or user accounts are required

### 5.4 Maintainability

- NFR-11: All environment configuration via .env files,
  no hardcoded values
- NFR-12: Database migrations managed via drizzle-kit
  or node-pg-migrate
- NFR-13: All ffmpeg commands are isolated inside a
  single audio service module

### 5.5 Usability

- NFR-14: Announcement creation must complete in under
  5 steps from the UI
- NFR-15: The live broadcast button must be reachable
  within 2 clicks from the dashboard
- NFR-16: Emergency announcement button must be visually
  distinct and always visible on the dashboard

---

## 6. System Constraints

- CON-01: Deployed entirely on-premises within the
  school local network
- CON-02: Network switches must support IGMP snooping
  for multicast to work correctly
- CON-03: Classroom endpoint devices must be capable
  of receiving and playing RTP streams (Raspberry Pi
  or equivalent running ffplay)
- CON-04: ffmpeg must be installed on the server host
- CON-05: PostgreSQL 14+ required for pg-boss
  compatibility
- CON-06: Node.js 18+ required

---

## 7. Announcement Types

| Type | Audio Source | Default Target | Schedulable | Priority |
|------|-------------|----------------|-------------|----------|
| Live | Microphone (WebRTC) | Admin's choice | No | 3–4 |
| Prerecorded | .ogg from library | Admin's choice | Yes | 2–4 |
| Emergency | Mic or prerecorded | Entire school (default) | No | 5 (fixed) |
| Bell | Prerecorded .ogg tone | Admin-configured zones | Yes (recurring) | 1 (fixed) |

---

## 8. Target Resolution Rules

| Target Type | Delivery Method | Resolved To |
|-------------|----------------|-------------|
| Single classroom | RTP Unicast | Classroom IP:Port |
| Selected classrooms | RTP Unicast (one per classroom) | List of IP:Port |
| Entire floor | RTP Multicast | Floor multicast group address |
| Group of floors | RTP Multicast (one per floor) | Multiple group addresses |
| Entire building | RTP Multicast | Building multicast group address |
| Entire school | RTP Multicast | School-wide group address |
| Mixed selection | Unicast + Multicast combined | Resolved per target individually |

---

## 9. Priority System

| Level | Label | Interrupts | Behaviour on Interrupt |
|-------|-------|-----------|------------------------|
| 5 | Emergency | Everything, instantly | Bypasses queue entirely; interrupted jobs discarded |
| 4 | Urgent live | Levels 1–3 | Interrupts; paused job resumes after |
| 3 | Normal live | Levels 1–2 | Interrupts; paused job resumes after |
| 2 | Prerecorded | Level 1 only | Interrupts bells only; bell re-queued |
| 1 | Bell | Nothing | Plays only when queue is otherwise empty |

**Tie-breaking rules:**
- Manual trigger beats scheduled trigger at equal priority
- If both are manual and equal priority, first received wins;
  second queues immediately behind
- Two simultaneous live announcements are not permitted;
  second is rejected at the UI level

---

## 10. Scheduling System

- Engine: pg-boss (PostgreSQL-backed job queue, no Redis required)
- One-off jobs: stored with an exact future trigger timestamp
- Recurring jobs: stored as cron expressions
  (e.g., `0 9 * * 1-5` for 9 AM on weekdays)
- Retry policy: 3 attempts, exponential backoff
  (30s → 2m → 8m)
- Job types:
  - `announcement.send` — fires a scheduled announcement
  - `announcement.transcode` — converts uploaded audio
    to Opus .ogg
  - `bell.fire` — fires a recurring bell tone
- Holiday suppression: checked at job execution time
  against an `exception_dates` table in PostgreSQL

---

## 11. Audio Pipeline

**Upload and transcode:**
Upload (MP3 / WAV / OGG)
↓
pg-boss transcode job
↓
ffmpeg → Opus .ogg (32kbps, 48kHz, mono)
↓
Stored at /audio/library/<id>.ogg

**Prerecorded / Bell stream:**
/audio/library/<id>.ogg
↓
ffmpeg -re -i <file>.ogg -acodec copy -f rtp rtp://TARGET_IP:PORT

**Live stream:**
Browser mic (WebRTC, Opus encoded)
↓
WebSocket → Fastify server
↓
RTP Opus relay → target endpoints

**Emergency stream:**
/audio/alert-tone.ogg (prepended automatically)
↓
ffmpeg concat → emergency audio
↓
RTP Opus → entire school (or selected zone)

---

## 12. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Node.js 18+, Fastify |
| Database | PostgreSQL 14+ |
| Job Queue | pg-boss |
| Audio transcoding | ffmpeg |
| Audio streaming | RTP via ffmpeg |
| Live audio capture | WebRTC (browser getUserMedia) |
| Audio format at rest | Opus codec, .ogg container, 32kbps 48kHz mono |
| Audio format in transit | RTP with Opus payload |
| Real-time status | WebSocket (Fastify ws plugin) |

---

## 13. Out of Scope

- User authentication and access control
- Multiple admin users or role separation
- Video announcements
- SMS or email notifications
- Mobile application
- Multi-school / multi-tenant support
- Cloud hosting
- Text-to-speech
- Two-way audio or intercom
- Recording of live announcements for later playback
- HTTPS (internal network only, plain HTTP acceptable)

---

*End of SRS v1.2*