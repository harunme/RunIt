"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AuthCheck } from "@/components/AuthCheck";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ListItem } from "@/components/features/ListItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { FileText } from "lucide-react";

interface Content {
  id: string;
  source_id: string;
  title: string;
  content: string;
  url: string | null;
  created_at: string;
}

export default function ContentPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      try {
        const data = await api.content.list({ page, page_size: 20 });
        setContents(data.items);
        setTotal(data.total);
      } catch (e) {
        console.error("Failed to load content:", e);
      }
      setLoading(false);
    }
    loadContent();
  }, [page]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const truncate = (text: string, max: number = 80) => {
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader title="Content" subtitle={`${total} items collected`} />

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <ListItemSkeleton key={i} avatar={true} lines={2} />
            ))}
          </div>
        ) : contents.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="No content yet"
            description="Run a data source to collect content from the web."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {contents.map((item) => (
              <ListItem
                key={item.id}
                icon={FileText}
                title={truncate(item.title, 60)}
                subtitle={`${truncate(item.content.replace(/<[^>]*>/g, ""), 80)} • ${formatDate(item.created_at)}`}
                href={item.url || undefined}
                onClick={item.url ? undefined : () => {}}
              />
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
              disabled={contents.length < 20}
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
