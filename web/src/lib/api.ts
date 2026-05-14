const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  llm: {
    list: () => fetchAPI("/api/llm/providers"),
    create: (data: any) => fetchAPI("/api/llm/providers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/llm/providers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/llm/providers/${id}`, { method: "DELETE" }),
  },
  agents: {
    list: () => fetchAPI("/api/agents"),
    create: (data: any) => fetchAPI("/api/agents", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/agents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/agents/${id}`, { method: "DELETE" }),
  },
  sources: {
    list: () => fetchAPI("/api/sources"),
    create: (data: any) => fetchAPI("/api/sources", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/sources/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/sources/${id}`, { method: "DELETE" }),
    run: (id: string) => fetchAPI(`/api/sources/${id}/run`, { method: "POST" }),
  },
  tasks: {
    list: (params?: { page?: number; page_size?: number; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchAPI(`/api/tasks${query ? `?${query}` : ""}`);
    },
    get: (id: string) => fetchAPI(`/api/tasks/${id}`),
    retry: (id: string) => fetchAPI(`/api/tasks/${id}/retry`, { method: "POST" }),
  },
  publishers: {
    list: () => fetchAPI("/api/publishers"),
    create: (data: any) => fetchAPI("/api/publishers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/publishers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/publishers/${id}`, { method: "DELETE" }),
  },
};
