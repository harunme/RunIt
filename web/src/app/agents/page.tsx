"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ArrowLeft, Plus, Trash2, Brain } from "lucide-react";
import { AuthCheck } from "@/components/AuthCheck";

interface Agent {
  id: string;
  name: string;
  source_type: string;
  llm_provider_id: string | null;
  output_format: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [agentsData, providersData] = await Promise.all([
          api.agents.list(),
          api.llm.list().catch(() => []),
        ]);
        setAgents(agentsData);
        setProviders(providersData);
      } catch (e) {
        console.error("Failed to load:", e);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    try {
      await api.agents.delete(id);
      setAgents(agents.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const getProviderName = (id: string | null) => {
    if (!id) return "None";
    const provider = providers.find((p) => p.id === id);
    return provider?.name || id;
  };

  return (
    <AuthCheck>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Agents</h1>
          </div>
          <Link href="/agents/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add Agent
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No agents configured. Click &quot;Add Agent&quot; to create one.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LLM Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Output Format</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 font-medium">{agent.name}</td>
                    <td className="px-6 py-4">{agent.source_type}</td>
                    <td className="px-6 py-4">{getProviderName(agent.llm_provider_id)}</td>
                    <td className="px-6 py-4">{agent.output_format}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(agent.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AuthCheck>
  );
}
