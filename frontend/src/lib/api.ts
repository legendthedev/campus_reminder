const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function wsUrl(path: string, token: string): string {
  const base = API_BASE.replace("http", "ws");
  return `${base}${path}?token=${token}`;
}
