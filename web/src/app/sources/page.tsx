"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { ListItem } from "@/components/features/ListItem";
import { SourceForm } from "@/components/SourceForm";
import { Drawer } from "@/components/ui/Drawer";
import { AuthCheck } from "@/components/AuthCheck";
import { Rss, Github, Twitter, Plus, Database } from "lucide-react";

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await api.sources.list();
      setSources(data);
    } catch (e) {
      console.error("Failed to load sources:", e);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSourceCreated = () => {
    setDrawerOpen(false);
    loadSources();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "github":
        return Github;
      case "twitter":
        return Twitter;
      default:
        return Rss;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "github":
        return "text-zinc-900 dark:text-zinc-100";
      case "twitter":
        return "text-sky-500";
      default:
        return "text-orange-500";
    }
  };

  const getSubtitle = (source: Source) => {
    const parts = [];
    parts.push(source.type.charAt(0).toUpperCase() + source.type.slice(1));
    parts.push(source.schedule);
    if (source.config?.url) {
      parts.push(source.config.url);
    }
    return parts.join(" | ");
  };

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader
          title="Sources"
          subtitle="Configure data sources for your feeds"
          actions={
            <Button onClick={() => setDrawerOpen(true)} size="md">
              <Plus className="w-4 h-4" />
              Add Source
            </Button>
          }
        />

        {loading ? (
          <Card padding="none">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {[1, 2, 3].map((i) => (
                <ListItemSkeleton key={i} avatar={true} lines={2} />
              ))}
            </div>
          </Card>
        ) : sources.length === 0 ? (
          <EmptyState
            icon={<Database className="w-12 h-12" />}
            title="No data sources"
            description="Configure your first data source to start aggregating content from RSS feeds, GitHub, or Twitter."
            action={{
              label: "Add Source",
              onClick: () => setDrawerOpen(true),
            }}
          />
        ) : (
          <Card padding="none">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {sources.map((source) => (
                <div key={source.id} className="relative group">
                  <ListItem
                    icon={getIcon(source.type)}
                    iconColor={getIconColor(source.type)}
                    title={source.name}
                    subtitle={getSubtitle(source)}
                    badge={source.enabled ? "Active" : "Disabled"}
                    href={`/sources/${source.id}`}
                  />
                  <button
                    onClick={(e) => handleDelete(e, source.id)}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"
                    aria-label="Delete source"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Add Source"
          width={480}
        >
          <SourceForm
            onSuccess={handleSourceCreated}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </AppShell>
    </AuthCheck>
  );
}
