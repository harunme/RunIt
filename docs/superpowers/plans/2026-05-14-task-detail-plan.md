# 任务详情页实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 RunIt 添加独立的任务列表页，支持点击查看任务详情、日志和关联内容。

**Architecture:** 后端新增 TaskLog 模型和 API 端点，执行器写入执行日志；前端新增 /tasks 页面和任务详情弹窗组件（3个 Tab）。

**Tech Stack:** Python/FastAPI (后端), Next.js/TypeScript (前端), SQLAlchemy (ORM)

---

## 文件结构

```
backend/
├── app/
│   ├── models/
│   │   └── task.py              # 新增 TaskLog 模型
│   ├── schemas/
│   │   └── task.py             # 新增 TaskLogSchema
│   ├── api/
│   │   └── tasks.py            # 新增 logs/contents 端点
│   └── worker/
│       └── executor.py          # 写入执行日志

web/src/
├── app/
│   └── tasks/
│       └── page.tsx             # 新增 任务列表页
├── components/
│   └── tasks/
│       ├── TaskTable.tsx        # 新增 任务表格
│       ├── TaskDetailModal.tsx  # 新增 详情弹窗
│       └── TaskLogViewer.tsx    # 新增 日志查看器
└── lib/
    └── api.ts                   # 新增 API 方法
```

---

## Task 1: 后端 - 添加 TaskLog 模型

**Files:**
- Modify: `backend/app/models/task.py`

- [ ] **Step 1: 添加 TaskLog 模型**

在 `backend/app/models/task.py` 文件末尾添加 TaskLog 类：

```python
class TaskLog(Base):
    __tablename__ = "task_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    task_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tasks.id"),
        nullable=False,
        index=True
    )
    level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="INFO"
    )  # INFO, WARNING, ERROR
    message: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    # Relationship
    task: Mapped["Task"] = relationship(
        "Task",
        backref="logs"
    )
```

在 Task 类中添加日志关系（如果不存在）：

```python
# 在 Task.contents 关系之后添加
logs: Mapped[List["TaskLog"]] = relationship(
    "TaskLog",
    back_populates="task",
    order_by="TaskLog.created_at"
)
```

- [ ] **Step 2: 创建数据库迁移**

Run: `cd /Users/binwang/Working/github/RunIt/backend && alembic revision --autogenerate -m "add task_logs table"`
Expected: 生成迁移文件 `versions/xxx_add_task_logs_table.py`

- [ ] **Step 3: 执行迁移**

Run: `cd /Users/binwang/Working/github/RunIt/backend && alembic upgrade head`
Expected: `Running migration`

- [ ] **Step 4: 提交**

```bash
git add backend/app/models/task.py backend/alembic/versions/
git commit -m "feat: add TaskLog model for task execution logging"
```

---

## Task 2: 后端 - 添加 TaskLog Schema

**Files:**
- Modify: `backend/app/schemas/task.py`

- [ ] **Step 1: 添加 TaskLogResponse Schema**

在 `backend/app/schemas/task.py` 文件中添加：

```python
class TaskLogResponse(BaseModel):
    """Schema for TaskLog response."""
    id: str
    task_id: str
    level: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskLogListResponse(BaseModel):
    """Schema for paginated TaskLog list response."""
    items: List[TaskLogResponse]
    total: int
    page: int
    page_size: int
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/schemas/task.py
git commit -m "feat: add TaskLog schema"
```

---

## Task 3: 后端 - 添加 Task Logs API 端点

**Files:**
- Modify: `backend/app/api/tasks.py`

- [ ] **Step 1: 添加日志和内容端点**

在 `backend/app/api/tasks.py` 文件中添加新的导入和端点：

```python
from app.models.task import Task, TaskLog
from app.schemas.task import TaskLogResponse, TaskLogListResponse
from app.models.content import Content
```

在 `retry_task` 端点之前添加：

