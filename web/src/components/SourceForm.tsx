"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface SourceFormProps {
  sourceId?: string;
  initialData?: {
    name: string;
    type: string;
    config: any;
    schedule: string;
    enabled: boolean;
    agent_id?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SourceForm({ sourceId, initialData, onSuccess, onCancel }: SourceFormProps) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    type: initialData?.type || "rss",
    url: initialData?.config?.url || "",
    username: initialData?.config?.username || "",
    token: initialData?.config?.token || "",
    bearer_token: initialData?.config?.bearer_token || "",
    max_items: initialData?.config?.max_items || 20,
    schedule: initialData?.schedule || "hourly",
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

      if (sourceId) {
        await api.sources.update(sourceId, data);
      } else {
        await api.sources.create(data);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: "rss", label: "RSS Feed" },
    { value: "github", label: "GitHub Stars" },
    { value: "twitter", label: "Twitter" },
  ];

  const scheduleOptions = [
    { value: "*/15 * * * *", label: "Every 15 minutes" },
    { value: "*/30 * * * *", label: "Every 30 minutes" },
    { value: "hourly", label: "Every hour" },
    { value: "daily", label: "Once a day" },
    { value: "weekly", label: "Once a week" },
  ];

  const agentOptions = [
    { value: "", label: "None" },
    ...agents.map((agent) => ({ value: agent.id, label: agent.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        label="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="My RSS Feed"
        required
      />

      <Select
        label="Type"
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value })}
        options={typeOptions}
      />

      {/* RSS fields */}
      {form.type === "rss" && (
        <>
          <Input
            label="URL"
            type="url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://example.com/feed.xml"
            required
          />
          <Input
            label="Max Items"
            type="number"
            value={form.max_items}
            onChange={(e) => setForm({ ...form, max_items: parseInt(e.target.value) || 20 })}
            min={1}
            max={100}
          />
        </>
      )}

      {/* GitHub fields */}
      {form.type === "github" && (
        <>
          <Input
            label="GitHub Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="username"
            required
          />
          <Input
            label="Personal Access Token"
            type="password"
            value={form.token}
            onChange={(e) => setForm({ ...form, token: e.target.value })}
            placeholder="ghp_..."
            required
          />
        </>
      )}

      {/* Twitter fields */}
      {form.type === "twitter" && (
        <Input
          label="Bearer Token"
          type="password"
          value={form.bearer_token}
          onChange={(e) => setForm({ ...form, bearer_token: e.target.value })}
          placeholder="AAAAAAAAAAAAAAAA..."
          required
        />
      )}

      <Select
        label="Schedule"
        value={form.schedule}
        onChange={(e) => setForm({ ...form, schedule: e.target.value })}
        options={scheduleOptions}
      />

      {agents.length > 0 && (
        <Select
          label="Agent"
          value={form.agent_id}
          onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
          options={agentOptions}
        />
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? "Update" : "Create"} Source
        </Button>
      </div>
    </form>
  );
}
