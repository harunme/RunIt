"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, api } from "@/lib/api";
import { Rss, Brain, Send, Settings, FileText, ListTodo } from "lucide-react";
import { AuthCheck } from "@/components/AuthCheck";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    sources: 0,
    tasks: 0,
    providers: 0,
    publishers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.push("/login");
      return;
    }

    async function loadStats() {
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
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthCheck>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Sources" value={stats.sources} />
          <StatCard title="Tasks" value={stats.tasks} />
          <StatCard title="LLM Providers" value={stats.providers} />
          <StatCard title="Publishers" value={stats.publishers} />
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <ModuleCard href="/content" title="Content" icon={<FileText className="w-6 h-6" />} desc="View collected content" />
          <ModuleCard href="/sources" title="Sources" icon={<Rss className="w-6 h-6" />} desc="Configure data sources" />
          <ModuleCard href="/agents" title="Agents" icon={<Brain className="w-6 h-6" />} desc="AI processing strategies" />
          <ModuleCard href="/publishers" title="Publishers" icon={<Send className="w-6 h-6" />} desc="Social media platforms" />
          <ModuleCard href="/settings" title="Settings" icon={<Settings className="w-6 h-6" />} desc="System configuration" />
          <ModuleCard href="/tasks" title="Tasks" icon={<ListTodo className="w-6 h-6" />} desc="Task execution logs" />
        </div>
      </main>
    </AuthCheck>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ModuleCard({ href, title, icon, desc }: { href: string; title: string; icon: React.ReactNode; desc: string }) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow h-full">
        <div className="text-blue-600 mb-2">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </Link>
  );
}