```python
@router.get("/{task_id}/logs", response_model=TaskLogListResponse)
async def get_task_logs(
    task_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    level: Optional[str] = Query(None, description="Filter by level (INFO, WARNING, ERROR)"),
    db: AsyncSession = Depends(get_db)
):
    """Get logs for a specific task."""
    # Verify task exists
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    if not task_result.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")

    # Build query
    base_query = select(TaskLog).where(TaskLog.task_id == task_id)
    count_query = select(func.count()).select_from(TaskLog).where(TaskLog.task_id == task_id)

    if level:
        base_query = base_query.where(TaskLog.level == level)
        count_query = count_query.where(TaskLog.level == level)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Apply pagination
    offset = (page - 1) * page_size
    base_query = base_query.order_by(TaskLog.created_at.asc()).offset(offset).limit(page_size)

    result = await db.execute(base_query)
    logs = result.scalars().all()

    return TaskLogListResponse(
        items=logs,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{task_id}/contents")
async def get_task_contents(
    task_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """Get contents associated with a specific task."""
    # Verify task exists
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    if not task_result.scalar_one_or_none():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")

    # Count total
    count_query = select(func.count()).select_from(Content).where(Content.task_id == task_id)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Get paginated contents
    offset = (page - 1) * page_size
    query = (
        select(Content)
        .where(Content.task_id == task_id)
        .order_by(Content.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    contents = result.scalars().all()

    return {
        "items": contents,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
```

- [ ] **Step 2: 测试 API 端点**

Run: `cd /Users/binwang/Working/github/RunIt/backend && uvicorn app.main:app --reload`
Expected: 服务启动成功，无错误

- [ ] **Step 3: 提交**

```bash
git add backend/app/api/tasks.py
git commit -m "feat: add task logs and contents API endpoints"
```

---

## Task 4: 后端 - 修改执行器写入日志

**Files:**
- Modify: `backend/app/worker/executor.py`

- [ ] **Step 1: 添加日志写入方法**

在 `executor.py` 中添加辅助方法：

```python
async def _log_event(self, task_id: str, level: str, message: str, db: AsyncSession):
    """Write a log event for a task."""
    from app.models.task import TaskLog
    log = TaskLog(
        task_id=task_id,
        level=level,
        message=message
    )
    db.add(log)
    # Don't commit here, will be committed with task update
```

- [ ] **Step 2: 在执行流程中写入日志**

修改 `execute_source` 方法，在关键步骤添加日志：

```python
async def execute_source(self, source_id: str):
    async with async_session_maker() as db:
        session: AsyncSession = db

        result = await session.execute(select(DataSource).where(DataSource.id == source_id))
        source = result.scalar_one_or_none()

        if not source or not source.enabled:
            return

        task = Task(
            source_id=source_id,
            status="running",
            started_at=datetime.utcnow(),
        )
        session.add(task)
        await session.commit()
        await session.refresh(task)

        try:
            await self._log_event(task.id, "INFO", f"开始执行数据源: {source.name}", session)

            source_client = self.sources.get(source.type)
            if not source_client:
                raise ValueError(f"Unknown source type: {source.type}")

            await self._log_event(task.id, "INFO", "正在获取配置...", session)

            config = json.loads(source.config) if isinstance(source.config, str) else source.config
            items = await source_client.fetch(config)

            await self._log_event(task.id, "INFO", f"获取到 {len(items)} 个条目", session)

            for i, item in enumerate(items):
                await self._log_event(task.id, "INFO", f"处理第 {i+1}/{len(items)} 个条目: {item.title}", session)
                await self._process_item(item, source, task, session)

            task.status = "completed"
            task.completed_at = datetime.utcnow()
            source.last_run_at = datetime.utcnow()
            await self._log_event(task.id, "INFO", f"任务完成，成功处理 {len(items)} 个条目", session)

            await session.commit()

        except Exception as e:
            task.status = "failed"
            task.error_message = str(e)
            task.completed_at = datetime.utcnow()
            await self._log_event(task.id, "ERROR", f"任务失败: {str(e)}", session)
            await session.commit()
```

同时在 `_process_item` 方法中添加日志：

```python
async def _process_item(self, item, source, task, db):
    session: AsyncSession = db

    task.raw_content = item.content

    metadata = {
        "title": item.title,
        "url": item.url,
        "source": source.name,
        "source_type": source.type,
    }

    self.storage.save(
        content=item.content,
        metadata=metadata,
        format="md"
    )

    self.backup.backup(
        content=item.content,
        filename=f"{source.type}_{item.id}.md",
        metadata=metadata
    )

    content_record = Content(
        task_id=task.id,
        source_id=source.id,
        title=item.title,
        content=item.content,
        url=item.url,
        author=item.author,
        published_at=item.published_at,
        extra_metadata=json.dumps(item.metadata) if item.metadata else None,
    )
    session.add(content_record)

    await self._log_event(task.id, "INFO", f"已保存内容: {item.title}", session)
```

- [ ] **Step 2: 提交**

