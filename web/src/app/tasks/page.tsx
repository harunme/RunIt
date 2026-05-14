"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuthCheck } from "@/components/AuthCheck";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ListItem } from "@/components/features/ListItem";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface Task {
  id: string;
  source_id: string;
  source_name: string | null;
  status: "pending" | "running" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadTasks() {
      setLoading(true);
      try {
        const data = await api.tasks.list({ page, page_size: 20 });
        setTasks(data.items);
        setTotal(data.total);
      } catch (e) {
        console.error("Failed to load tasks:", e);
      }
      setLoading(false);
    }
    loadTasks();
  }, [page]);

  const handleRetry = async (id: string) => {
    try {
      await api.tasks.retry(id);
      // Reload tasks
      const data = await api.tasks.list({ page, page_size: 20 });
      setTasks(data.items);
    } catch (e) {
      console.error("Failed to retry task:", e);
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-gray-400" />;
      case "running":
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="neutral">Pending</Badge>;
      case "running":
        return <Badge variant="primary">Running</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "failed":
        return <Badge variant="error">Failed</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  const truncate = (text: string | null, max: number = 60) => {
    if (!text) return "";
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader
          title="Tasks"
          subtitle={`${total} total tasks`}
        />

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <ListItemSkeleton key={i} avatar={true} lines={2} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-12 h-12" />}
            title="No tasks yet"
            description="Run a data source to create tasks that fetch content."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4 -mx-4 px-4">
                <div className="p-2 rounded-lg bg-zinc-100">
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {task.source_name || "Unknown Source"}
                    </p>
                    {getStatusBadge(task.status)}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">
                    {truncate(task.error_message, 60) || `Created: ${formatDate(task.created_at)}`}
                  </p>
                </div>
                {task.status === "failed" && (
                  <button
                    onClick={() => handleRetry(task.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm bg-white rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={tasks.length < 20}
              className="px-4 py-2 text-sm bg-white rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </AppShell>
    </AuthCheck>
  );
}
