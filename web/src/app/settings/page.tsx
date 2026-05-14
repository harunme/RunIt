"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import { AuthCheck } from "@/components/AuthCheck";

interface Provider {
  id: string;
  name: string;
  provider: string;
  model: string;
  enabled: boolean;
  is_default: boolean;
}

export default function SettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.llm.list();
        setProviders(data);
      } catch (e) {
        console.error("Failed to load:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this provider?")) return;
    try {
      await api.llm.delete(id);
      setProviders(providers.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  return (
    <AuthCheck>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* LLM Providers Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">LLM Providers</h2>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <tr key={provider.id}>
                      <td className="px-6 py-4 font-medium">{provider.name}</td>
                      <td className="px-6 py-4">{provider.provider}</td>
                      <td className="px-6 py-4">{provider.model}</td>
                      <td className="px-6 py-4">
                        {provider.is_default && <Check className="w-4 h-4 text-green-600" />}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(provider.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {providers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No LLM providers configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Backup Settings Section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Backup Settings</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-4">
              Obsidian backup path and other backup settings will be configured here.
            </p>
          </div>
        </section>
      </main>
    </AuthCheck>
  );
}