```bash
git add backend/app/worker/executor.py
git commit -m "feat: add logging to task executor"
```

---

## Task 5: 前端 - 添加 API 方法

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: 添加任务日志和内容 API 方法**

在 `api.ts` 的 `tasks` 对象中添加：

```typescript
tasks: {
  list: (params?: { page?: number; page_size?: number; status?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchAPI(`/api/tasks${query ? `?${query}` : ""}`);
  },
  get: (id: string) => fetchAPI(`/api/tasks/${id}`),
  retry: (id: string) => fetchAPI(`/api/tasks/${id}/retry`, { method: "POST" }),
  getLogs: (id: string, params?: { page?: number; page_size?: number; level?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchAPI(`/api/tasks/${id}/logs${query ? `?${query}` : ""}`);
  },
  getContents: (id: string, params?: { page?: number; page_size?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchAPI(`/api/tasks/${id}/contents${query ? `?${query}` : ""}`);
  },
},
```

- [ ] **Step 2: 添加类型定义**

在 `api.ts` 文件顶部添加：

```typescript
export interface TaskLog {
  id: string;
  task_id: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  created_at: string;
}

export interface TaskContent {
  id: string;
  task_id: string;
  source_id: string;
  title: string;
  content: string;
  url: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
}
```

- [ ] **Step 3: 提交**

```bash
git add web/src/lib/api.ts
git commit -m "feat: add task logs and contents API methods"
```

---

## Task 6: 前端 - 创建 TaskTable 组件

**Files:**
- Create: `web/src/components/tasks/TaskTable.tsx`

- [ ] **Step 1: 创建 TaskTable 组件**

