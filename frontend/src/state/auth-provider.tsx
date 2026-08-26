import { useEffect, useMemo, useState, type ReactNode } from "react";

import { getAuthSession, login, logout } from "@/api/auth";
import { ApiError } from "@/api/client";
import { AuthContext, type AuthContextValue } from "@/state/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Awaited<ReturnType<typeof getAuthSession>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession(null);
      setError(null);
    };
    window.addEventListener("synapsys:unauthorized", handleUnauthorized);

    void getAuthSession()
      .then((nextSession) => {
        setSession(nextSession.authenticated ? nextSession : null);
        setError(null);
      })
      .catch((err) => {
        setSession(null);
        setError(
          err instanceof ApiError && err.status === 401
            ? null
            : err instanceof Error
              ? err.message
              : "Unable to contact Synapsys Core",
        );
      })
      .finally(() => setLoading(false));

    return () => window.removeEventListener("synapsys:unauthorized", handleUnauthorized);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      error,
      signIn: async (username, password) => {
        const nextSession = await login(username, password);
        setSession(nextSession);
        setError(null);
      },
      signOut: async () => {
        try {
          await logout();
        } finally {
          setSession(null);
        }
      },
    }),
    [error, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
