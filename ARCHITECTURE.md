# School Announcement System (SAS)
## Architecture Document

**Version:** 1.0  
**Status:** Draft  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High Level Architecture](#2-high-level-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Database Design](#4-database-design)
5. [Backend Architecture](#5-backend-architecture)
6. [Audio Pipeline Architecture](#6-audio-pipeline-architecture)
7. [RTP Streaming Architecture](#7-rtp-streaming-architecture)
8. [Job Queue Architecture](#8-job-queue-architecture)
9. [Priority and Interruption Engine](#9-priority-and-interruption-engine)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Endpoint Device Architecture](#11-endpoint-device-architecture)
12. [Data Flow Diagrams](#12-data-flow-diagrams)
13. [Environment Configuration](#13-environment-configuration)
14. [Error Handling Strategy](#14-error-handling-strategy)

---

## 1. System Overview

The School Announcement System is a single-school, on-premises audio
broadcast platform. It runs on one server inside the school's local
network. The admin uses a single web UI to manage the school hierarchy
and send announcements. Audio is delivered to classrooms via RTP
streams over the local network. There is no internet dependency,
no authentication, and no cloud component.

**Deployment topology:**
[ Admin Browser ]
|
| HTTP / WebSocket (local network)
|
[ SAS Server — Node.js + Fastify ]
|              |
|              | pg-boss jobs
|              |
[ PostgreSQL ]   [ ffmpeg processes ]
|
| RTP streams (unicast / multicast)
|
+--------------+--------------+
|              |              |
[ Classroom A ] [ Classroom B ] [ Floor multicast group ]
(ffplay)        (ffplay)        (ffplay on each device)

---

## 2. High Level Architecture

### 2.1 Layers
┌─────────────────────────────────────────────┐
│               React + Vite UI               │  ← Single page, no auth
├─────────────────────────────────────────────┤
│           Fastify REST + WebSocket          │  ← API + live relay
├──────────────┬──────────────────────────────┤
│  PostgreSQL  │         pg-boss              │  ← Persistence + job queue
├──────────────┴──────────────────────────────┤
│         Audio Service (ffmpeg)              │  ← Transcode + RTP stream
├─────────────────────────────────────────────┤
│   RTP Layer — unicast / multicast streams   │  ← Delivery to endpoints
└─────────────────────────────────────────────┘

### 2.2 Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| React UI | Announcement creation, target selection, live broadcast, schedule management, logs, hierarchy management |
| Fastify server | REST API, WebSocket relay for live audio, priority engine, target resolver |
| PostgreSQL | All persistent data — hierarchy, announcements, schedules, logs, exception dates |
| pg-boss | Job queue for scheduled announcements, bell firing, audio transcoding |
| Audio service | ffmpeg wrapper — transcoding uploads, streaming prerecorded and bell audio via RTP |
| RTP layer | Delivery of Opus audio streams to classroom endpoint devices |
| Endpoint devices | Raspberry Pi or equivalent running ffplay, joined to relevant multicast groups |

---

## 3. Folder Structure

### 3.1 Backend
sas-backend/
├── src/
│   ├── server.js                  ← Fastify instance, plugin registration
│   ├── config.js                  ← Loads and validates .env
│   │
│   ├── routes/
│   │   ├── announcements.js       ← POST /announcements, GET /announcements
│   │   ├── hierarchy.js           ← CRUD for buildings, floors, classrooms (includes IP/port config)
│   │   ├── library.js             ← Upload, list, delete audio files
│   │   ├── schedules.js           ← Automated broadcast schedules
│   │   ├── logs.js                ← Announcement history, CSV export
│   │   └── stream.js              ← WebSocket route for live broadcast
│   │
│   ├── services/
│   │   ├── announcement.service.js   ← Create, validate, dispatch announcements
│   │   ├── target.resolver.js        ← Expand targets to endpoint IP list
│   │   ├── priority.engine.js        ← Interrupt logic, queue management
│   │   ├── audio.service.js          ← All ffmpeg calls (transcode + stream)
│   │   ├── rtp.service.js            ← Manage active RTP sessions
│   │   └── live.relay.js             ← WebSocket → RTP relay for live audio
│   │
│   ├── jobs/
│   │   ├── queue.js                  ← pg-boss instance, worker registration
│   │   ├── workers/
│   │   │   ├── announcement.send.js  ← Worker: fires scheduled announcement
│   │   │   ├── announcement.transcode.js ← Worker: ffmpeg transcode job
│   │   │   └── bell.fire.js          ← Worker: fires recurring bell
│   │
│   ├── db/
│   │   ├── index.js               ← PostgreSQL connection pool
│   │   ├── migrations/            ← SQL migration files
│   │   └── queries/               ← Raw SQL or drizzle query functions
│   │       ├── announcements.js
│   │       ├── hierarchy.js
│   │       ├── endpoints.js
│   │       ├── schedules.js
│   │       └── logs.js
│   │
│   └── utils/
│       ├── logger.js              ← Pino logger config
│       └── errors.js              ← Custom error classes
│
├── audio/
│   ├── library/                   ← Transcoded .ogg files (admin uploads)
│   └── system/                    ← System tones (alert, bell defaults)
│       ├── alert-tone.ogg
│       └── default-bell.ogg
│
├── .env
├── .env.example
├── package.json
└── README.md

### 3.2 Frontend
sas-frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                    ← Router setup
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx          ← Active stream status, quick actions
│   │   ├── Announce.tsx           ← Announcement creation flow
│   │   ├── LiveBroadcast.tsx      ← Mic capture, go-live panel
│   │   ├── Library.tsx            ← Upload and manage audio files
│   │   ├── Schedules.tsx          ← Bell schedules, exception dates
│   │   ├── Hierarchy.tsx          ← Manage buildings, floors, classrooms
│   │   ├── Endpoints.tsx          ← Register and manage RTP endpoints (Placeholder)
│   │   ├── JobMonitor.tsx         ← pg-boss job status view (Placeholder)
│   │   └── Logs.tsx               ← Announcement history, CSV export (Placeholder)
│   │
│   ├── components/
│   │   ├── TargetSelector.tsx     ← Hierarchical checkbox tree
│   │   ├── PriorityPicker.tsx     ← Priority level selector (Placeholder)
│   │   ├── AudioUploader.tsx      ← Drag and drop upload with preview (Placeholder)
│   │   ├── ActiveStreamBanner.tsx ← Shows currently playing announcement (Placeholder)
│   │   ├── EmergencyButton.tsx    ← Always-visible emergency trigger (Placeholder)
│   │   └── ScheduleForm.tsx       ← Cron / datetime schedule builder (Placeholder)
│   │
│   ├── hooks/
│   │   ├── useWebSocket.ts        ← WS connection for real-time status
│   │   ├── useMicrophone.ts       ← getUserMedia + audio capture (Placeholder)
│   │   └── useActiveStream.ts     ← Polls or subscribes to active stream state (Placeholder)
│   │
│   ├── api/
│   │   └── client.ts              ← Axios or fetch wrapper, base URL from env (Placeholder)
│   │
│   └── utils/
│       └── cron.helper.ts         ← Human-readable cron description helper (Placeholder)
│
├── .env
├── index.html
├── vite.config.js
└── package.json

---

## 4. Database Design

### 4.1 Schema

```sql
-- School hierarchy

CREATE TABLE buildings (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE floors (
  id                SERIAL PRIMARY KEY,
  building_id       INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  multicast_address VARCHAR(45) NOT NULL, -- e.g. 239.1.1.1:5004
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE classrooms (
  id           SERIAL PRIMARY KEY,
  floor_id     INTEGER REFERENCES floors(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  ip_address   VARCHAR(45),   -- e.g. 192.168.1.45
  port         INTEGER DEFAULT 5004,
  enabled      BOOLEAN DEFAULT TRUE,
  last_seen    TIMESTAMP,     -- Hardware heartbeat
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audio_files (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  description  TEXT,
  filename     VARCHAR(200) NOT NULL,
  duration_sec INTEGER,
  size_bytes   INTEGER,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE announcements (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(200),        -- e.g. "Morning Assembly Notice"
  type          VARCHAR(20) NOT NULL CHECK (
                  type IN ('live', 'prerecorded', 'emergency', 'bell')
                ),
  priority      INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
                  status IN (
                    'pending', 'active', 'completed',
                    'failed', 'interrupted', 'cancelled'
                  )
                ),
  audio_file_id INTEGER REFERENCES audio_files(id) ON DELETE SET NULL,
  started_at    TIMESTAMP,
  ended_at      TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE announcement_targets (
  id              INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
  target_type     VARCHAR(20) NOT NULL CHECK (
                    target_type IN ('classroom', 'floor', 'building', 'school')
                  ),
  target_id       INTEGER  -- NULL when target_type is 'school'
);

CREATE TABLE schedules (
  id              SERIAL PRIMARY KEY,
  announcement_id INTEGER REFERENCES announcements(id) ON DELETE CASCADE,
  cron_expr       VARCHAR(100),      -- for recurring broadcasts (e.g. bells, drills)
  run_at          TIMESTAMP,         -- for one-off scheduled announcements
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exception_dates (
  id         SERIAL PRIMARY KEY,
  date       DATE NOT NULL UNIQUE,
  reason     VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE announcement_logs (
  id              SERIAL PRIMARY KEY,
  announcement_id INTEGER REFERENCES announcements(id) ON DELETE SET NULL,
  classroom_id    INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
  event           VARCHAR(50) NOT NULL,
  detail          TEXT,
  logged_at       TIMESTAMP DEFAULT NOW()
);
### 4.3 Indexes

```sql
CREATE INDEX idx_floors_building    ON floors(building_id);
CREATE INDEX idx_classrooms_floor   ON classrooms(floor_id);
CREATE INDEX idx_targets_announcement ON announcement_targets(announcement_id);
CREATE INDEX idx_logs_announcement  ON announcement_logs(announcement_id);
CREATE INDEX idx_logs_logged_at     ON announcement_logs(logged_at DESC);
CREATE INDEX idx_announcements_status ON announcements(status);
```

---

## 5. Backend Architecture

### 5.1 Fastify Server Setup
server.js
├── register @fastify/cors
├── register @fastify/websocket
├── register @fastify/multipart     ← audio file uploads
├── register @fastify/static        ← serve frontend build
├── register db plugin              ← PostgreSQL pool
├── register pg-boss plugin         ← job queue instance
├── register routes (all prefixed /api/v1)
└── register WebSocket route /ws/live

### 5.2 REST API Routes
Hierarchy
GET    /api/v1/buildings
POST   /api/v1/buildings
PUT    /api/v1/buildings/:id
DELETE /api/v1/buildings/:id
GET    /api/v1/buildings/:id/floors
POST   /api/v1/floors
PUT    /api/v1/floors/:id
DELETE /api/v1/floors/:id
GET    /api/v1/floors/:id/classrooms
POST   /api/v1/classrooms
PUT    /api/v1/classrooms/:id
DELETE /api/v1/classrooms/:id
PATCH  /api/v1/classrooms/:id/toggle  ← enable/disable endpoint
Audio Library
GET    /api/v1/library
POST   /api/v1/library/upload       ← multipart, triggers transcode job
DELETE /api/v1/library/:id
GET    /api/v1/library/:id/preview  ← streams audio for browser preview
Announcements
POST   /api/v1/announcements        ← create + dispatch or schedule
GET    /api/v1/announcements        ← history with filters
GET    /api/v1/announcements/active ← currently playing stream
DELETE /api/v1/announcements/:id    ← cancel scheduled only
Bell Schedules
GET    /api/v1/schedules
POST   /api/v1/schedules
PUT    /api/v1/schedules/:id
DELETE /api/v1/schedules/:id
PATCH  /api/v1/schedules/:id/toggle
Exception Dates
GET    /api/v1/exceptions
POST   /api/v1/exceptions
DELETE /api/v1/exceptions/:id
Logs
GET    /api/v1/logs                 ← paginated, filterable
GET    /api/v1/logs/export          ← CSV download
Jobs
GET    /api/v1/jobs                 ← pg-boss job monitor
WebSocket
WS     /ws/live                     ← live broadcast relay
WS     /ws/status                   ← real-time stream status push

### 5.3 Target Resolver Service

The target resolver takes the raw target selection from the API
payload and returns a flat list of RTP destinations.
Input:
{
targets: [
{ type: 'classroom', id: 12 },
{ type: 'floor', id: 3 },
{ type: 'school' }
]
}
Process:

classroom → query endpoints table for IP:port → unicast entry
floor     → query floors table for multicast address → multicast entry
building  → query buildings table, get floor multicast addresses
school    → return school-wide multicast group address

Output:
{
unicast: [
{ classroomId: 12, ip: '192.168.1.45', port: 5004 }
],
multicast: [
{ type: 'floor', id: 3, address: '239.1.1.3', port: 5004 },
{ type: 'school', address: '239.0.0.1', port: 5004 }
]
}

### 5.4 Priority Engine

The priority engine runs in memory (state stored in Redis-free
Node.js Map + PostgreSQL for persistence).
State held in memory:
{
activeStream: {
announcementId: 42,
type: 'prerecorded',
priority: 2,
ffmpegPid: 18432,
startedAt: Date,
pausedAt: null
},
queue: [
{ announcementId: 43, priority: 1, ... }
]
}
On new announcement received:

If no active stream → start immediately
If incoming.priority === 5 (emergency):
→ kill active ffmpeg process
→ discard active stream (do not resume)
→ discard entire queue
→ start emergency stream
If incoming.priority > active.priority:
→ pause active stream (record pausedAt + byte offset)
→ push active stream back to front of queue
→ start incoming stream
If incoming.priority <= active.priority:
→ insert into queue at correct FIFO position by priority
On stream end:
→ pop next from queue
→ resume or start next stream


---

## 6. Audio Pipeline Architecture

### 6.1 Upload and Transcode
POST /api/v1/library/upload
↓
Fastify multipart handler saves raw file to /audio/tmp/<uuid>.<ext>
↓
Insert audio_files row (status: transcoding)
↓
pg-boss.send('announcement.transcode', { fileId, tmpPath })
↓
Worker picks up job:
ffmpeg -i /audio/tmp/<uuid>.<ext>
-c:a libopus
-b:a 32k
-ar 48000
-ac 1
/audio/library/<fileId>.ogg
↓
On success: update audio_files row (status: ready, duration, size)
delete tmp file
On failure: update audio_files row (status: failed)
retry up to 3 times

### 6.2 Prerecorded Stream Command

```bash
ffmpeg \
  -re \
  -i /audio/library/<fileId>.ogg \
  -acodec copy \
  -f rtp \
  rtp://<TARGET_IP>:<PORT>
```

For multiple unicast targets, ffmpeg tee muxer is used:

```bash
ffmpeg \
  -re \
  -i /audio/library/<fileId>.ogg \
  -acodec copy \
  -f tee \
  "[f=rtp]rtp://192.168.1.45:5004|[f=rtp]rtp://192.168.1.46:5004"
```

For multicast targets:

```bash
ffmpeg \
  -re \
  -i /audio/library/<fileId>.ogg \
  -acodec copy \
  -f rtp \
  rtp://239.1.1.3:5004?ttl=10
```

### 6.3 Emergency Prepend Command

```bash
ffmpeg \
  -i /audio/system/alert-tone.ogg \
  -i /audio/library/<fileId>.ogg \
  -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1" \
  -acodec libopus \
  -b:a 32k \
  -f rtp \
  rtp://239.0.0.1:5004?ttl=10
```

### 6.4 Live Relay Pipeline
Browser (getUserMedia → Opus via WebRTC)
↓
WebSocket frames (binary Opus packets) → Fastify /ws/live
↓
live.relay.js buffers and writes to ffmpeg stdin:
ffmpeg 
-f opus 
-i pipe:0 
-acodec copy 
-f tee 
"<unicast targets> | <multicast targets>"
↓
RTP streams to endpoints

---

## 7. RTP Streaming Architecture

### 7.1 Multicast Group Address Allocation
School-wide broadcast:   239.0.0.1:5004
Building 1:              239.1.0.1:5004
Building 2:              239.1.0.2:5004
Floor 1-1:               239.1.1.1:5004
Floor 1-2:               239.1.1.2:5004
Floor 2-1:               239.1.2.1:5004
... and so on

Admin assigns these addresses when creating floors and buildings
in the hierarchy management UI. They are stored in the `floors`
and `buildings` tables.

### 7.2 Endpoint Device Multicast Membership

Each Raspberry Pi endpoint device joins the following multicast
groups on boot via a startup script:

```bash
# Join floor group
ip route add 239.1.1.1 dev eth0
smcroute -j eth0 239.1.1.1

# Join school-wide group
ip route add 239.0.0.1 dev eth0
smcroute -j eth0 239.0.0.1

# Start listening and playing
ffplay -nodisp -autoexit \
  -i rtp://239.1.1.1:5004 \
  -i rtp://239.0.0.1:5004
```

### 7.3 RTP Session Manager

`rtp.service.js` maintains a map of all active ffmpeg processes:
activeSessions: Map<sessionId, {
announcementId: number,
ffmpegProcess:  ChildProcess,
targets:        string[],
startedAt:      Date,
type:           string
}>

On interrupt: `ffmpegProcess.kill('SIGTERM')`
On end: process exits naturally, session removed from map,
        next item dequeued from priority engine

---

## 8. Job Queue Architecture

### 8.1 pg-boss Setup

pg-boss creates its own tables inside PostgreSQL. No separate
Redis instance is needed. The queue persists across restarts.

```javascript
// jobs/queue.js
const PgBoss = require('pg-boss')

const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  retryLimit: 3,
  retryDelay: 30,        // seconds, exponential applied by pg-boss
  expireInHours: 24
})

await boss.start()

// Register workers
boss.work('announcement.send',           sendWorker)
boss.work('announcement.transcode',      transcodeWorker)
boss.work('announcement.fire_recurring', recurringWorker)

// Register recurring bell schedules (called at startup
// and whenever admin updates bell schedules)
async function registerBellSchedule(schedule) {
  await boss.schedule(
    'bell.fire',
    schedule.cron_expr,
    { scheduleId: schedule.id }
  )
}
```

### 8.2 Worker Logic

**announcement.send worker:**

Load announcement + targets from DB
Check exception_dates — if today is a holiday, skip
Call target resolver → get unicast + multicast list
Call priority engine → queue or start immediately
Log result


**announcement.fire_recurring worker:**

Load recurring schedule from DB
Check if schedule is still enabled
Check exception_dates — if holiday, skip and log
Build announcement object (type: bell or emergency, priority: 1-5)
Call priority engine → queue or start
Log result


**announcement.transcode worker:**

Run ffmpeg transcode command
On success → update audio_files, delete tmp file
On failure → update status, pg-boss retries automatically


---

## 9. Priority and Interruption Engine

### 9.1 State Machine

Each announcement moves through these states:
pending → active → completed
→ interrupted → resumed → completed
→ failed
pending → cancelled   (admin cancels before it fires)
pending → skipped     (holiday suppression)

### 9.2 Interrupt and Resume Logic

When a higher-priority announcement interrupts an active one:

Record pausedAt timestamp and byte offset in memory
SIGTERM the active ffmpeg process
Update announcement status → interrupted
Push interrupted announcement back to front of queue
(unless it was interrupted by emergency → discard)
Start the higher-priority announcement
When higher-priority ends:
a. Pop from queue
b. If resumed item is prerecorded: restart ffmpeg
from byte offset (ffmpeg -ss <offset> -i file.ogg)
c. If resumed item was live: cannot resume,
mark as interrupted/completed


### 9.3 Emergency Fast Path
On emergency trigger (POST /api/v1/announcements, type: emergency):

Immediately kill ALL active ffmpeg sessions (SIGTERM)
Clear the entire in-memory queue
Prepend alert tone + concat emergency audio
Start RTP stream to target (default: school-wide multicast)
Push WS status update to admin browser
Log all discarded announcements as interrupted


---

## 10. Frontend Architecture

### 10.1 Page Structure
/ (Dashboard)
├── Active stream banner (always visible at top)
├── Emergency button (always visible, top right, red)
├── Quick actions: Go Live, New Announcement
└── Recent announcements list
/announce
├── Step 1: Select type (prerecorded / emergency / bell)
├── Step 2: Select audio (library picker)
├── Step 3: Select targets (TargetSelector tree component)
├── Step 4: Set priority and schedule
└── Step 5: Confirm and send
/live
├── Mic level indicator
├── Target selector
├── Go Live / End Broadcast button
└── Live status (duration, targets receiving)
/library
├── Upload area (drag and drop, accepts MP3 WAV OGG)
├── Transcode status indicator
└── File list (name, duration, preview button, delete)
/schedules
├── Broadcast schedule list (Bells, Drills, Prerecorded) with enable/disable toggle
├── Add schedule form (cron builder + type selection + target + audio)
└── Exception dates calendar
/hierarchy
├── Buildings list
├── Expandable floors per building
└── Classrooms per floor with endpoint IP display
/endpoints
└── Table of all endpoints with IP, port, enabled status
/jobs
└── pg-boss job monitor (pending / active / failed / completed)
/logs
├── Filterable announcement history table
└── Export CSV button

### 10.2 Target Selector Component

The `TargetSelector` component renders the full school hierarchy
as a checkbox tree. Selection logic:

Check "School" → selects everything, resolves to
one school-wide multicast
Check a building → selects all floors under it,
each floor resolves to its multicast address
Check a floor → selects all classrooms under it,
resolves to floor multicast address (not individual unicasts)
Check individual classrooms → each resolves to
unicast to that classroom's endpoint IP:port
Mixed selection is allowed and resolved by the backend
target resolver


### 10.3 Real-time Status (WebSocket)

The frontend connects to `ws://SERVER/ws/status` on load.
The server pushes events on this channel:

```javascript
// Event types pushed by server
{ event: 'stream.started',     data: { announcementId, type, targets } }
{ event: 'stream.ended',       data: { announcementId } }
{ event: 'stream.interrupted', data: { announcementId, by } }
{ event: 'emergency.active',   data: { announcementId } }
{ event: 'emergency.ended',    data: {} }
{ event: 'transcode.done',     data: { fileId } }
{ event: 'transcode.failed',   data: { fileId, error } }
```

The `ActiveStreamBanner` and `EmergencyButton` components subscribe
to this channel via `useWebSocket` hook to stay in sync without polling.

---

## 11. Endpoint Device Architecture

### 11.1 Hardware

Each classroom requires one of:
- Raspberry Pi 3B+ or newer running Raspberry Pi OS Lite
- Any Linux device with a 3.5mm or USB audio output
- Existing IP PA speaker with RTP/SDP support (check manufacturer)

### 11.2 Startup Script

```bash
#!/bin/bash
# /etc/sas/start.sh — runs on boot via systemd

FLOOR_MULTICAST="239.1.1.1"    # set per device
SCHOOL_MULTICAST="239.0.0.1"
PORT="5004"
SERVER_IP="192.168.1.10"

# Register this endpoint with the SAS server
curl -X POST http://$SERVER_IP/api/v1/endpoints/heartbeat \
  -H "Content-Type: application/json" \
  -d "{\"ip\": \"$(hostname -I | awk '{print $1}')\", \"port\": $PORT}"

# Join multicast groups
ip route add $FLOOR_MULTICAST dev eth0
ip route add $SCHOOL_MULTICAST dev eth0

# Listen on both multicast groups simultaneously
ffplay -nodisp \
  -i rtp://$FLOOR_MULTICAST:$PORT \
  -i rtp://$SCHOOL_MULTICAST:$PORT
```

### 11.3 Systemd Service

```ini
# /etc/systemd/system/sas-endpoint.service
[Unit]
Description=SAS Endpoint Receiver
After=network.target

[Service]
ExecStart=/etc/sas/start.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## 12. Data Flow Diagrams

### 12.1 Prerecorded Announcement (Immediate)
Admin clicks Send
↓
POST /api/v1/announcements
↓
target.resolver → [unicast list] + [multicast list]
↓
priority.engine → no active stream → start immediately
↓
audio.service.streamFile(fileId, targets)
↓
ffmpeg process spawned → RTP stream → endpoints
↓
announcement status → active
↓
WS push → stream.started event → UI banner updates
↓
ffmpeg exits (file ends)
↓
rtp.service removes session
priority.engine pops next from queue (or idles)
↓
announcement status → completed
↓
WS push → stream.ended → UI banner clears
↓
announcement_logs rows written

### 12.2 Scheduled Bell
Admin creates bell schedule (cron: '0 9 * * 1-5')
↓
POST /api/v1/schedules
↓
pg-boss.schedule('bell.fire', '0 9 * * 1-5', { scheduleId })
↓
--- at 09:00 on a weekday ---
↓
pg-boss fires bell.fire worker
↓
Worker checks exception_dates → not a holiday → proceed
↓
Build announcement (type: bell, priority: 1)
↓
priority.engine → if active stream exists → queue bell
→ if idle → start immediately
↓
audio.service.streamFile(bellAudioId, targets)
↓
ffmpeg → RTP → endpoints

### 12.3 Emergency Override
Admin clicks Emergency button
↓
POST /api/v1/announcements (type: emergency, priority: 5)
↓
priority.engine.triggerEmergency()
↓
Kill ALL active ffmpeg processes (SIGTERM)
Clear entire queue
Discard all paused/queued announcements → log as interrupted
↓
audio.service.streamEmergency(audioId, targets)
↓
ffmpeg: concat alert-tone.ogg + emergency-audio.ogg → RTP → school multicast
↓
WS push → emergency.active → UI shows red alert banner
↓
ffmpeg exits
↓
WS push → emergency.ended → banner clears

### 12.4 Live Broadcast
Admin opens /live, selects targets, clicks Go Live
↓
Browser: getUserMedia() → MediaRecorder (Opus, 32kbps)
↓
WebSocket connection to /ws/live
↓
Binary Opus frames sent over WS as they are captured
↓
live.relay.js receives frames → writes to ffmpeg stdin pipe
↓
ffmpeg: -f opus -i pipe:0 → RTP → targets
↓
Admin clicks End Broadcast
↓
WS closes → ffmpeg stdin closes → ffmpeg exits
↓
Session cleaned up, logs written

---

## 13. Environment Configuration

```bash
# .env.example

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Database
DATABASE_URL=postgresql://sas_user:password@localhost:5432/sas_db

# Audio
AUDIO_LIBRARY_PATH=./audio/library
AUDIO_SYSTEM_PATH=./audio/system
AUDIO_TMP_PATH=./audio/tmp

# RTP
RTP_DEFAULT_PORT=5004
RTP_SCHOOL_MULTICAST=239.0.0.1
RTP_MULTICAST_TTL=10

# ffmpeg
FFMPEG_PATH=/usr/bin/ffmpeg

# Frontend (for Vite)
VITE_API_BASE_URL=http://192.168.1.10:3000
VITE_WS_BASE_URL=ws://192.168.1.10:3000
```

---

## 14. Error Handling Strategy

### 14.1 ffmpeg Process Failures

ffmpeg exits with non-zero code
→ log error with stdout/stderr capture
→ update announcement status to failed
→ priority engine pops next from queue
→ WS push stream.failed event to UI


### 14.2 pg-boss Job Failures

Worker throws an error
→ pg-boss retries automatically (up to 3 times)
→ After 3 failures: job marked as failed in DB
→ Admin can see failed jobs in /jobs monitor
→ Admin can manually retry from UI


### 14.3 WebSocket Disconnection (Live Broadcast)

WS disconnects mid-broadcast
→ ffmpeg stdin closes
→ ffmpeg exits
→ Session cleaned up
→ Announcement logged as interrupted
→ Priority engine resumes queue


### 14.4 Endpoint Device Unreachable

ffmpeg RTP send to unreachable unicast IP
→ ffmpeg logs send errors but continues streaming
(RTP is UDP — no connection, no hard failure)
→ After stream ends, log delivery status as
failed for that endpoint
→ Other endpoints in the same stream are unaffected


---

*End of Architecture Document v1.0*