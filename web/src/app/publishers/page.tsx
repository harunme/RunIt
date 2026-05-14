"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Send } from "lucide-react";
import { AuthCheck } from "@/components/AuthCheck";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { ListItem } from "@/components/features/ListItem";

interface Publisher {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
}

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.publishers.list();
        setPublishers(data);
      } catch (e) {
        console.error("Failed to load:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this publisher?")) return;
    try {
      await api.publishers.delete(id);
      setPublishers((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader
          title="Publishers"
          actions={
            <Button size="sm" disabled>
              <Send className="w-4 h-4" />
              Add Publisher
            </Button>
          }
        />

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <ListItemSkeleton key={i} avatar={false} lines={1} />
            ))}
          </div>
        ) : publishers.length === 0 ? (
          <EmptyState
            icon={<Send className="w-10 h-10" />}
            title="No publishers configured"
            description="Publishers are social media platforms where content can be automatically shared."
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {publishers.map((pub) => (
              <ListItem
                key={pub.id}
                icon={Send}
                iconColor="text-blue-600"
                title={pub.name}
                subtitle={pub.type}
                badge={pub.enabled ? "Active" : "Disabled"}
                onClick={() => handleDelete(pub.id)}
              />
            ))}
          </div>
        )}
      </AppShell>
    </AuthCheck>
  );
}
