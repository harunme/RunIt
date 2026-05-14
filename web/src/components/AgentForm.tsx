"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface AgentFormProps {
  initialData?: {
    name: string;
    source_type: string;
    llm_provider_id: string | null;
    prompt_template: string;
    output_format: string;
  };
}

export function AgentForm({ initialData }: AgentFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initialData?.name || "",
    source_type: initialData?.source_type || "rss",
    llm_provider_id: initialData?.llm_provider_id || "",
    prompt_template: initialData?.prompt_template || "Summarize the following content:\n\n{content}",
    output_format: initialData?.output_format || "markdown",
  });
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.llm.list().then(setProviders).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.agents.create({
        ...form,
        llm_provider_id: form.llm_provider_id || null,
      });
      router.push("/agents");
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
        <label className="block text-sm font-medium text-gray-700">Source Type</label>
        <select value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="rss">RSS</option>
          <option value="github">GitHub</option>
          <option value="twitter">Twitter</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">LLM Provider</label>
        <select value={form.llm_provider_id} onChange={(e) => setForm({ ...form, llm_provider_id: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="">None</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.model})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Prompt Template</label>
        <textarea value={form.prompt_template} onChange={(e) => setForm({ ...form, prompt_template: e.target.value })} rows={6} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm" />
        <p className="text-xs text-gray-500 mt-1">Use {`{content}`} to reference the content being processed.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Output Format</label>
        <select value={form.output_format} onChange={(e) => setForm({ ...form, output_format: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
          <option value="markdown">Markdown</option>
          <option value="html">HTML</option>
        </select>
      </div>

      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Saving..." : "Create"}
      </button>
    </form>
  );
}
