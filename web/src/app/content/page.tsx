"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { AuthCheck } from "@/components/AuthCheck";

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    try {
      await api.content.delete(id);
      setContents(contents.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const truncate = (text: string, max: number = 100) => {
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  return (
    <AuthCheck>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Content</h1>
          <span className="text-gray-500">({total} items)</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : contents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No content yet. Run a data source to collect content.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contents.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {truncate(item.title, 40)}
                            </a>
                          )}
                          {!item.url && <span>{truncate(item.title, 40)}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {truncate(item.content.replace(/<[^>]*>/g, ""), 60)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white rounded shadow disabled:opacity-50">
                Previous
              </button>
              <span>Page {page} of {Math.ceil(total / 20)}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={contents.length < 20} className="px-4 py-2 bg-white rounded shadow disabled:opacity-50">
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </AuthCheck>
  );
}
