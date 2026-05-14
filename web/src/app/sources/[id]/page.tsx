"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Task, auth } from "@/lib/api";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { ArrowLeft, Play, Trash2, Rss, Github, Twitter } from "lucide-react";
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

export default function SourceDetailPage() {
  const params = useParams();
  const router = useRouter();
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
    if (!auth.isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchSource();
  }, [sourceId, router]);

  useEffect(() => {
    if (source) {
      fetchTasks();
    }
  }, [page, statusFilter, source]);

  if (!auth.isLoggedIn()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const fetchSource = async () => {
    setLoading(true);
    try {
      const data = await api.sources.get(sourceId);
      setSource(data);
    } catch (error) {
      console.error("Failed to fetch source:", error);
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

  const handleRun = async () => {
    try {
      await api.sources.run(sourceId);
      alert("Task triggered!");
    } catch (e) {
      console.error("Failed to run:", e);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this source?")) return;
    try {
      await api.sources.delete(sourceId);
      router.push("/sources");
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "github":
        return <Github className="w-5 h-5" />;
      case "twitter":
        return <Twitter className="w-5 h-5" />;
      default:
        return <Rss className="w-5 h-5" />;
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
      <AuthCheck>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/sources" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Source not found</h1>
          </div>
        </main>
      </AuthCheck>
    );
  }

  return (
    <AuthCheck>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/sources" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Source Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Play className="w-4 h-4" />
              Run
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${source.enabled ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
              {getIcon(source.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold">{source.name}</h2>
                <span className={`px-2 py-1 text-xs rounded-full ${source.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {source.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Type:</span> {source.type}
                </div>
                <div>
                  <span className="font-medium">Schedule:</span> {source.schedule}
                </div>
                {source.config?.url && (
                  <div className="col-span-2">
                    <span className="font-medium">URL:</span>{" "}
                    <span className="text-gray-400 break-all">{source.config.url}</span>
                  </div>
                )}
                {source.last_run_at && (
                  <div className="col-span-2">
                    <span className="font-medium">Last Run:</span>{" "}
                    {new Date(source.last_run_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Task History</h2>
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
      </main>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </AuthCheck>
  );
}
