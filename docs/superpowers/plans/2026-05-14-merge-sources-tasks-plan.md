# Merge Data Sources and Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate `/tasks` page with a source detail page at `/sources/[id]` that shows source info plus all recent task executions for that source.

**Architecture:** Add source_id filter to the tasks API, create a source detail page that displays source info and a task table, update the source list page to make cards clickable, and remove the standalone tasks page and dashboard link.

**Tech Stack:** FastAPI, Next.js 15 (App Router), React

---

## Task 1: Add source_id Filter to Tasks API

**Files:**
- Modify: `backend/app/api/tasks.py`

- [ ] **Step 1: Modify the list_tasks endpoint to accept source_id parameter**

Open `backend/app/api/tasks.py` and update the `list_tasks` function signature and query:

```python
@router.get("", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    source_id: Optional[str] = Query(None, description="Filter by source ID"),
    db: AsyncSession = Depends(get_db)
):
    """List tasks with pagination and optional status/source filter."""
    # Build base query with eager loading of data_source
    base_query = select(Task).options(selectinload(Task.data_source))
    count_query = select(func.count()).select_from(Task)

    if status:
        base_query = base_query.where(Task.status == status)
        count_query = count_query.where(Task.status == status)

    if source_id:
        base_query = base_query.where(Task.source_id == source_id)
        count_query = count_query.where(Task.source_id == source_id)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Apply pagination
    offset = (page - 1) * page_size
    base_query = base_query.order_by(Task.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(base_query)
    tasks = result.scalars().all()

    # Transform tasks to include source_name
    task_responses = []
    for task in tasks:
        task_dict = {
            "id": task.id,
            "source_id": task.source_id,
            "source_name": task.data_source.name if task.data_source else None,
            "status": task.status,
            "raw_content": task.raw_content,
            "processed_content": task.processed_content,
            "images": task.images,
            "error_message": task.error_message,
            "created_at": task.created_at,
            "started_at": task.started_at,
            "completed_at": task.completed_at,
        }
        task_responses.append(TaskResponse(**task_dict))

    return TaskListResponse(
        items=task_responses,
        total=total,
        page=page,
        page_size=page_size,
    )
```

- [ ] **Step 2: Test the API change**

