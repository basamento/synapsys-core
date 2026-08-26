import { apiFetch } from "@/api/client";

export type AuthSession = {
  authenticated: boolean;
  username?: string;
};

export function getAuthSession() {
  return apiFetch<AuthSession>("/api/auth/session");
}

export function login(username: string, password: string) {
  return apiFetch<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return apiFetch<void>("/api/auth/logout", { method: "POST" });
}
