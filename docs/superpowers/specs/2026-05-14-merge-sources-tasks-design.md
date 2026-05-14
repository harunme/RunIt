# Design: Merge Data Sources and Tasks

**Date:** 2026-05-14
**Status:** Approved

## Overview

Replace the separate `/tasks` page with a **source detail page** at `/sources/[id]` that shows source info plus all recent task executions for that source.

## Backend Changes

### API Enhancement

Extend `GET /api/tasks` to accept optional `source_id` query parameter.

**Endpoint:** `GET /api/tasks`

**New Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `source_id` | string | No | Filter tasks by this source ID |

**Behavior:**
- When `source_id` is provided, return only tasks belonging to that source
- When `source_id` is omitted, return all tasks (current behavior)
- Pagination and status filter work the same regardless

## Frontend Changes

### 1. Create Source Detail Page

**File:** `web/src/app/sources/[id]/page.tsx`

**Features:**
- Header with back link to sources list
- Source info card: name, type, schedule, enabled status, last run time
- Paginated task table (reuses `TaskTable` component)
- Task detail modal on click (reuses `TaskDetailModal` component)
- Actions: Run source manually, Edit source, Delete source

**URL:** `/sources/[id]` where `[id]` is the source UUID

### 2. Update Source List Page

**File:** `web/src/app/sources/page.tsx`

**Changes:**
- Make source cards clickable (link to `/sources/[id]`)
- Remove "Run" button from cards (moved to detail page)
- Keep Delete button
- Add cursor-pointer styling to indicate clickability

### 3. Remove Tasks Page

**Delete:** `web/src/app/tasks/` directory entirely

**Files to remove:**
- `web/src/app/tasks/page.tsx`
- Any related task page files

### 4. Navigation Update

- Remove Tasks link from any navigation component (sidebar, navbar)
- Users access tasks through source detail pages

## Data Flow

```
Source List (/sources)
    ↓ (click source card)
Source Detail (/sources/[id])
    ↓
Task Table (filtered by source_id)
    ↓ (click task row)
Task Detail Modal
```

## Component Reuse

| Component | Location | Usage |
|-----------|----------|-------|
| TaskTable | `@/components/tasks/TaskTable` | Source detail page |
| TaskDetailModal | `@/components/tasks/TaskDetailModal` | Source detail page |

## Migration Notes

- No database schema changes required
- Existing tasks remain associated with their sources
- API changes are backward compatible (source_id is optional)
