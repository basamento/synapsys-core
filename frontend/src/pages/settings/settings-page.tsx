import { Check, Copy, KeyRound, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import {
  createWorkerToken,
  listWorkerTokens,
  revokeWorkerToken,
  type CreatedWorkerToken,
  type WorkerToken,
} from "@/api/worker-tokens";
import { Panel, PanelRow } from "@/components/cortex/panel";
import { PageHeader } from "@/components/listing/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDateTime, metaLine } from "@/lib/format";

export function SettingsPage() {
  const [tokens, setTokens] = useState<WorkerToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<CreatedWorkerToken | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<WorkerToken | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    void refreshTokens();
  }, []);

  async function refreshTokens() {
    try {
      setTokens(await listWorkerTokens());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load worker tokens");
    } finally {
      setLoading(false);
    }
  }

  async function generateToken() {
    setCreating(true);
    try {
      const nextToken = await createWorkerToken(tokenName.trim());
      setTokens((current) => [nextToken, ...current]);
      setCreatedToken(nextToken);
      setTokenName("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create worker token");
    } finally {
      setCreating(false);
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revokeWorkerToken(revokeTarget.id);
      setTokens((current) =>
        current.map((token) =>
          token.id === revokeTarget.id ? { ...token, revokedAt: new Date().toISOString() } : token,
        ),
      );
      setRevokeTarget(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to revoke worker token");
    } finally {
      setRevoking(false);
    }
  }

  const activeCount = tokens.filter((token) => !token.revokedAt).length;

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4">
      <PageHeader
        title="Settings"
        meta={metaLine("Operator access and worker credentials", `${activeCount} active tokens`)}
      />

      <Panel
        title="Worker tokens"
        description="Tokens authenticate workers when they send heartbeats to Core."
        aside={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden />
            Generate token
          </Button>
        }
      >
        <div className="flex flex-col gap-2.5">
          {loading ? (
            <p className="py-5 type-body-md text-muted-foreground">Loading tokens…</p>
          ) : tokens.length === 0 ? (
            <EmptyTokens onCreate={() => setCreateOpen(true)} />
          ) : (
            tokens.map((token) => (
              <TokenRow key={token.id} token={token} onRevoke={() => setRevokeTarget(token)} />
            ))
          )}
        </div>
        {error && <p className="pt-3 type-body-sm text-failed-fg">{error}</p>}
      </Panel>

      <Panel
        title="Worker configuration"
        description="Pass the token to a worker through its secret configuration."
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.75 rounded-md border border-edge bg-subtle px-3.5 py-3">
            <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-faint" />
            <code className="min-w-0 break-all type-mono-sm text-body">
              {"synapsys.core-token: ${SYNAPSYS_CORE_TOKEN}"}
            </code>
          </div>
          <p className="type-body-sm text-muted-foreground">
            Copy a generated token once, then provide it as <code className="type-mono-sm">SYNAPSYS_CORE_TOKEN</code> to the worker process.
          </p>
        </div>
      </Panel>

      <Panel
        title="About Synapsys Core"
        description="Ownership and licensing information for this installation."
      >
        <div className="flex flex-col gap-1.5 type-body-sm text-muted-foreground">
          <p className="font-semibold text-heading">© 2026 Julian Marzoli (Basamento).</p>
          <p>Synapsys Core is proprietary software. All rights reserved.</p>
          <p>The license terms supplied with your distribution control your permitted use.</p>
        </div>
      </Panel>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreatedToken(null);
            setTokenName("");
          }
        }}
      >
        <DialogContent>
          {createdToken ? (
            <CreatedToken token={createdToken} />
          ) : (
            <>
              <div className="flex flex-col gap-1.25">
                <DialogTitle>Generate worker token</DialogTitle>
                <DialogDescription>
                  Give the token a label so it can be identified and revoked later.
                </DialogDescription>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="type-eyebrow uppercase text-faint">Token name</span>
                <Input
                  autoFocus
                  maxLength={128}
                  placeholder="Production worker"
                  value={tokenName}
                  onChange={(event) => setTokenName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void generateToken();
                  }}
                />
              </label>
              <DialogActions>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={creating} onClick={() => void generateToken()}>
                  {creating ? "Generating…" : "Generate"}
                </Button>
              </DialogActions>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={revokeTarget !== null} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent>
          <div className="flex flex-col gap-1.25">
            <DialogTitle>Revoke {revokeTarget?.name}?</DialogTitle>
            <DialogDescription>
              Workers using this token will be rejected on their next heartbeat. This cannot be undone.
            </DialogDescription>
          </div>
          <DialogActions>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button disabled={revoking} variant="destructive" onClick={() => void confirmRevoke()}>
              {revoking ? "Revoking…" : "Revoke"}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyTokens({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-edge-strong bg-subtle px-3.5 py-4">
      <div className="flex items-center gap-2.25">
        <ShieldCheck aria-hidden className="size-4 text-faint" />
        <span className="type-body-md font-semibold text-heading">No worker tokens yet.</span>
      </div>
      <p className="type-body-sm text-muted-foreground">Generate one to authenticate a worker heartbeat.</p>
      <Button variant="outline" onClick={onCreate}>
        Generate token
      </Button>
    </div>
  );
}

function TokenRow({ token, onRevoke }: { token: WorkerToken; onRevoke: () => void }) {
  const revoked = Boolean(token.revokedAt);

  return (
    <PanelRow className="items-start sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-2.25">
        <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0 text-faint" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate type-body-md font-semibold text-heading">{token.name}</span>
          <span className="type-mono-sm text-faint">
            created {formatDateTime(token.createdAt)}
            {token.lastUsedAt ? ` · used ${formatDateTime(token.lastUsedAt)}` : " · not used"}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={`type-eyebrow uppercase ${revoked ? "text-failed-fg" : "text-running-fg"}`}>
          {revoked ? "Revoked" : "Active"}
        </span>
        {!revoked && (
          <Button variant="outline" size="sm" onClick={onRevoke}>
            Revoke
          </Button>
        )}
      </div>
    </PanelRow>
  );
}

function CreatedToken({ token }: { token: CreatedWorkerToken }) {
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    await navigator.clipboard.writeText(token.token);
    setCopied(true);
  }

  return (
    <>
      <div className="flex flex-col gap-1.25">
        <DialogTitle>Worker token created</DialogTitle>
        <DialogDescription>
          Copy this token now. Core will not show the token again.
        </DialogDescription>
      </div>
      <div className="flex flex-col gap-2.25">
        <code className="max-h-28 overflow-auto rounded-md border border-edge bg-subtle px-3 py-2.5 type-mono-sm break-all text-body">
          {token.token}
        </code>
        <Button onClick={() => void copyToken()}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Copied" : "Copy token"}
        </Button>
      </div>
    </>
  );
}
