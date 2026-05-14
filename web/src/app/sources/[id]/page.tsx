"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Play, Trash2, ExternalLink } from "lucide-react";
import { api, Task, auth } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ListItem } from "@/components/features/ListItem";
import { SourceForm } from "@/components/SourceForm";
import { Drawer } from "@/components/ui/Drawer";
import { AuthCheck } from "@/components/AuthCheck";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

interface Source {
  id: string;
  name: string;
  type: string;
  config: any;
  schedule: string;
  enabled: boolean;
  last_run_at: string | null;
  created_at: string;
  agent_id?: string;
}

export default function SourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sourceId = params.id as string;

  const [source, setSource] = useState<Source | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);

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
  }, [source]);

  if (!auth.isLoggedIn()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
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
        page: 1,
        page_size: 5,
        source_id: sourceId,
      });
      setTasks(data.items);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      await api.sources.run(sourceId);
      // Refresh tasks after running
      setTimeout(() => fetchTasks(), 1000);
    } catch (e) {
      console.error("Failed to run:", e);
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.sources.delete(sourceId);
      router.push("/sources");
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleEditSuccess = () => {
    setDrawerOpen(false);
    fetchSource();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("zh-CN");
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      </AppShell>
    );
  }

  if (!source) {
    return (
      <AuthCheck>
        <AppShell>
          <div className="mb-6">
            <Link href="/sources" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Sources
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Source not found</p>
          </div>
        </AppShell>
      </AuthCheck>
    );
  }

  return (
    <AuthCheck>
      <AppShell>
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/sources" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Sources
          </Link>
        </div>

        {/* Page Header */}
        <PageHeader
          title={source.name}
          subtitle={`${source.type} • ${source.schedule}`}
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => setDrawerOpen(true)}>
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="primary" size="sm" onClick={handleRun} loading={running}>
                <Play className="w-4 h-4" />
                Run Now
              </Button>
              <Button variant="danger" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </>
          }
        />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configuration Card */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Status</span>
                    <Badge variant={source.enabled ? "success" : "neutral"}>
                      {source.enabled ? "Active" : "Disabled"}
                    </Badge>
                  </div>

                  {/* Type */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Type</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{source.type}</span>
                  </div>

                  {/* URL (for RSS) */}
                  {source.config?.url && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm text-gray-500">URL</span>
                      <a
                        href={source.config.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <span className="truncate max-w-[200px]">{source.config.url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Schedule */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Schedule</span>
                    <span className="text-sm font-medium text-gray-900 font-mono">{source.schedule}</span>
                  </div>

                  {/* Last Run */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">Last Run</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(source.last_run_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Tasks Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No tasks yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <ListItem
                        key={task.id}
                        icon={CheckCircle2}
                        iconColor={
                          task.status === "completed" ? "text-green-600" :
                          task.status === "running" ? "text-blue-600" :
                          task.status === "failed" ? "text-red-600" :
                          "text-yellow-600"
                        }
                        title={task.source_name || "Task"}
                        subtitle={formatDate(task.created_at)}
                        badge={task.status}
                        onClick={() => setSelectedTask(task)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Created */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(source.created_at)}</span>
                  </div>

                  {/* ID */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-500">ID</span>
                    <span className="text-sm font-mono text-gray-600 truncate max-w-[160px]" title={source.id}>
                      {source.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Drawer */}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Edit Source"
        >
          <SourceForm
            sourceId={source.id}
            initialData={{
              name: source.name,
              type: source.type,
              config: source.config,
              schedule: source.schedule,
              enabled: source.enabled,
              agent_id: source.agent_id,
            }}
            onSuccess={handleEditSuccess}
          />
        </Drawer>

        {/* Delete Confirmation */}
        <Drawer
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          title="Delete Source"
          width={400}
        >
          <div className="space-y-6">
            <p className="text-gray-600">
              Are you sure you want to delete this source? This action cannot be undone and all associated task history will be lost.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Drawer>

        {/* Task Detail Modal */}
        {selectedTask && (
          <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
      </AppShell>
    </AuthCheck>
  );
}
