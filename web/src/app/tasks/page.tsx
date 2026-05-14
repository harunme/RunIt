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
