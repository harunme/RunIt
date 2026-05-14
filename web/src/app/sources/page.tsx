"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
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
    } catch (err) {
      console.error("Failed to delete:", err);
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
              <ArrowLeft className="w-5 h-5" />
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
              <Link key={source.id} href={`/sources/${source.id}`} className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
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
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleDelete(e, source.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className={`px-2 py-1 text-xs rounded-full ${source.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {source.enabled ? "Active" : "Disabled"}
                    </span>
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
