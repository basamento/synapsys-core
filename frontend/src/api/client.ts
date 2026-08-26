// In dev the console runs on Vite's port and the core on its own, so requests
// need an absolute base. In production the core serves the built bundle itself
// and same-origin requests are correct.
const API_BASE = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE ?? "http://localhost:8080")
  : "";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  // Only set Content-Type when sending a body.
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const method = (options.method ?? "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && !headers.has("X-CSRF-Token")) {
    const token = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("synapsys_csrf="))
      ?.slice("synapsys_csrf=".length);
    if (token) {
      headers.set("X-CSRF-Token", decodeURIComponent(token));
    }
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });

  if (res.status === 401) {
    window.dispatchEvent(new Event("synapsys:unauthorized"));
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, `API ${res.status}: ${text}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