```typescript
"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Task {
  id: string;
  source_id: string;
  status: "pending" | "running" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface TaskTableProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export function TaskTable({ tasks, onTaskClick }: TaskTableProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return "-";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              创建时间
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              开始时间
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              耗时
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              错误信息
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status]}`}
                >
                  {task.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDate(task.created_at)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDate(task.started_at)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {formatDuration(task.started_at, task.completed_at)}
              </td>
              <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">
                {task.error_message || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add web/src/components/tasks/TaskTable.tsx
git commit -m "feat: add TaskTable component"
```

---

## Task 7: 前端 - 创建 TaskLogViewer 组件

**Files:**
- Create: `web/src/components/tasks/TaskLogViewer.tsx`

- [ ] **Step 1: 创建 TaskLogViewer 组件**

```typescript
"use client";

import { useState, useEffect } from "react";
import { api, TaskLog } from "@/lib/api";

interface TaskLogViewerProps {
  taskId: string;
}

const levelColors = {
  INFO: "text-blue-600",
  WARNING: "text-yellow-600",
  ERROR: "text-red-600",
};

export function TaskLogViewer({ taskId }: TaskLogViewerProps) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchLogs();
  }, [taskId, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.tasks.getLogs(taskId, { page, page_size: pageSize });
      setLogs(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto font-mono text-sm">
        {loading ? (
          <div className="p-4 text-gray-500">加载中...</div>
        ) : logs.length === 0 ? (
          <div className="p-4 text-gray-500">暂无日志</div>
        ) : (
          <div className="p-2">
            {logs.map((log) => (
              <div key={log.id} className="py-1 flex gap-2">
                <span className="text-gray-400 shrink-0">
                  {formatTime(log.created_at)}
                </span>
                <span className={`shrink-0 font-medium ${levelColors[log.level]}`}>
                  [{log.level}]
                </span>
                <span className="text-gray-700 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
          <span className="text-sm text-gray-500">
            第 {page} 页，共 {totalPages} 页
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
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add web/src/components/tasks/TaskLogViewer.tsx
git commit -m "feat: add TaskLogViewer component"
```

---

## Task 8: 前端 - 创建 TaskDetailModal 组件

**Files:**
- Create: `web/src/components/tasks/TaskDetailModal.tsx`

- [ ] **Step 1: 创建 TaskDetailModal 组件**

```typescript
"use client";

import { useState, useEffect } from "react";
import { api, TaskContent } from "@/lib/api";
import { TaskLogViewer } from "./TaskLogViewer";

interface Task {
  id: string;
  source_id: string;
  status: "pending" | "running" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

type TabType = "info" | "logs" | "contents";

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [contents, setContents] = useState<TaskContent[]>([]);
  const [contentsPage, setContentsPage] = useState(1);
  const [contentsTotal, setContentsTotal] = useState(0);
  const [loadingContents, setLoadingContents] = useState(false);

  useEffect(() => {
    if (activeTab === "contents") {
      fetchContents();
    }
  }, [activeTab, contentsPage]);

  const fetchContents = async () => {
    setLoadingContents(true);
    try {
      const data = await api.tasks.getContents(task.id, { page: contentsPage, page_size: 10 });
      setContents(data.items);
      setContentsTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch contents:", error);
    } finally {
      setLoadingContents(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return "-";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} 分 ${seconds % 60} 秒`;
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "info", label: "基本信息" },
    { id: "logs", label: "执行日志" },
    { id: "contents", label: "关联内容" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">任务详情</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-b">
          <nav className="flex px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "info" && (
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">状态</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 py-1 text-sm font-medium rounded-full ${
                      task.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : task.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : task.status === "running"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {task.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">耗时</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDuration(task.started_at, task.completed_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(task.created_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">开始时间</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(task.started_at)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">完成时间</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(task.completed_at)}</dd>
              </div>
              {task.error_message && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-red-500">错误信息</dt>
                  <dd className="mt-1 text-sm text-red-700 bg-red-50 p-3 rounded">
                    {task.error_message}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {activeTab === "logs" && <TaskLogViewer taskId={task.id} />}

          {activeTab === "contents" && (
            <div>
              {loadingContents ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : contents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无关联内容</div>
              ) : (
                <>
                  <div className="space-y-3">
                    {contents.map((content) => (
                      <div key={content.id} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900">{content.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {content.author && <span>作者: {content.author}</span>}
                          {content.published_at && (
                            <span className="ml-2">
                              发布于: {new Date(content.published_at).toLocaleDateString("zh-CN")}
                            </span>
                          )}
                        </p>
                        {content.url && (
                          <a
                            href={content.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                          >
                            查看原文
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                  {Math.ceil(contentsTotal / 10) > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <button
                        onClick={() => setContentsPage((p) => Math.max(1, p - 1))}
                        disabled={contentsPage === 1}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      >
                        上一页
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-500">
                        第 {contentsPage} 页，共 {Math.ceil(contentsTotal / 10)} 页
                      </span>
                      <button
                        onClick={() => setContentsPage((p) => Math.min(Math.ceil(contentsTotal / 10), p + 1))}
                        disabled={contentsPage === Math.ceil(contentsTotal / 10)}
                        className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add web/src/components/tasks/TaskDetailModal.tsx
git commit -m "feat: add TaskDetailModal component with tabs"
```

---

## Task 9: 前端 - 创建 TasksPage 页面

**Files:**
- Create: `web/src/app/tasks/page.tsx`

- [ ] **Step 1: 创建 TasksPage 页面**

```typescript
"use client";

import { useState, useEffect } from "react";
import { api, Task } from "@/lib/api";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [page, statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.tasks.list({
        page,
        page_size: 20,
        status: statusFilter,
      });
      setTasks(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">任务列表</h1>
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

        <div className="bg-white rounded-lg shadow">
          {loading ? (
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

- [ ] **Step 2: 提交**

```bash
git add web/src/app/tasks/page.tsx
git commit -m "feat: add tasks page"
```

---

## Task 10: 前端 - 添加导航链接

**Files:**
- Modify: 查找并修改导航组件（可能需要查看现有导航实现）

- [ ] **Step 1: 查找导航组件**

查找项目中处理导航的组件：

```bash
grep -r "sidebar\|nav\|navigation\|menu" web/src --include="*.tsx" -l
```

- [ ] **Step 2: 添加 Tasks 链接**

根据项目结构，在导航栏或侧边栏中添加指向 `/tasks` 的链接。参考 `sources/page.tsx` 或其他页面的导航模式。

- [ ] **Step 3: 提交**

```bash
git add <修改的文件>
git commit -m "feat: add navigation link to tasks page"
```

---

## 自检清单

- [ ] Spec 覆盖检查：每个 spec 章节都能找到对应的任务
- [ ] 占位符扫描：无 TBD、TODO、未完成部分
- [ ] 类型一致性：Task、TaskLog、TaskContent 类型定义一致

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-14-task-detail-plan.md`**

**两个执行选项：**

**1. Subagent-Driven (推荐)** - 我按任务逐一分派 subagent 执行，任务间进行审查，快速迭代

**2. Inline Execution** - 在当前 session 执行任务，使用 executing-plans 技能，批量执行带检查点

**选择哪种方式？**
