"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface SourceFormProps {
  initialData?: {
    name: string;
    type: string;
    config: any;
    schedule: string;
    enabled: boolean;
    agent_id?: string;
  };
  isEdit?: boolean;
}

export function SourceForm({ initialData, isEdit }: SourceFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialData?.name || "",
    type: initialData?.type || "rss",
    url: initialData?.config?.url || "",
    username: initialData?.config?.username || "",
    token: initialData?.config?.token || "",
    bearer_token: initialData?.config?.bearer_token || "",
    max_items: initialData?.config?.max_items || 20,
    schedule: initialData?.schedule || "0 * * * *",
    enabled: initialData?.enabled ?? true,
    agent_id: initialData?.agent_id || "",
  });
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.agents.list().then(setAgents).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const config: any = {};
      if (form.type === "rss") {
        config.url = form.url;
        config.max_items = form.max_items;
      } else if (form.type === "github") {
        config.username = form.username;
        config.token = form.token;
      } else if (form.type === "twitter") {
        config.bearer_token = form.bearer_token;
      }

      const data = {
        name: form.name,
        type: form.type,
        config,
        schedule: form.schedule,
        enabled: form.enabled,
        agent_id: form.agent_id || null,
      };

      if (isEdit) {
        // Update - need source ID
        // await api.sources.update(id, data);
      } else {
        await api.sources.create(data);
      }
      router.push("/sources");
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="rss">RSS Feed</option>
          <option value="github">GitHub Stars</option>
          <option value="twitter">Twitter</option>
        </select>
      </div>

      {/* RSS fields */}
      {form.type === "rss" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">URL</label>
            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Items</label>
            <input type="number" value={form.max_items} onChange={(e) => setForm({ ...form, max_items: parseInt(e.target.value) })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" min="1" max="100" />
          </div>
        </>
      )}

      {/* GitHub fields */}
      {form.type === "github" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">GitHub Username</label>
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Personal Access Token</label>
            <input type="password" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
          </div>
        </>
      )}

      {/* Twitter fields */}
      {form.type === "twitter" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Bearer Token</label>
          <input type="password" value={form.bearer_token} onChange={(e) => setForm({ ...form, bearer_token: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" required />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Schedule (Cron)</label>
        <input type="text" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" placeholder="0 * * * *" />
        <p className="text-xs text-gray-500 mt-1">e.g., &quot;0 * * * *&quot; = every hour</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Agent</label>
        <select value={form.agent_id} onChange={(e) => setForm({ ...form, agent_id: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="">None</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="enabled" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="rounded" />
        <label htmlFor="enabled" className="text-sm font-medium text-gray-700">Enabled</label>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Saving..." : isEdit ? "Update" : "Create"}
      </button>
    </form>
  );
}
