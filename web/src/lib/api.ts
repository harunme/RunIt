export interface TaskLog {
  id: string;
  task_id: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
  created_at: string;
}

export interface TaskContent {
  id: string;
  task_id: string;
  source_id: string;
  title: string;
  content: string;
  url: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  source_id: string;
  source_name: string | null;
  status: "pending" | "running" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "runit_token";

export const auth = {
  getToken: () => typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  setToken: (token: string) => typeof window !== "undefined" && localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => typeof window !== "undefined" && localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: () => typeof window !== "undefined" && !!localStorage.getItem(TOKEN_KEY),
};

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = auth.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.headers) {
    const h = options.headers as Record<string, string>;
    Object.assign(headers, h);
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    auth.removeToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

// Auth API
export const authApi = {
  register: (email: string, password: string) =>
    fetchAPI("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    fetchAPI("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => fetchAPI("/api/auth/logout", { method: "POST" }),
  me: () => fetchAPI("/api/auth/me"),
};

export const api = {
  auth: authApi,
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
    list: (params?: { page?: number; page_size?: number; status?: string; source_id?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
      if (params?.status) searchParams.set('status', params.status);
      if (params?.source_id) searchParams.set('source_id', params.source_id);
      const query = searchParams.toString();
      return fetchAPI(`/api/tasks${query ? `?${query}` : ""}`);
    },
    get: (id: string) => fetchAPI(`/api/tasks/${id}`),
    retry: (id: string) => fetchAPI(`/api/tasks/${id}/retry`, { method: "POST" }),
    getLogs: (id: string, params?: { page?: number; page_size?: number; level?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchAPI(`/api/tasks/${id}/logs${query ? `?${query}` : ""}`);
    },
    getContents: (id: string, params?: { page?: number; page_size?: number }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchAPI(`/api/tasks/${id}/contents${query ? `?${query}` : ""}`);
    },
  },
  publishers: {
    list: () => fetchAPI("/api/publishers"),
    create: (data: any) => fetchAPI("/api/publishers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/api/publishers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/api/publishers/${id}`, { method: "DELETE" }),
  },
  content: {
    list: (params?: { page?: number; page_size?: number; source_id?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return fetchAPI(`/api/content${query ? `?${query}` : ""}`);
    },
    delete: (id: string) => fetchAPI(`/api/content/${id}`, { method: "DELETE" }),
  },
};
