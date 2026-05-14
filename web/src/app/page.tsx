"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Activity, Database, Rss, Settings } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    sources: 0,
    tasks: 0,
    providers: 0,
    publishers: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [sources, tasks, providers, publishers] = await Promise.all([
          api.sources.list(),
          api.tasks.list({ page_size: 1 }),
          api.llm.list(),
          api.publishers.list(),
        ]);
        setStats({
          sources: sources.length,
          tasks: tasks.total,
          providers: providers.length,
          publishers: publishers.length,
        });
      } catch (e) {
        console.error("Failed to load stats:", e);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">RunIt Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Data Sources"
          value={stats.sources}
          icon={<Rss className="w-6 h-6" />}
        />
        <StatCard
          title="Tasks"
          value={stats.tasks}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="LLM Providers"
          value={stats.providers}
          icon={<Database className="w-6 h-6" />}
        />
        <StatCard
          title="Publishers"
          value={stats.publishers}
          icon={<Settings className="w-6 h-6" />}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </div>
  );
}
