"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Brain, Plus } from "lucide-react";
import { AuthCheck } from "@/components/AuthCheck";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { ListItem } from "@/components/features/ListItem";

interface Agent {
  id: string;
  name: string;
  source_type: string;
  llm_provider_id: string | null;
  output_format: string;
}

interface Provider {
  id: string;
  name: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
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
      setAgents((prev) => prev.filter((a) => a.id !== id));
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
      <AppShell>
        <PageHeader
          title="Agents"
          actions={
            <Link href="/agents/new">
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Add Agent
              </Button>
            </Link>
          }
        />

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <ListItemSkeleton key={i} avatar={false} lines={1} />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <EmptyState
            icon={<Brain className="w-10 h-10" />}
            title="No agents configured"
            description="Agents are AI processing strategies that can transform and analyze content."
            action={{
              label: "Add Agent",
              onClick: () => (window.location.href = "/agents/new"),
            }}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {agents.map((agent) => (
              <ListItem
                key={agent.id}
                icon={Brain}
                iconColor="text-violet-600"
                title={agent.name}
                subtitle={`${agent.source_type} • ${getProviderName(agent.llm_provider_id)} • ${agent.output_format}`}
                badge={agent.source_type}
                onClick={() => handleDelete(agent.id)}
              />
            ))}
          </div>
        )}
      </AppShell>
    </AuthCheck>
  );
}
