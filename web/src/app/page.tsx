"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/features/StatCard";
import { ModuleCard } from "@/components/features/ModuleCard";
import { ActivityFeed, type Activity } from "@/components/features/ActivityFeed";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AuthCheck } from "@/components/AuthCheck";
import { api } from "@/lib/api";
import { Rss, Brain, Send, Settings, FileText, Layers, Zap, BookOpen } from "lucide-react";

interface DashboardStats {
  sources: number;
  tasks: number;
  providers: number;
  publishers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ sources: 0, tasks: 0, providers: 0, publishers: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sources, tasks, providers, publishers] = await Promise.all([
          api.sources.list().catch(() => []),
          api.tasks.list({ page_size: 1 }).catch(() => ({ total: 0 })),
          api.llm.list().catch(() => []),
          api.publishers.list().catch(() => []),
        ]);

        setStats({
          sources: Array.isArray(sources) ? sources.length : 0,
          tasks: tasks?.total || 0,
          providers: Array.isArray(providers) ? providers.length : 0,
          publishers: Array.isArray(publishers) ? publishers.length : 0,
        });

        // Generate activities from recent data
        const newActivities: Activity[] = [];
        if (Array.isArray(sources) && sources.length > 0) {
          newActivities.push({
            id: "1",
            type: "success",
            title: "Sources connected",
            description: `${sources.length} data sources configured`,
            timestamp: "Just now",
          });
        }
        if (tasks?.total > 0) {
          newActivities.push({
            id: "2",
            type: "info",
            title: "Tasks running",
            description: `${tasks.total} tasks in queue`,
            timestamp: "Active",
          });
        }
        setActivities(newActivities.length > 0 ? newActivities : [
          { id: "1", type: "info", title: "Welcome to RunIt", description: "Get started by adding your first source", timestamp: "Today" }
        ]);
      } catch (e) {
        console.error("Failed to load dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader
          title="Dashboard"
          subtitle="Overview of your RunIt workspace"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            title="Sources"
            value={stats.sources}
            icon={Rss}
            delay={0}
          />
          <StatCard
            title="Tasks"
            value={stats.tasks}
            icon={Layers}
            delay={0.1}
          />
          <StatCard
            title="Providers"
            value={stats.providers}
            icon={Zap}
            delay={0.2}
          />
          <StatCard
            title="Publishers"
            value={stats.publishers}
            icon={Send}
            delay={0.3}
          />
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          <ModuleCard
            title="Content"
            description="View collected content"
            icon={FileText}
            href="/content"
            color="blue"
            delay={0}
          />
          <ModuleCard
            title="Sources"
            description="Configure data sources"
            icon={Rss}
            href="/sources"
            color="green"
            delay={0.1}
          />
          <ModuleCard
            title="Agents"
            description="AI processing strategies"
            icon={Brain}
            href="/agents"
            color="purple"
            delay={0.2}
          />
          <ModuleCard
            title="Publishers"
            description="Social media platforms"
            icon={Send}
            href="/publishers"
            color="orange"
            delay={0.3}
          />
          <ModuleCard
            title="Settings"
            description="System configuration"
            icon={Settings}
            href="/settings"
            color="pink"
            delay={0.4}
          />
        </div>

        {/* Recent Activity */}
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activities} />
          </CardContent>
        </Card>
      </AppShell>
    </AuthCheck>
  );
}
