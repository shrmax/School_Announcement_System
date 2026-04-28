# Graph Report - .  (2026-04-28)

## Corpus Check
- Corpus is ~26,377 words - fits in a single context window. You may not need a graph.

## Summary
- 167 nodes · 237 edges · 12 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `handleSave()` - 10 edges
2. `PriorityEngine` - 7 edges
3. `handleDelete()` - 7 edges
4. `getBuildings()` - 6 edges
5. `AudioService` - 5 edges
6. `LiveStreamService` - 5 edges
7. `initQueue()` - 5 edges
8. `SchedulerService` - 5 edges
9. `transcodeWorker()` - 4 edges
10. `AnnouncementService` - 4 edges

## Surprising Connections (you probably didn't know these)
- `start()` --calls--> `initQueue()`  [INFERRED]
  sas-backend\lib\server.js → sas-backend\src\services\queue.ts
- `loadInitialData()` --calls--> `getBuildings()`  [INFERRED]
  sas-frontend\src\pages\Announce.tsx → sas-backend\src\controllers\hierarchy.ts
- `loadBuildings()` --calls--> `getBuildings()`  [INFERRED]
  sas-frontend\src\pages\Hierarchy.tsx → sas-backend\src\controllers\hierarchy.ts
- `loadBuildings()` --calls--> `getBuildings()`  [INFERRED]
  sas-frontend\src\pages\LiveBroadcast.tsx → sas-backend\src\controllers\hierarchy.ts
- `loadHierarchy()` --calls--> `getBuildings()`  [INFERRED]
  sas-frontend\src\pages\Schedules.tsx → sas-backend\src\controllers\hierarchy.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.17
Nodes (19): createBuilding(), createClassroom(), createFloor(), deleteBuilding(), deleteClassroom(), deleteFloor(), getClassroomsByFloor(), getFloorsByBuilding() (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (2): announcementRoutes(), liveRoutes()

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (4): createAnnouncement(), getAnnouncementStatus(), AnnouncementService, PriorityEngine

### Community 3 - "Community 3"
Cohesion: 0.23
Nodes (7): createSchedule(), deleteSchedule(), getSchedules(), toggleSchedule(), handleCreate(), handleDelete(), loadData()

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (4): startStreaming(), stopStreaming(), toggleLive(), LiveStreamService

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (4): start(), initQueue(), SchedulerService, start()

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (2): handleFileChange(), loadFiles()

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (5): deleteAudio(), getLibrary(), logger_warn(), uploadAudio(), libraryRoutes()

### Community 8 - "Community 8"
Cohesion: 0.25
Nodes (4): getBuildings(), loadInitialData(), loadBuildings(), loadHierarchy()

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (2): AudioService, transcodeWorker()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (3): getSystemStats(), handleQuickEmergency(), loadStats()

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (1): hierarchyRoutes()

## Knowledge Gaps
- **Thin community `Community 1`** (22 nodes): `announcementRoutes()`, `liveRoutes()`, `announcements.js`, `live.js`, `announcements.ts`, `schedules.ts`, `stats.ts`, `index.ts`, `schema.ts`, `transcode.ts`, `announcements.ts`, `live.ts`, `schedules.ts`, `announcements.ts`, `server.ts`, `announcements.ts`, `audio.ts`, `live.ts`, `priority.ts`, `queue.ts`, `scheduler.ts`, `logger.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 6`** (10 nodes): `formatDuration()`, `formatSize()`, `getStatus()`, `getStatusIcon()`, `handleDelete()`, `handleFileChange()`, `handlePlay()`, `handleUploadClick()`, `loadFiles()`, `Library.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (7 nodes): `transcode.js`, `audio.js`, `AudioService`, `.getMetadata()`, `.streamToTargets()`, `.transcode()`, `transcodeWorker()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (3 nodes): `hierarchyRoutes()`, `hierarchy.js`, `hierarchy.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getBuildings()` connect `Community 8` to `Community 0`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `loadBuildings()` connect `Community 8` to `Community 4`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `PriorityEngine` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `handleSave()` (e.g. with `createBuilding()` and `updateBuilding()`) actually correct?**
  _`handleSave()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `handleDelete()` (e.g. with `deleteBuilding()` and `deleteFloor()`) actually correct?**
  _`handleDelete()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `getBuildings()` (e.g. with `loadInitialData()` and `loadBuildings()`) actually correct?**
  _`getBuildings()` has 4 INFERRED edges - model-reasoned connections that need verification._