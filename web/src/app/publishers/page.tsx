"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { AuthCheck } from "@/components/AuthCheck";

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
      setPublishers(publishers.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
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
            <h1 className="text-2xl font-bold">Publishers</h1>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Publisher
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : publishers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No publishers configured. Click &quot;Add Publisher&quot; to add a social media platform.
          </div>
        ) : (
          <div className="space-y-4">
            {publishers.map((pub) => (
              <div key={pub.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{pub.name}</h3>
                    <p className="text-sm text-gray-500">{pub.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDelete(pub.id)} className="text-red-600 hover:bg-red-50 p-2 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className={`px-2 py-1 text-xs rounded-full ${pub.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {pub.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AuthCheck>
  );
}