Run: `cd backend && python -c "from app.api.tasks import router; print('Import OK')"`
Expected: Import OK (no errors)

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/tasks.py
git commit -m "feat: add source_id filter to tasks API"
```

---

## Task 2: Update API Client with source_id Support

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Update the tasks API client**

Open `web/src/lib/api.ts` and find the tasks API section. Update the `list` method to accept `source_id`:

```typescript
tasks: {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    source_id?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));
    if (params?.status) searchParams.set('status', params.status);
    if (params?.source_id) searchParams.set('source_id', params.source_id);
    const query = searchParams.toString();
    const res = await fetch(`/api/tasks${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },
  // ... other methods
},
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat: add source_id parameter to tasks API client"
```

---

## Task 3: Create Source Detail Page with Task List

**Files:**
- Create: `web/src/app/sources/[id]/page.tsx`

- [ ] **Step 1: Create the source detail page**

Create `web/src/app/sources/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, Task, auth } from "@/lib/api";
import { ArrowLeft, Play, Trash2, Rss, Github, Twitter, Edit } from "lucide-react";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

interface Source {
  id: string;
  name: string;
  type: string;
  config: any;
  schedule: string;
  enabled: boolean;
  last_run_at: string | null;
}

export default function SourceDetailPage() {
  const params = useParams();
  const sourceId = params.id as string;
  const [source, setSource] = useState<Source | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!auth.isLoggedIn()) return;
    fetchSource();
  }, [sourceId]);

  useEffect(() => {
    if (!source) return;
    fetchTasks();
  }, [page, statusFilter, source]);

  if (!auth.isLoggedIn()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const fetchSource = async () => {
    try {
      const data = await api.sources.get(sourceId);
      setSource(data);
    } catch (e) {
      console.error("Failed to load source:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const data = await api.tasks.list({
        page,
        page_size: 20,
        status: statusFilter,
        source_id: sourceId,
      });
      setTasks(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this source?")) return;
    try {
      await api.sources.delete(sourceId);
      window.location.href = "/sources";
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleRun = async () => {
    try {
      await api.sources.run(sourceId);
      alert("Task triggered!");
      fetchTasks();
    } catch (e) {
      console.error("Failed to run:", e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "github": return <Github className="w-5 h-5" />;
      case "twitter": return <Twitter className="w-5 h-5" />;
      default: return <Rss className="w-5 h-5" />;
    }
  };

  const totalPages = Math.ceil(total / 20);

  const statusOptions = [
    { value: undefined, label: "全部" },
    { value: "pending", label: "待执行" },
    { value: "running", label: "执行中" },
    { value: "completed", label: "已完成" },
    { value: "failed", label: "失败" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!source) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Source not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/sources" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">{source.name}</h1>
            <span className={`px-2 py-1 text-xs rounded-full ${source.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
              {source.enabled ? "Active" : "Disabled"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Play className="w-4 h-4" />
              Run
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Source Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${source.enabled ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
              {getIcon(source.type)}
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{source.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Schedule</p>
                  <p className="font-medium">{source.schedule}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Run</p>
                  <p className="font-medium">
                    {source.last_run_at
                      ? new Date(source.last_run_at).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Tasks</p>
                  <p className="font-medium">{total}</p>
                </div>
              </div>
              {source.config?.url && (
                <p className="text-sm text-gray-400 mt-3 truncate max-w-md">
                  URL: {source.config.url}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Task History</h2>
            <div className="flex items-center gap-4">
              <select
                value={statusFilter || ""}
                onChange={(e) => {
                  setStatusFilter(e.target.value || undefined);
                  setPage(1);
                }}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value || ""}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchTasks}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                刷新
              </button>
            </div>
          </div>

          {tasksLoading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无任务</div>
          ) : (
            <>
              <TaskTable tasks={tasks} onTaskClick={setSelectedTask} />

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-gray-500">
                    第 {page} 页，共 {totalPages} 页，共 {total} 条
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/sources/[id]/page.tsx
git commit -m "feat: add source detail page with task history"
```

---

## Task 4: Update Source List Page - Make Cards Clickable

**Files:**
- Modify: `web/src/app/sources/page.tsx`

- [ ] **Step 1: Update the source list page to make cards clickable**

Replace the source list page content. Make the source card a Link wrapper, remove the Run button (moved to detail page), and add cursor-pointer styling:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Plus, Trash2, Rss, Github, Twitter } from "lucide-react";
import { AuthCheck } from "@/components/AuthCheck";

interface Source {
  id: string;
  name: string;
  type: string;
  config: any;
  schedule: string;
  enabled: boolean;
  last_run_at: string | null;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.sources.list();
        setSources(data);
      } catch (e) {
        console.error("Failed to load:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this source?")) return;
    try {
      await api.sources.delete(id);
      setSources(sources.filter((s) => s.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "github": return <Github className="w-5 h-5" />;
      case "twitter": return <Twitter className="w-5 h-5" />;
      default: return <Rss className="w-5 h-5" />;
    }
  };

  return (
    <AuthCheck>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold">Data Sources</h1>
          </div>
          <Link href="/sources/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Source
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : sources.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No data sources configured. Click &quot;Add Source&quot; to create one.
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((source) => (
              <Link key={source.id} href={`/sources/${source.id}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${source.enabled ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                        {getIcon(source.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{source.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Type: {source.type} • Schedule: {source.schedule}
                        </p>
                        {source.config?.url && (
                          <p className="text-sm text-gray-400 mt-1 truncate max-w-md">{source.config.url}</p>
                        )}
                        {source.last_run_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Last run: {new Date(source.last_run_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                      <button onClick={(e) => handleDelete(e, source.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className={`px-2 py-1 text-xs rounded-full ${source.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {source.enabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </AuthCheck>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/sources/page.tsx
git commit -m "refactor: make source cards clickable to detail page"
```

---

## Task 5: Remove Tasks Page from Dashboard

**Files:**
- Modify: `web/src/app/page.tsx`

- [ ] **Step 1: Remove the Tasks module card from the dashboard**

Open `web/src/app/page.tsx` and remove the line with `<ModuleCard href="/tasks" ... />`.

Remove this line (around line 77):
```tsx
<ModuleCard href="/tasks" title="Tasks" icon={<ListTodo className="w-6 h-6" />} desc="Task execution logs" />
```

Also remove the `ListTodo` import if it's no longer used:
```tsx
// Before: import { Rss, Brain, Send, Settings, FileText, ListTodo } from "lucide-react";
// After: import { Rss, Brain, Send, Settings, FileText } from "lucide-react";
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/page.tsx
git commit -m "refactor: remove Tasks module from dashboard"
```

---

## Task 6: Delete Tasks Page

**Files:**
- Delete: `web/src/app/tasks/page.tsx`

- [ ] **Step 1: Remove the tasks page directory**

```bash
rm -rf web/src/app/tasks
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove standalone tasks page"
```

---

## Task 7: Final Verification

- [ ] **Step 1: Verify the build works**

Run: `cd web && npm run build`
Expected: Build completes without errors

- [ ] **Step 2: Verify all pages work**

Navigate to:
- `/sources` - should show source list with clickable cards
- `/sources/[id]` - should show source detail with task history
- `/tasks` - should return 404 (page removed)

- [ ] **Step 3: Commit any remaining changes**

---

## Summary of Changes

| Task | Files | Change |
|------|-------|--------|
| 1 | `backend/app/api/tasks.py` | Add source_id filter |
| 2 | `web/src/lib/api.ts` | Add source_id to API client |
| 3 | `web/src/app/sources/[id]/page.tsx` | Create source detail page |
| 4 | `web/src/app/sources/page.tsx` | Make cards clickable |
| 5 | `web/src/app/page.tsx` | Remove Tasks from dashboard |
| 6 | `web/src/app/tasks/page.tsx` | Delete tasks page |
