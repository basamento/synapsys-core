import { useState, type FormEvent, type ReactNode } from "react";

import { BrandLockup } from "@/components/cortex/brand-lockup";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/state/auth-context";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, error } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!session) {
    return <LoginPage initialError={error} />;
  }

  return children;
}

function AuthLoading() {
  return (
    <div className="grid min-h-svh place-items-center bg-canvas px-5">
      <p className="type-body-md text-muted-foreground">Connecting to Synapsys Core…</p>
    </div>
  );
}

function LoginPage({ initialError }: { initialError: string | null }) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn(username, password);
    } catch (err) {
      setError(err instanceof Error ? "Invalid username or password" : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-canvas px-5 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <BrandLockup />
        <Card>
          <CardHeader className="flex-col gap-1.5 px-5 pt-5">
            <CardTitle className="type-display-sm">Sign in</CardTitle>
            <CardDescription>Authenticate to close the Cortex console.</CardDescription>
          </CardHeader>
          <CardBody>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1.5">
                <span className="type-eyebrow uppercase text-faint">Username</span>
                <Input
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="type-eyebrow uppercase text-faint">Password</span>
                <Input
                  autoComplete="current-password"
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              {error && <p className="type-body-sm text-failed-fg">{error}</p>}
              <Button disabled={submitting} size="lg" type="submit">
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
