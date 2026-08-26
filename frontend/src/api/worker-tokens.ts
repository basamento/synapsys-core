import { apiFetch } from "@/api/client";

export type WorkerToken = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
};

export type CreatedWorkerToken = WorkerToken & {
  token: string;
};

export function listWorkerTokens() {
  return apiFetch<WorkerToken[]>("/api/auth/worker-tokens");
}

export function createWorkerToken(name: string) {
  return apiFetch<CreatedWorkerToken>("/api/auth/worker-tokens", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function revokeWorkerToken(id: string) {
  return apiFetch<void>(`/api/auth/worker-tokens/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
